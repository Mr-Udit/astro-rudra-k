import mongoose from "mongoose";
import { Booking } from "../models/BookingModel.js";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import {
  getDayName,
  timeToMinutes,
  SLOT_DURATION_MINUTES,
} from "../utils/timeUtil.js";
import { getPagination } from "../utils/paginationUtil.js";
import {
  AppError,
  BookingErrors,
  CONSULTATION_TYPES,
  isValidConsultationType,
} from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { generateBookingId } from "../utils/geneateBookingId.js";
import { acquireSlotLock, releaseSlotLock } from "./slotLockService.js";
import { bookingCreatedCounter, bookingFailedCounter } from "../monitoring/metrics.js";

/*
  BOOKING SERVICE — HEAVY TRAFFIC OPTIMIZED

  Key improvements:
  - removed populate() completely
  - aggregation-only joins
  - parallel DB operations
  - indexed query shapes
  - no unnecessary documents loaded
  - strict ObjectId validation
  - structured error codes for frontend
  - comprehensive request logging
*/

/* =========================================================
   HELPERS
========================================================= */

const IST_OFFSET_MINUTES = 330;

const normalizeISTDate = (dateString) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const normalizeText = (text = "") =>
  text
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatBookingForAstrologer = (b) => ({
  id: b._id,
  clientName: b.userName,
  type: b.consultationType,
  date: b.bookingDate,
  time: b.bookingTime,
  durationMinutes: b.duration,
  amount: b.price,
  status: b.status,
  bookingId: b.bookingId,
  problemStatement: b.problemStatement,
});

/* =========================================================
   SLOT VALIDATION WITH ERROR CODES
========================================================= */

async function validateSlotAvailability({
  astrologerId,
  bookingDate,
  bookingTime,
  excludeBookingId = null,
}) {
  const profile = await AstrologerProfile.findById(
    astrologerId,
    "availability isVerified",
  ).lean();

  if (!profile || !profile.isVerified) {
    throw BookingErrors.astrologerProfileMissing();
  }

  // Log validation attempt
  const day = getDayName(bookingDate);
  logger.debug("Slot validation", {
    astrologerId: astrologerId.toString(),
    bookingDate: bookingDate.toISOString(),
    bookingTime,
    dayOfWeek: day,
  });

  const start = timeToMinutes(bookingTime);
  const end = start + SLOT_DURATION_MINUTES;

  const fitsAvailability = profile.availability.some((slot) => {
    if (slot.day !== day) return false;
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return start >= slotStart && end <= slotEnd;
  });

  if (!fitsAvailability) {
    logger.debug("Slot outside availability", {
      requestedTime: bookingTime,
      requestedDay: day,
    });
    throw BookingErrors.slotOutsideAvailability();
  }

  // Check for time overlaps
  const query = {
    astrologerId,
    bookingDate,
    status: { $ne: "cancelled" },
  };

  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const existing = await Booking.find(query, { bookingTime: 1 }).lean();

  for (const b of existing) {
    const s = timeToMinutes(b.bookingTime);
    const e = s + SLOT_DURATION_MINUTES;
    if (start < e && end > s) {
      logger.debug("Slot overlap detected", {
        requestedSlot: bookingTime,
        conflictingSlot: b.bookingTime,
      });
      throw BookingErrors.slotOverlap();
    }
  }
}

/**
 * Helper: convert minutes to HH:mm format
 */
