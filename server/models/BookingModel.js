import mongoose from "mongoose";

/*
  BOOKING MODEL — LARGE-SCALE PRODUCTION OPTIMIZED
*/

const bookingSchema = new mongoose.Schema(
  {
    /* ----------------------------------------------------
       IDENTIFIERS
    ---------------------------------------------------- */

    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    /* ----------------------------------------------------
       Astrologer SNAPSHOT (DENORMALIZED — CRITICAL)
    ---------------------------------------------------- */
    astrologerName: {
      type: String,
      required: true,
      index: true,
    },

    consultationType: {
      type: String,
      enum: ["chat", "voice_call", "video_call"],
      required: true,
      index: true,
    },
    /* ----------------------------------------------------
       USER SNAPSHOT (DENORMALIZED — CRITICAL)
    ---------------------------------------------------- */

    userName: {
      type: String,
      required: true,
      index: true,
    },

    userEmail: {
      type: String,
      required: true,
      index: true,
    },

    userPhone: {
      type: String,
      required: true,
    },

    /* ----------------------------------------------------
       BOOKING DATA
    ---------------------------------------------------- */

    bookingDate: {
      type: Date, // UTC midnight
      required: true,
      index: true,
    },

    bookingTime: {
      type: String, // HH:mm
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    problemStatement: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /* ----------------------------------------------------
       CANCELLATION METADATA
    ---------------------------------------------------- */

    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["user", "astrologer", "system"],
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: true,
    autoIndex: false, // CRITICAL FOR PRODUCTION
  },
);

/* ----------------------------------------------------
   INDEX STRATEGY (QUERY-DRIVEN)
---------------------------------------------------- */

// user dashboard
bookingSchema.index({ userId: 1, createdAt: -1 });

// RACE CONDITION PROTECTION - MANDATORY FOR PRODUCTION
// Prevents duplicate bookings on same date for same user+astrologer
// Partial index excludes cancelled bookings to allow rebooking after cancellation
// Catches parallel requests that slip through service-level checks
bookingSchema.index(
  {
    userId: 1,
    astrologerId: 1,
    bookingDate: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "completed", "expired"] },
    },
    name: "unique_user_astrologer_date_active",
    // If duplicate insertion is attempted, MongoDB throws:
    // MongoServerError: E11000 duplicate key error (only for active bookings)
    // Cancelled bookings are excluded, allowing user to rebook same slot
    // We catch this in the controller and convert to DUPLICATE_BOOKING
  },
);

// Prevent double-booking the same slot for an astrologer (except cancelled)
bookingSchema.index(
  {
    astrologerId: 1,
    bookingDate: 1,
    bookingTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "completed", "expired"] },
    },
    name: "unique_astrologer_slot_active",
  },
);

// astrologer slot lookup + calendar
bookingSchema.index({
  astrologerId: 1,
  bookingDate: 1,
  status: 1,
});

// admin dashboards
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ consultationType: 1 });

// fast lookup - removed to avoid conflict with unique index on bookingId
// bookingSchema.index({ bookingId: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
