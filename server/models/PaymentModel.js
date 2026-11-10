import mongoose from "mongoose";

/**
 * Payment Schema (production-grade)
 * - Idempotent via idempotencyKey (unique)
 * - Tracks Razorpay order/payment IDs
 * - Stores webhook receipts for deduplication and audits
 * - Optimized indexes for reconciliation queries
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "created", // order created, waiting for user to pay
        "processing", // webhook received but final state pending
        "authorized",
        "captured",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "created",
      index: true,
    },

    gateway: {
      type: String,
      default: "razorpay",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      index: true,
    },

    razorpaySignature: String,

    receipt: {
      type: String,
      index: true,
    },

    notes: mongoose.Schema.Types.Mixed,

    createdBy: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },

    error: {
      code: String,
      message: String,
      source: {
        type: String,
        enum: ["verify", "webhook", "system"],
        default: "system",
      },
    },

    capturedAt: Date,
    lastEventSource: {
      type: String,
      enum: ["verify", "webhook", "system"],
      default: "system",
    },
    lastWebhookEventId: {
      type: String,
      index: true,
    },
    webhookDeliveries: {
      type: Number,
      default: 0,
    },
    verifyAttempts: {
      type: Number,
      default: 0,
    },
    metadata: {
      checkoutSessionId: String,
    },
    refunds: [
      {
        refundId: String,
        amount: Number,
        status: {
          type: String,
          enum: ["created", "processed", "failed"],
        },
        requestedAt: Date,
        processedAt: Date,
        failedAt: Date,
        failureReason: String,
      },
    ],
    refundedAmount: {
      type: Number,
      default: 0,
    },
    webhookEvents: [
      {
        event: String,
        status: String,
        receivedAt: { type: Date, default: Date.now },
        payload: { type: Object },
        signatureValid: Boolean,
      },
    ],
  },
  {
    timestamps: true,
    minimize: true,
  },
);

paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
