import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Otp from "../models/OtpModel.js";

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300);
const MAX_ATTEMPTS = 3;
const ATTEMPT_DELAY_MS = 2000;

// -------------------------------------------------------------------
// SAFE SECRET INITIALIZATION (NO CRASH ON BOOT)
// -------------------------------------------------------------------
const OTP_HASH_SECRET =
  process.env.OTP_HASH_SECRET ||
  crypto
    .createHash("sha256")
    .update(process.env.NODE_ENV || "development")
    .update(process.pid.toString())
    .digest("hex");

// -------------------------------------------------------------------
// HIGH-PERFORMANCE OTP GENERATION
// -------------------------------------------------------------------
function generateNumericOTP(digits = 6) {
  const max = 10 ** digits;
  return crypto.randomInt(0, max).toString().padStart(digits, "0");
}

function hashOtp(otp, salt) {
  return crypto
    .createHmac("sha256", OTP_HASH_SECRET)
    .update(otp)
    .update(salt)
    .digest("hex");
}

// -------------------------------------------------------------------
// GENERATE + UPSERT OTP (SINGLE WRITE)
// -------------------------------------------------------------------
export async function generateAndStoreOtp({ email, purpose }) {
  const otp = generateNumericOTP();
  const salt = uuidv4();
  const otpHash = hashOtp(otp, salt);

  await Otp.updateOne(
    { email, purpose },
    {
      $set: {
        otpHash,
        salt,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000)
      }
    },
    { upsert: true }
  );

  return otp;
}

// -------------------------------------------------------------------
// HIGH-THROUGHPUT OTP VERIFICATION
// -------------------------------------------------------------------
export async function verifyOtp({ email, otp, purpose }) {
  const record = await Otp.findOne(
    { email, purpose },
    { otpHash: 1, salt: 1, attempts: 1 }
  ).lean();

  if (!record) {
    return { ok: false, reason: "expired" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ email, purpose });
    return { ok: false, reason: "too_many_attempts" };
  }

  const computedHash = hashOtp(otp, record.salt);

  const isValid =
    record.otpHash.length === computedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(record.otpHash),
      Buffer.from(computedHash)
    );

  // ---------------------------------------------------------------
  // INVALID OTP
  // ---------------------------------------------------------------
  if (!isValid) {
    const attempts = record.attempts + 1;

    if (attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ email, purpose });
      return { ok: false, reason: "too_many_attempts" };
    }

    await Otp.updateOne(
      { email, purpose },
      { $inc: { attempts: 1 } }
    );

    const delay = ATTEMPT_DELAY_MS * attempts;
    await new Promise(r => setTimeout(r, delay));

    return {
      ok: false,
      reason: "invalid",
      attempts
    };
  }

  // ---------------------------------------------------------------
  // VALID OTP
  // ---------------------------------------------------------------
  await Otp.deleteOne({ email, purpose });

  return { ok: true };
}