function timeMinutesToHHMM(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/* =========================================================
   CREATE BOOKING WITH VALIDATION & ERROR CODES
========================================================= */

export async function createBookingService(payload, user) {
  // frontend sometimes sends `astrologerProfileId` while service
  // historically expected `astrologerId` – accept either for now.
  const astrologerId = payload.astrologerId || payload.astrologerProfileId;
  const {
    bookingDate,
    bookingTime,
    problemStatement,
    consultationType,
  } = payload;

  // Log incoming request
  logger.debug("Booking create request", {
    userId: user?.id?.toString() || null,
    astrologerId: astrologerId ? astrologerId.toString() : null,
    consultationType,
  });
  // Validate consultation type
  if (!isValidConsultationType(consultationType)) {
    logger.debug("Invalid consultation type", { consultationType });
    bookingFailedCounter.inc({ reason: "invalid_consultation_type" });
    throw BookingErrors.invalidConsultationType(consultationType);
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    logger.debug("Invalid date format", { bookingDate });
    bookingFailedCounter.inc({ reason: "invalid_date_format" });
    throw BookingErrors.invalidDateFormat();
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(bookingTime)) {
    logger.debug("Invalid time format", { bookingTime });
    bookingFailedCounter.inc({ reason: "invalid_time_format" });
    throw BookingErrors.invalidTimeFormat();
  }

  const bookingId = generateBookingId();

  // Check for existing booking with same bookingId (idempotency)
  if (bookingId) {
    const exists = await Booking.findOne({ bookingId }).lean();
    if (exists) {
      logger.debug("Duplicate booking ID detected", { bookingId });
      return exists;
    }
  }

  if (!astrologerId) {
    logger.debug("Missing astrologerId in payload", { payload });
    bookingFailedCounter.inc({ reason: "missing_astrologer_id" });
    throw BookingErrors.astrologerProfileMissing();
  }

  // Fetch user and astrologer in parallel
  const [astrologer] = await Promise.all([
    AstrologerProfile.findById(astrologerId, {
      isVerified: 1,
      name: 1,
      price: 1,
      availability: 1,
    }).lean(),
  ]);

  // Validate user
  if (!user) {
    logger.debug("User validation failed", {
      user: user || null,
    });
    bookingFailedCounter.inc({ reason: "user_inactive" });
    throw BookingErrors.userInactive();
  }

  // Validate astrologer
  if (!astrologer) {
    logger.debug("Astrologer profile not found", { astrologerId });
    bookingFailedCounter.inc({ reason: "astrologer_not_found" });
    throw BookingErrors.astrologerProfileMissing();
  }

  if (!astrologer.isVerified) {
    logger.debug("Astrologer not verified", {
      astrologerId: astrologer._id?.toString(),
    });
    bookingFailedCounter.inc({ reason: "astrologer_unverified" });
    throw BookingErrors.astrologerUnverified();
  }

  // Normalize date
  const normalizedDate = normalizeISTDate(bookingDate);

  // Acquire Redis slot lock to prevent concurrent booking of same slot
  const { acquired, key: lockKey, token: lockToken } = await acquireSlotLock({
    astrologerId: astrologer._id.toString(),
    bookingDate: normalizedDate,
    bookingTime,
  });

  if (!acquired) {
    logger.debug("Slot lock acquisition failed", {
      astrologerId: astrologer._id.toString(),
      bookingDate: normalizedDate.toISOString(),
      bookingTime,
    });
    bookingFailedCounter.inc({ reason: "slot_lock_failed" });
    throw BookingErrors.slotOverlap();
  }

  try {
    // Validate slot availability and check overlaps again inside the lock
    await validateSlotAvailability({
      astrologerId: astrologer._id,
      bookingDate: normalizedDate,
      bookingTime,
    });

    // Create booking with database-level duplicate protection
    const booking = await Booking.create({
      // User Info
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userPhone: user.phoneNumber,

      // Astrologer Info
      astrologerId: astrologer._id,
      astrologerName: astrologer.name,

      // Booking Details
      bookingId: bookingId,
      bookingDate: normalizedDate,
      bookingTime,
      consultationType,
      problemStatement,

      // Session Info
      duration: SLOT_DURATION_MINUTES,
      status: "pending",

      // Payment
      price: astrologer.price || 0,
    });

    logger.info("Booking created successfully", {
      bookingId: booking.bookingId,
      userId: user.id.toString(),
    });

    bookingCreatedCounter.inc({ status: booking.status });

    return booking;
  } catch (dbError) {
    // MongoDB E11000 error code indicates duplicate key constraint violation
    if (dbError.code === 11000) {
      logger.debug("Database duplicate key error", {
        error: dbError.message,
      });

      const message = dbError.message || "";
      if (message.includes("unique_astrologer_slot_active")) {
        bookingFailedCounter.inc({ reason: "slot_unique_violation" });
        throw BookingErrors.slotOverlap();
      }

      bookingFailedCounter.inc({ reason: "duplicate_booking" });
      throw BookingErrors.duplicateBooking();
    }
    // Re-throw any other database error
    bookingFailedCounter.inc({ reason: "db_error" });
    throw dbError;
  } finally {
    // Best-effort lock release (TTL also protects us)
    try {
      await releaseSlotLock({ key: lockKey, token: lockToken });
    } catch {
      // ignore
    }
  }
}

/* =========================================================
   CANCEL
========================================================= */

export async function cancelBooking(
  bookingId,
  userId,
  canceller,
  reason = "",
  refundAmount = 0,
) {
  const booking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      userId,
      status: { $ne: "cancelled" },
    },
    {
      $set: {
        status: "cancelled",
        cancellation: {
          cancelledBy: canceller,
          reason,
          cancelledAt: new Date(),
          refundAmount: refundAmount, // change based on refund policy
        },
      },
    },
    { new: true },
  );

  if (!booking) {
    throw BookingErrors.bookingNotFound();
  }

  return booking;
}

