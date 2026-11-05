import mongoose from "mongoose";
import crypto from "crypto";

/*
  BLACKLISTED TOKEN MODEL — EXTREMELY HOT PATH OPTIMIZED

  Design priorities:
  - smallest possible document size
  - O(1) indexed lookups
  - automatic cleanup via TTL
  - safe for millions of active tokens
*/

const blackTokenSchema = new mongoose.Schema(
  {
    // 64-char SHA256 hex string
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },

    // TTL index auto-removes expired tokens
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    versionKey: false,
    autoIndex: false,
    minimize: true,
    timestamps: false,
  }
);

/* ------------------------------------------------------------------
   TTL INDEX — automatic expiration
------------------------------------------------------------------ */

blackTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

/* ------------------------------------------------------------------
   STATIC HASH FUNCTION
------------------------------------------------------------------ */

blackTokenSchema.statics.hashToken = function (token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const BlacklistedToken = mongoose.model(
  "BlacklistedToken",
  blackTokenSchema
);

export default BlacklistedToken;
