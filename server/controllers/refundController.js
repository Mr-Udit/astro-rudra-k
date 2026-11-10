import mongoose from "mongoose";
import razorpay from "../services/razorpayclient.js";
import Payment from "../models/PaymentModel.js";
import { Booking } from "../models/BookingModel.js";
import { logger } from "../utils/logger.js";

const sendRefundEmail = async (booking, event, amount) => {
  try {
    const { sendRefundNotification } = await import("../utils/sendEmailUtil.js");
    await sendRefundNotification(
      booking.userEmail,
      event,
      amount,
      booking.bookingId,
    );
  } catch (error) {
    logger.error("Refund email delivery failed", {
      bookingId: booking.bookingId,
      error: error.message,
    });
  }
};

const isValidAmount = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0;

const refundableAmount = (payment) =>
  Math.max(0, Number(payment.amount || 0) - Number(payment.refundedAmount || 0));

export const listRefundRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({
      "cancellation.refundState": { $in: ["requested", "failed", "approved"] },
      $or: [
        { "cancellation.refundState": { $in: ["requested", "failed"] } },
        {
          "cancellation.refundState": "approved",
          "cancellation.razorpayRefundId": { $exists: false },
          $or: [
            { "cancellation.approvalClaimedAt": { $exists: false } },
            {
              "cancellation.approvalClaimedAt": {
                $lt: new Date(Date.now() - 5 * 60 * 1000),
              },
            },
          ],
        },
      ],
    })
      .select(
        "bookingId userName userEmail price status bookingDate bookingTime cancellation",
      )
      .sort({ "cancellation.requestedAt": 1 })
      .lean();
    const payments = await Payment.find({
      bookingId: { $in: bookings.map((booking) => booking._id) },
    })
      .select("bookingId amount status refundedAmount")
      .lean();
    const paymentByBooking = new Map(
      payments.map((payment) => [String(payment.bookingId), payment]),
    );
    const requests = bookings.map((booking) => ({
      ...booking,
      paidAmount: paymentByBooking.get(String(booking._id))?.amount || 0,
      paymentStatus: paymentByBooking.get(String(booking._id))?.status || "missing",
    }));

    return res.json({ ok: true, data: requests });
  } catch (error) {
    logger.error("Refund request listing failed", { error: error.message });
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch refund requests",
    });
  }
};

