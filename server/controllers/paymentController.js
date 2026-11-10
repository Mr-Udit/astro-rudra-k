import crypto from "crypto";
import mongoose from "mongoose";
import razorpay from "../services/razorpayclient.js";
import verifySignature from "../services/verifySignature.js";
import PaymentModel from "../models/PaymentModel.js";
import { Booking } from "../models/BookingModel.js";
import { generatePaymentId } from "../utils/paymentIdGenerator.js";
import { logger } from "../utils/logger.js";
import {
  paymentOrderCreatedCounter,
  paymentStatusCounter,
  webhookEventsCounter,
} from "../monitoring/metrics.js";

const TERMINAL_STATUSES = new Set(["captured", "refunded", "cancelled"]);

const mapRazorpayStatus = (eventType, paymentStatus) => {
  if (eventType === "payment.captured" || paymentStatus === "captured") {
    return "captured";
  }

  if (
    eventType === "payment.failed" ||
    eventType === "payment.cancelled" ||
    paymentStatus === "failed"
  ) {
    return "failed";
  }

  if (eventType === "payment.authorized" || paymentStatus === "authorized") {
    return "authorized";
  }

  return "processing";
};

export const createOrder = async (req, res) => {
  try {
    const { bookingId, idempotencyKey } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        message: "bookingId is required",
      });
    }

    const booking = await Booking.findOne(
      { _id: bookingId, userId: req.user.id },
      {
        price: 1,
        status: 1,
        bookingId: 1,
        userName: 1,
        userEmail: 1,
        userPhone: 1,
      },
    ).lean();

    if (!booking) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found for user",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        ok: false,
        message: "Booking is not payable",
      });
    }

    const safeAmount = Math.max(0, Math.round(booking.price * 100));

    const idemKey = idempotencyKey || `booking:${bookingId}`;

    // Reuse existing in-flight payment if present
    const existing = await PaymentModel.findOne({
      $or: [
        { idempotencyKey: idemKey },
        {
          bookingId,
          status: { $in: ["created", "authorized", "processing"] },
        },
      ],
    }).lean();

    if (existing) {
      if (existing.status === "captured") {
        return res.status(409).json({
          ok: false,
          message: "Booking already paid",
          data: {
            orderId: existing.razorpayOrderId,
            paymentId: existing.razorpayPaymentId,
          },
        });
      }

      return res.json({
        ok: true,
        orderId: existing.razorpayOrderId,
        amount: safeAmount,
        currency: existing.currency || "INR",
        key: process.env.RAZORPAY_KEY_ID,
        bookingId: existing.bookingId,
        status: existing.status,
        idempotencyKey: existing.idempotencyKey,
      });
    }

    let order;

    try {
      order = await razorpay.orders.create({
        amount: safeAmount,
        currency: "INR",
        receipt: booking.bookingId || `booking_${bookingId}`,
        notes: {
          bookingId: booking.bookingId || bookingId,
          userId: req.user.id.toString(),
        },
        payment_capture: 1,
      });
    } catch (gatewayError) {
      console.log("Razorpay order creation failed", gatewayError);
      logger.error("Razorpay order creation failed", {
        error: gatewayError.message,
      });
      paymentOrderCreatedCounter.inc({ status: "failure" });
      return res.status(502).json({
        ok: false,
        message: "Failed to create payment order with gateway",
      });
    }

    const paymentId = generatePaymentId();

    try {
      await PaymentModel.create({
        paymentId,
        idempotencyKey: idemKey,
        bookingId,
        userId: req.user.id,
        userName: req.user.fullName || req.user.username,
        amount: safeAmount / 100,
        currency: order.currency,
        status: "created",
        gateway: "razorpay",
        razorpayOrderId: order.id,
        receipt: order.receipt,
        notes: order.notes,
      });
    } catch (dbError) {
      // Handle concurrent idempotent requests: reuse existing record
      if (dbError.code === 11000) {
        logger.warn("Payment create duplicate detected, reusing existing payment", {
          bookingId,
          idempotencyKey: idemKey,
        });

        const reused = await PaymentModel.findOne({
          $or: [
            { idempotencyKey: idemKey },
            {
              bookingId,
              status: { $in: ["created", "authorized", "processing"] },
            },
          ],
        }).lean();

        if (reused) {
          paymentOrderCreatedCounter.inc({ status: "reused" });
          return res.json({
            ok: true,
            orderId: reused.razorpayOrderId,
            amount: safeAmount,
            currency: reused.currency || "INR",
            key: process.env.RAZORPAY_KEY_ID,
            bookingId: reused.bookingId,
            status: reused.status,
            idempotencyKey: reused.idempotencyKey,
          });
        }
      }

      logger.error("Error persisting payment order", {
        error: dbError.message,
      });
      paymentOrderCreatedCounter.inc({ status: "failure" });
      return res.status(500).json({
        ok: false,
        message: "Failed to persist payment order",
      });
    }

    logger.info("Razorpay order created", {
      orderId: order.id,
      bookingId,
      userId: req.user.id,
    });

    paymentOrderCreatedCounter.inc({ status: "success" });

    return res.json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      bookingId,
      status: "created",
      idempotencyKey: idemKey,
    });
  } catch (error) {
    logger.error("Error creating order", { error: error.message, stack: error.stack });
    return res.status(500).json({
      ok: false,
      message: "Failed to create payment order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message: "orderId, paymentId and signature are required",
    });
  }

  const payment = await PaymentModel.findOne({ razorpayOrderId: orderId });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment order not found",
    });
  }

  // Short-circuit if already in a terminal state
  if (payment.status === "captured") {
    paymentStatusCounter.inc({ source: "verify", status: "captured" });
    return res.json({
      success: true,
      orderId,
      paymentId: payment.razorpayPaymentId,
      status: payment.status,
    });
  }

  if (payment.status === "refunded" || payment.status === "cancelled") {
    paymentStatusCounter.inc({ source: "verify", status: payment.status });
    return res.status(409).json({
      success: false,
      orderId,
      paymentId: payment.razorpayPaymentId,
      status: payment.status,
      message: "Payment is already refunded or cancelled",
    });
  }

  const valid = verifySignature(orderId, paymentId, signature);

  if (!valid) {
    await PaymentModel.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: "failed",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          error: {
            code: "SIGNATURE_MISMATCH",
            message: "Payment signature validation failed",
            source: "verify",
          },
          lastEventSource: "verify",
        },
        $inc: { verifyAttempts: 1 },
      },
    );

    paymentStatusCounter.inc({ source: "verify", status: "failed" });
    return res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }

  const session = await mongoose.startSession();
  let updatedPayment;

  await session.withTransaction(async () => {
    updatedPayment = await PaymentModel.findOneAndUpdate(
      {
        _id: payment._id,
        status: { $nin: Array.from(TERMINAL_STATUSES) },
      },
      {
        $set: {
          status: "captured",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          capturedAt: new Date(),
          lastEventSource: "verify",
          error: null,
        },
        $inc: { verifyAttempts: 1 },
      },
      { new: true, session },
    );

    if (!updatedPayment) {
      updatedPayment = await PaymentModel.findById(payment._id).session(session);
    }

    if (updatedPayment?.status === "captured") {
      paymentStatusCounter.inc({ source: "verify", status: "captured" });
      await Booking.updateOne(
        {
          _id: updatedPayment.bookingId,
          status: { $in: ["pending", "confirmed"] },
        },
        {
          $set: { status: "confirmed" },
        },
        { session },
      );
    }
  });

  session.endSession();

  if (updatedPayment?.status) {
    paymentStatusCounter.inc({ source: "verify", status: updatedPayment.status });
  }

  return res.json({
    success: updatedPayment?.status === "captured",
    orderId,
    paymentId,
    status: updatedPayment?.status,
  });
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({
        ok: false,
        message: "Webhook signature missing",
      });
    }

    const rawBody = req.body; // Buffer (express.raw)

    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (computedSignature !== signature) {
      logger.warn("Webhook signature mismatch");
      return res.status(400).json({ ok: false, message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventId = event.id;
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;
    const isRefundEvent =
      eventType === "refund.processed" || eventType === "refund.failed";

    if (!isRefundEvent && !paymentEntity?.order_id) {
      return res.status(200).json({ ok: true });
    }

    const statusFromEvent = isRefundEvent
      ? null
      : mapRazorpayStatus(eventType, paymentEntity.status);
    let refundEmail;

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const payment = await PaymentModel.findOne({
        ...(isRefundEvent
          ? { razorpayPaymentId: refundEntity?.payment_id }
          : { razorpayOrderId: paymentEntity.order_id }),
      }).session(session);

      if (!payment) {
        logger.warn("Webhook for unknown payment", {
          orderId: paymentEntity?.order_id,
          paymentId: refundEntity?.payment_id,
          eventType,
        });
        webhookEventsCounter.inc({ event: eventType, result: "unknown_payment" });
        return;
      }

      // Deduplicate webhook deliveries
      if (payment.lastWebhookEventId === eventId) {
        webhookEventsCounter.inc({ event: eventType, result: "ignored" });
        return;
      }

      const update = {
        lastWebhookEventId: eventId,
        lastEventSource: "webhook",
        razorpayPaymentId:
          paymentEntity?.id || payment.razorpayPaymentId,
        webhookDeliveries: (payment.webhookDeliveries || 0) + 1,
      };

      // Push the latest event (keep last 10)
      const pushEvent = {
        event: eventType,
        status: paymentEntity?.status || refundEntity?.status,
        receivedAt: new Date(),
        payload: {
          id: paymentEntity?.id || refundEntity?.id,
          amount: paymentEntity?.amount || refundEntity?.amount,
          currency: paymentEntity?.currency || refundEntity?.currency,
          status: paymentEntity?.status || refundEntity?.status,
          error_code: paymentEntity?.error_code || refundEntity?.error_code,
          error_description:
            paymentEntity?.error_description || refundEntity?.error_description,
        },
        signatureValid: true,
      };

      if (isRefundEvent && refundEntity?.id) {
              const refundStatus = eventType === "refund.processed" ? "processed" : "failed";
              if (!payment.refunds) payment.refunds = [];
              const existingRefund = payment.refunds.find(
                (refund) => refund.refundId === refundEntity.id,
              );
        const wasProcessed = existingRefund?.status === "processed";

        if (existingRefund) {
          existingRefund.status = refundStatus;
          existingRefund.amount = refundEntity.amount / 100;
          if (refundStatus === "processed") existingRefund.processedAt = new Date();
          if (refundStatus === "failed") {
            existingRefund.failedAt = new Date();
            existingRefund.failureReason =
              refundEntity.error_description || "Razorpay refund failed";
          }
        } else {
          payment.refunds.push({
            refundId: refundEntity.id,
            amount: refundEntity.amount / 100,
            status: refundStatus,
            requestedAt: new Date(),
            ...(refundStatus === "processed"
              ? { processedAt: new Date() }
              : {
                  failedAt: new Date(),
                  failureReason:
                    refundEntity.error_description || "Razorpay refund failed",
                }),
          });
        }

        payment.refundedAmount = Math.round(
                  payment.refunds
                    .filter((refund) => refund.status === "processed")
                    .reduce((total, refund) => total + Number(refund.amount || 0), 0) * 100
                ) / 100;
        if (payment.refundedAmount >= payment.amount) {
          payment.status = "refunded";
        }
        payment.lastWebhookEventId = eventId;
        payment.lastEventSource = "webhook";
        payment.webhookDeliveries = (payment.webhookDeliveries || 0) + 1;
        payment.webhookEvents.push(pushEvent);
        payment.webhookEvents = payment.webhookEvents.slice(-10);
        await payment.save({ session });

        const booking = await Booking.findOneAndUpdate(
          {
            _id: payment.bookingId,
            "cancellation.refundState": { $in: ["approved", "failed"] },
          },
          {
            $set: {
              "cancellation.refundState": refundStatus,
              "cancellation.razorpayRefundId": refundEntity.id,
              ...(refundStatus === "processed"
                ? { "cancellation.processedAt": new Date() }
                : {
                    "cancellation.failedAt": new Date(),
                    "cancellation.failureReason":
                      refundEntity.error_description || "Razorpay refund failed",
                  }),
            },
            $unset: { "cancellation.approvalClaimedAt": 1 },
          },
          { new: true, session },
        );
        if (booking && (!wasProcessed || refundStatus === "failed")) {
          refundEmail = {
            email: booking.userEmail,
            event: refundStatus,
            amount: refundEntity.amount / 100,
            bookingId: booking.bookingId,
          };
        }
        return;
      }

      // Enforce monotonic status progression: do not downgrade from final states
      const currentStatus = payment.status;
      const isCurrentlyFinal = TERMINAL_STATUSES.has(currentStatus);
      const isNewFinal = TERMINAL_STATUSES.has(statusFromEvent);

      if (statusFromEvent !== currentStatus) {
        // Never move away from captured/refunded/cancelled to a less final state
        if (
          isCurrentlyFinal &&
          (!isNewFinal || currentStatus === "captured") &&
          statusFromEvent !== currentStatus
        ) {
          // keep status as-is but still record webhook event
        } else {
          update.status = statusFromEvent;

          if (statusFromEvent === "captured") {
            update.capturedAt = new Date();
          }

          if (statusFromEvent === "failed") {
            update.error = {
              code: paymentEntity.error_code || "PAYMENT_FAILED",
              message: paymentEntity.error_description || "Payment failed",
              source: "webhook",
            };
          }
        }
      }

      await PaymentModel.updateOne(
        { _id: payment._id },
        {
          $set: update,
          $push: {
            webhookEvents: { $each: [pushEvent], $slice: -10 },
          },
        },
        { session },
      );

      if (statusFromEvent === "captured") {
        paymentStatusCounter.inc({ source: "webhook", status: "captured" });
        await Booking.updateOne(
          {
            _id: payment.bookingId,
            status: { $in: ["pending", "confirmed"] },
          },
          { $set: { status: "confirmed" } },
          { session },
        );
      }
    });

    session.endSession();
    if (refundEmail) {
      try {
        const { sendRefundNotification } = await import("../utils/sendEmailUtil.js");
        await sendRefundNotification(
          refundEmail.email,
          refundEmail.event,
          refundEmail.amount,
          refundEmail.bookingId,
        );
      } catch (error) {
        logger.error("Refund completion email failed", { error: error.message });
      }
    }
    webhookEventsCounter.inc({ event: eventType, result: "processed" });
    if (statusFromEvent) {
      paymentStatusCounter.inc({ source: "webhook", status: statusFromEvent });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error("Webhook processing failed", { error: err.message });
    return res.status(500).json({ ok: false });
  }
};
