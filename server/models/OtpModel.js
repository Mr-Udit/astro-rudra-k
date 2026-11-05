import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Normalized email lookup (case-insensitive)
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    // OTP purpose (auth, reset-password, verify-email, etc.)
    purpose: {
      type: String,
      required: true,
      index: true
    },

    // Hashed OTP material
    otpHash: {
      type: String,
      required: true,
      select: false
    },

    salt: {
      type: String,
      required: true,
      select: false
    },

    // Attempt counter
    attempts: {
      type: Number,
      default: 0
    },

    // TTL expiration
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

/* ------------------------------------------------------------------
   INDEX STRATEGY — HIGH TRAFFIC OPTIMIZED
------------------------------------------------------------------ */

// MongoDB TTL cleanup (automatic background deletion)
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Fast verification lookup
otpSchema.index(
  { email: 1, purpose: 1 },
  { unique: true }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