export const approveRefund = async (req, res) => {
  const { id } = req.params;
  const requestedAmount = req.body.amount;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ ok: false, message: "Invalid booking ID" });
  }

  try {
    const booking = await Booking.findOne({
      _id: id,
      "cancellation.refundState": { $in: ["requested", "failed", "approved"] },
    });

    if (!booking) {
      return res.status(409).json({
        ok: false,
        message: "Refund request is no longer actionable",
      });
    }

    if (booking.cancellation.refundState === "processed") {
      return res.json({
        ok: true,
        message: "Refund was already processed",
        data: booking,
      });
    }
    if (
      booking.cancellation.refundState === "approved" &&
      booking.cancellation.razorpayRefundId
    ) {
      return res.status(409).json({
        ok: false,
        message: "Refund is already approved and awaiting Razorpay confirmation",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: ["captured", "refunded"] },
      razorpayPaymentId: { $exists: true, $ne: null },
    });

    if (!payment || payment.status === "refunded") {
      return res.status(409).json({
        ok: false,
        message: "A captured payment with a refundable balance was not found",
      });
    }

    const receipt = `refund_${booking.bookingId}`;
    const existing = await razorpay.payments.fetchMultipleRefund(
      payment.razorpayPaymentId,
      { count: 100 },
    );
    const alreadyCreated = (existing.items || []).find(
      (refund) =>
        refund.receipt === receipt ||
        refund.notes?.bookingId === booking.bookingId,
    );

    if (alreadyCreated) {
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            "cancellation.refundState":
              alreadyCreated.status === "processed" ? "processed" : "approved",
            "cancellation.approvedAmount": alreadyCreated.amount / 100,
            "cancellation.razorpayRefundId": alreadyCreated.id,
            "cancellation.adminId": req.user.id,
            "cancellation.approvedAt": booking.cancellation.approvedAt || new Date(),
            ...(alreadyCreated.status === "processed"
              ? { "cancellation.processedAt": new Date() }
              : {}),
          },
        },
      );
      return res.json({
        ok: true,
        message: "Existing Razorpay refund linked to this request",
        data: { refundId: alreadyCreated.id, status: alreadyCreated.status },
      });
    }

    const gatewayRefunded = (existing.items || [])
      .filter((refund) => ["created", "processed"].includes(refund.status))
      .reduce((total, refund) => total + Number(refund.amount || 0) / 100, 0);
    const maximum = Math.max(
      0,
      Number(payment.amount || 0) - Math.max(Number(payment.refundedAmount || 0), gatewayRefunded),
    );
    const amount = requestedAmount === undefined
      ? Number(booking.cancellation.requestedAmount || booking.cancellation.refundAmount)
      : Number(requestedAmount);

    if (!isValidAmount(amount) || amount > maximum) {
      return res.status(400).json({
        ok: false,
        message: `Refund amount must be greater than zero and no more than ₹${maximum.toFixed(2)}`,
      });
    }

    const claim = await Booking.updateOne(
      {
        _id: booking._id,
        $or: [
          { "cancellation.refundState": { $in: ["requested", "failed"] } },
          {
            "cancellation.refundState": "approved",
            $or: [
              { "cancellation.approvalClaimedAt": { $exists: false } },
              {
                "cancellation.approvalClaimedAt": {
                  $lt: new Date(Date.now() - 5 * 60 * 1000),
                },
              },
            ],
          },
        ],
      },
      {
        $set: {
          "cancellation.refundState": "approved",
          "cancellation.approvedAmount": amount,
          "cancellation.adminId": req.user.id,
          "cancellation.approvedAt": new Date(),
          "cancellation.approvalClaimedAt": new Date(),
        },
        $unset: { "cancellation.failureReason": 1 },
      },
    );
    if (!claim.modifiedCount) {
      return res.status(409).json({
        ok: false,
        message: "Refund approval is already being processed",
      });
    }

    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(amount * 100),
        speed: "normal",
        receipt,
        notes: {
          bookingId: booking.bookingId,
          refundRequest: "admin-approved",
        },
      });

      try {
        await Payment.updateOne(
          { _id: payment._id, "refunds.refundId": { $ne: refund.id } },
          {
            $push: {
              refunds: {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status === "processed" ? "processed" : "created",
                requestedAt: new Date(),
                ...(refund.status === "processed" ? { processedAt: new Date() } : {}),
              },
            },
          },
        );
        await Booking.updateOne(
          { _id: booking._id },
          {
            $set: { "cancellation.razorpayRefundId": refund.id },
            $unset: { "cancellation.approvalClaimedAt": 1 },
          },
        );
      } catch (persistenceError) {
        logger.error("Refund persistence reconciliation pending", {
          bookingId: booking.bookingId,
          refundId: refund.id,
          error: persistenceError.message,
        });
        return res.status(202).json({
          ok: true,
          message: "Refund submitted; awaiting server reconciliation",
          data: { refundId: refund.id, status: refund.status },
        });
      }
      await sendRefundEmail({ ...booking.toObject(), cancellation: { ...booking.cancellation.toObject(), approvedAmount: amount } }, "approved", amount);

      return res.json({
        ok: true,
        message: "Refund approved and submitted to Razorpay",
        data: { refundId: refund.id, status: refund.status },
      });
    } catch (error) {
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            "cancellation.refundState": "failed",
            "cancellation.failedAt": new Date(),
            "cancellation.failureReason": error.message,
          },
          $unset: { "cancellation.approvalClaimedAt": 1 },
        },
      );
      logger.error("Razorpay refund failed", {
        bookingId: booking.bookingId,
        error: error.message,
      });
      return res.status(502).json({
        ok: false,
        message: "Razorpay could not create the refund; it can be retried",
      });
    }
  } catch (error) {
    logger.error("Refund approval failed", { bookingId: id, error: error.message });
    return res.status(500).json({ ok: false, message: "Failed to approve refund" });
  }
};

export const rejectRefund = async (req, res) => {
  const { id } = req.params;
  const reason = String(req.body.reason || "").trim();
  if (!reason) {
    return res.status(400).json({ ok: false, message: "Rejection reason is required" });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, "cancellation.refundState": "requested" },
      {
        $set: {
          "cancellation.refundState": "rejected",
          "cancellation.adminId": req.user.id,
          "cancellation.rejectedAt": new Date(),
          "cancellation.failureReason": reason,
        },
      },
      { new: true },
    );

    if (!booking) {
      return res.status(409).json({ ok: false, message: "Refund request is no longer pending" });
    }

    await sendRefundEmail(booking, "rejected", booking.cancellation.requestedAmount);
    return res.json({ ok: true, message: "Refund request rejected", data: booking });
  } catch (error) {
    logger.error("Refund rejection failed", { bookingId: id, error: error.message });
    return res.status(500).json({ ok: false, message: "Failed to reject refund" });
  }
};