/* =========================================================
   RESCHEDULE
========================================================= */

export async function rescheduleBooking(
  bookingId,
  userId,
  { bookingDate, bookingTime },
) {
  // Validate new slot before attempting update
  const booking = await Booking.findOne({
    _id: bookingId,
    userId,
    status: { $ne: "cancelled" },
  });

  if (!booking) {
    throw BookingErrors.bookingNotFound();
  }

  const normalizedDate = normalizeISTDate(bookingDate);

  // Validate slot availability for new date/time
  await validateSlotAvailability({
    astrologerId: booking.astrologerId,
    bookingDate: normalizedDate,
    bookingTime,
    excludeBookingId: booking._id,
  });

  // ATOMIC UPDATE - Single operation, no race condition
  // findOneAndUpdate is atomic at MongoDB level
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      userId,
      status: { $ne: "cancelled" },
    },
    {
      $set: {
        bookingDate: normalizedDate,
        bookingTime: bookingTime,
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      // Validate against schema on update
      runValidators: true,
    },
  );

  if (!updatedBooking) {
    // This can happen if booking was cancelled between validation and update
    throw BookingErrors.bookingNotFound();
  }

  logger.info("Booking rescheduled", {
    bookingId: bookingId.toString(),
    userId: userId.toString(),
    newDate: normalizedDate.toISOString(),
    newTime: bookingTime,
  });

  return updatedBooking;
}

/* =========================================================
   USER BOOKINGS
========================================================= */

export async function getMyBookings(userId, query) {
  const { skip, limit } = getPagination(query);

  const match = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  const pipeline = [
    { $match: match },
    { $sort: { bookingDate: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        bookingDate: 1,
        bookingTime: 1,
        consultationType: 1,
        status: 1,
        amount: 1,
        astrologerName: 1,
        createdAt: 1,
        "cancellation.cancelledBy": 1,
      },
    },
  ];

  const [data, total] = await Promise.all([
    Booking.aggregate(pipeline),
    Booking.countDocuments(match),
  ]);

  return { data, total };
}

/* =========================================================
   ASTROLOGER UPCOMING
========================================================= */

export async function getAstrologerUpcomingBookings(astrologerId, query) {
  const { skip, limit } = getPagination(query);

  const filter = {
    astrologerId,
    status: { $in: ["pending", "confirmed"] },
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ bookingDate: 1, bookingTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    data: bookings.map(formatBookingForAstrologer),
    total,
  };
}

/* =========================================================
   ASTROLOGER HISTORY
========================================================= */

export async function getAstrologerBookingHistory(astrologerId, query) {
  const { skip, limit } = getPagination(query);

  const filter = {
    astrologerId,
    status: {
      $in: ["completed", "cancelled"],
    },
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    data: bookings.map(formatBookingForAstrologer),
    total,
  };
}

/* =========================================================
   UPDATE STATUS
========================================================= */

export const updateBookingStatusService = async ({
  bookingId,
  status,
  cancelledBy,
  reason,
  refundAmount = 0,
}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking id");
  }

  const update = {
    status,
  };

  if (status === "cancelled") {
    update.cancellation = {
      cancelledBy,
      reason,
      refundAmount,
      cancelledAt: new Date(),
    };
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { $set: update },
    { new: true },
  );

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
};

