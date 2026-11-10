import crypto from "crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Booking } from "../models/BookingModel.js";
import Payment from "../models/PaymentModel.js";
import { AppError } from "../utils/AppError.js";

const JOIN_START_MINUTES = Number.parseInt(
  process.env.JAAS_JOIN_WINDOW_MINUTES || "10",
  10,
);
const JOIN_GRACE_MINUTES = 5;
const IST_OFFSET_MINUTES = 330;

const getPrivateKey = () => {
  if (process.env.JAAS_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.JAAS_PRIVATE_KEY_BASE64, "base64").toString(
      "utf8",
    );
  }

  return process.env.JAAS_PRIVATE_KEY?.replace(/\\n/g, "\n");
};

const getJaasConfig = () => {
  const { JAAS_APP_ID, JAAS_API_KEY_ID, JWT_SECRET } = process.env;
  const privateKey = getPrivateKey();

  if (!JAAS_APP_ID || !JAAS_API_KEY_ID || !privateKey || !JWT_SECRET) {
    throw new AppError(
      "JAAS_NOT_CONFIGURED",
      "Consultation service is not configured",
      503,
    );
  }

  return { appId: JAAS_APP_ID, apiKeyId: JAAS_API_KEY_ID, privateKey, roomSecret: JWT_SECRET };
};

const getBookingStart = (booking) => {
  const [year, month, day] = [
    booking.bookingDate.getUTCFullYear(),
    booking.bookingDate.getUTCMonth(),
    booking.bookingDate.getUTCDate(),
  ];
  const [hours, minutes] = booking.bookingTime.split(":").map(Number);
  return new Date(
    Date.UTC(year, month, day, hours, minutes) -
      IST_OFFSET_MINUTES * 60 * 1000,
  );
};

const getParticipantName = (booking, role) =>
  role === "astrologer" ? booking.astrologerName : booking.userName;

export async function createJoinToken(bookingId, user) {
  const config = getJaasConfig();
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("BOOKING_NOT_FOUND", "Booking not found", 404);
  }
  const booking = await Booking.findById(bookingId).lean();

  if (!booking) {
    throw new AppError("BOOKING_NOT_FOUND", "Booking not found", 404);
  }

  const isUser = String(booking.userId) === String(user.id);
  const isAstrologer = String(booking.astrologerId) === String(user.id);
  if (!isUser && !isAstrologer) {
    throw new AppError(
      "CONSULTATION_ACCESS_DENIED",
      "You do not have access to this consultation",
      403,
    );
  }

  if (booking.status !== "confirmed") {
    throw new AppError(
      "CONSULTATION_UNAVAILABLE",
      `This consultation is ${booking.status}`,
      409,
    );
  }

  const payment = await Payment.findOne({
    bookingId: booking._id,
    status: "captured",
  })
    .select("_id")
    .lean();
  if (!payment) {
    throw new AppError(
      "CONSULTATION_NOT_PAID",
      "This consultation has not been paid",
      409,
    );
  }

  const startsAt = getBookingStart(booking);
  const endsAt = new Date(startsAt.getTime() + booking.duration * 60 * 1000);
  const now = Date.now();
  const joinOpensAt = startsAt.getTime() - JOIN_START_MINUTES * 60 * 1000;
  const joinClosesAt = endsAt.getTime() + JOIN_GRACE_MINUTES * 60 * 1000;

  if (now < joinOpensAt) {
    throw new AppError(
      "CONSULTATION_TOO_EARLY",
      `This consultation opens at ${startsAt.toISOString()}`,
      409,
    );
  }
  if (now > joinClosesAt) {
    throw new AppError(
      "CONSULTATION_ENDED",
      "This consultation has ended",
      409,
    );
  }

  const roomSlug = `booking-${crypto
    .createHmac("sha256", config.roomSecret)
    .update(String(booking._id))
    .digest("hex")}`;
  const roomName = `${config.appId}/${roomSlug}`;
  const expiresAt = Math.ceil((joinClosesAt + 60 * 1000) / 1000);
  const nowSeconds = Math.floor(now / 1000);
  const token = jwt.sign(
    {
      aud: "jitsi",
      context: {
        user: {
          id: String(user.id),
          name: getParticipantName(booking, user.role) || "Participant",
          moderator: isAstrologer ? "true" : "false",
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
        },
        room: { regex: false },
      },
      exp: expiresAt,
      iss: "chat",
      nbf: nowSeconds - 5,
      room: roomSlug,
      sub: config.appId,
    },
    config.privateKey,
    {
      algorithm: "RS256",
      header: { kid: `${config.appId}/${config.apiKeyId}` },
    },
  );

  return {
    roomName,
    token,
    appId: config.appId,
    consultationType: booking.consultationType,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}