/* =========================================================
 ADMIN — GET BOOKINGS (HIGH SCALE)
========================================================= */

export async function adminGetBookings(filters = {}, query = {}) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const allowedFilters = new Set([
    "bookingId",
    "userId",
    "userName",
    "userEmail",
    "userPhone",
    "astrologerId",
    "status",
    "consultationType",
    "bookingDate",
    "createdAt",
  ]);

  const match = {};

  for (const [key, value] of Object.entries(filters)) {
    if (!allowedFilters.has(key)) continue;
    if (!value) continue;

    switch (key) {
      case "userId":
      case "astrologerId":
        if (mongoose.Types.ObjectId.isValid(value)) {
          match[key] = new mongoose.Types.ObjectId(value);
        }
        break;

      case "status":
        if (
          ["pending", "confirmed", "completed", "cancelled", "expired"]
            .includes(value)
        ) {
          match.status = value;
        }
        break;

      case "consultationType":
        if (["chat", "voice_call", "video_call"].includes(value)) {
          match.consultationType = value;
        }
        break;

      case "bookingDate":
      case "createdAt":
        match[key] = {
          $gte: new Date(`${value}T00:00:00.000Z`),
          $lte: new Date(`${value}T23:59:59.999Z`),
        };
        break;

      case "bookingId":
      case "userName":
      case "userEmail":
      case "userPhone":
        match[key] = {
          $regex: escapeRegex(value),
          $options: "i",
        };
        break;
    }
  }

  /*
    IMPORTANT:
    Use lean() for performance.
    Never return full document.
  */

  const [data, total] = await Promise.all([
    Booking.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select({
        bookingId: 1,
        userId: 1,
        userName: 1,
        userEmail: 1,
        userPhone: 1,
        astrologerId: 1,
        astrologerName: 1,
        bookingDate: 1,
        bookingTime: 1,
        consultationType: 1,
        duration: 1,
        price: 1,
        status: 1,
        createdAt: 1,
      })
      .lean(),

    Booking.countDocuments(match),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/*
  Prevent regex injection / catastrophic backtracking
*/
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* =========================================================
   GET BOOKING BY ID — FULL DATA (ADMIN / USER / ASTROLOGER)
========================================================= */

export async function getBookingById(bookingId, userId, role) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking id");
  }

  const match = {
    _id: new mongoose.Types.ObjectId(bookingId),
  };

  // ---------------- USER ACCESS ----------------
  if (role === "user") {
    match.userId = new mongoose.Types.ObjectId(userId);
  }

  // ---------------- ASTROLOGER ACCESS ----------------
  if (role === "astrologer") {
    const astrologerProfile = await AstrologerProfile.findOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { _id: 1 },
    ).lean();

    if (!astrologerProfile) {
      throw new Error("Astrologer profile not found");
    }

    match.astrologerId = astrologerProfile._id;
  }

  // ---------------- ADMIN HAS FULL ACCESS ----------------

  const pipeline = [
    { $match: match },

    /* ---------------------------
       Join astrologer profile
    ---------------------------- */
    {
      $lookup: {
        from: "astrologerprofiles",
        localField: "astrologerId",
        foreignField: "_id",
        as: "astro",
      },
    },
    { $unwind: "$astro" },

    /* ---------------------------
       Join astrologer user
    ---------------------------- */
    {
      $lookup: {
        from: "users",
        localField: "astro.userId",
        foreignField: "_id",
        as: "astrologerUser",
      },
    },
    { $unwind: "$astrologerUser" },

    /* ---------------------------
       FINAL SHAPE
    ---------------------------- */
    {
      $project: {
        _id: 1,
        bookingId: 1,

        bookingDate: 1,
        bookingTime: 1,
        consultationType: 1,
        durationMinutes: 1,
        amount: 1,
        status: 1,

        problemStatement: 1,
        placeOfBirth: 1,
        timeOfBirth: 1,

        cancellation: 1,
        createdAt: 1,

        userId: 1,
        userName: 1,
        userEmail: 1,
        userPhone: 1,

        astrologerId: 1,
        astrologerName: "$astrologerUser.fullName",
      },
    },
  ];

  const [booking] = await Booking.aggregate(pipeline);

  return booking || null;
}
