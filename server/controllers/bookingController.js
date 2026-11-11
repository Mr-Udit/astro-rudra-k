import { AstrologerProfile } from "../models/AstrologersModel.js";
import {
  createBookingService,
  cancelBooking,
  rescheduleBooking,
  getMyBookings,
  adminGetBookings,
  getBookingById,
  getAstrologerUpcomingBookings,
  getAstrologerBookingHistory,
  updateBookingStatusService,
} from "../services/bookingService.js";
import { AppError } from "../utils/AppError.js";

/*
  BOOKING CONTROLLER — HIGH THROUGHPUT SAFE

  Optimizations applied:
  - structured error handling with codes
  - comprehensive logging
  - strict validation paths
  - predictable error handling
  - controller stays extremely thin
*/

/* ------------------------------------------------------------
   CREATE
------------------------------------------------------------ */

export const createBookingHandler = async (req, res) => {
  try {
    const booking = await createBookingService(req.body, req.user);

    return res.status(201).json({
      ok: true,
      message: "Booking created",
      data: {
        id: booking._id,
        bookingId: booking.bookingId,
        userId: booking.userId,
        astrologerId: booking.astrologerId,
        astrologerName: booking.astrologerName,
        userName: booking.userName,
        bookingDate: booking.bookingDate.toISOString().split("T")[0], // Format as YYYY-MM-DD for display
        bookingTime: booking.bookingTime,
        consultationType: booking.consultationType,
        duration: booking.duration,
        price: booking.price,
        status: booking.status,
        problemStatement: booking.problemStatement,
      },
    });
  } catch (err) {
    console.error("[BOOKING CREATE ERROR]", {
      error: err.message,
      code: err.code,
      // req.user usually has `id` field not `userId`
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
    // Handle AppError with structured error codes
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }

    // Fallback for unexpected errors
    return res.status(500).json({
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again.",
      },
    });
  }
};

/* ------------------------------------------------------------
   CANCEL
------------------------------------------------------------ */

export const cancelBookingHandler = async (req, res) => {
  try {
    const booking = await cancelBooking(
      req.params.id,
      req.user.id,
      req.canceller,
      req.body.reason || "",
      req.body.refundAmount ?? req.refundAmount,
    );

    return res.json({
      ok: true,
      message:
        booking.cancellation?.refundState === "requested"
          ? "Booking cancelled; refund request is pending admin approval"
          : "Booking cancelled",
      data: booking,
    });
  } catch (err) {
    console.error("[BOOKING CANCEL ERROR]", {
      error: err.message,
      code: err.code,
      bookingId: req.params.id,
      userId: req.user?.id,
    });

    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }

    return res.status(500).json({
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  }
};

/* ------------------------------------------------------------
   RESCHEDULE
------------------------------------------------------------ */

export const rescheduleBookingHandler = async (req, res) => {
  try {
    const booking = await rescheduleBooking(
      req.params.id,
      req.user.id,
      req.body,
    );

    return res.json({
      ok: true,
      data: booking,
    });
  } catch (err) {
    console.error("[BOOKING RESCHEDULE ERROR]", {
      error: err.message,
      code: err.code,
      bookingId: req.params.id,
      userId: req.user?.id,
    });

    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }

    return res.status(500).json({
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  }
};

/* ------------------------------------------------------------
   USER BOOKINGS
------------------------------------------------------------ */

export const myBookings = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const result = await getMyBookings(req.user.id, req.query);

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("myBookings error:", error);

    // If you're using custom error classes
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
    }

    // Fallback: internal error
    return res.status(500).json({
      ok: false,
      message: "Something went wrong",
    });
  }
};

/* ------------------------------------------------------------
   ASTROLOGER BOOKINGS
------------------------------------------------------------ */

export const astrologerUpcomingBookings = async (req, res) => {
  let profileId = req.user.id;

  if (!profileId && req.user?.role === "astrologer") {
    const profile = await AstrologerProfile.findOne(
      { _id: req.user.id },
      { _id: 1 },
    ).lean();
    if (!profile) {
      return res
        .status(404)
        .json({ ok: false, message: "Astrologer profile not found" });
    }
    profileId = profile._id;
  }

  if (!profileId) {
    return res.status(400).json({ ok: false, message: "Profile ID required" });
  }

  const result = await getAstrologerUpcomingBookings(profileId, req.query);

  return res.json({
    ok: true,
    ...result,
  });
};

export const astrologerBookingHistory = async (req, res) => {
  const result = await getAstrologerBookingHistory(
    req.params.astrologerProfileId,
    req.query,
  );

  return res.json({
    ok: true,
    ...result,
  });
};

/* ------------------------------------------------------------
   SINGLE BOOKING
------------------------------------------------------------ */

export const getBooking = async (req, res) => {
  const booking = await getBookingById(
    req.params.id,
    req.user.id,
    req.user.role,
  );

  if (!booking) {
    return res.status(404).json({
      ok: false,
      message: "Booking not found",
    });
  }

  return res.json({
    ok: true,
    data: booking,
  });
};

/* ------------------------------------------------------------
   ADMIN LIST
------------------------------------------------------------ */

export const adminBookings = async (req, res) => {
  const result = await adminGetBookings(req.query, req.query);

  return res.json({
    ok: true,
    ...result,
  });
};

/* ------------------------------------------------------------
   STATUS UPDATE
------------------------------------------------------------ */

export const updateBookingStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, refundAmount } = req.body;

    const ALLOWED = new Set([
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "expired",
    ]);

    if (!ALLOWED.has(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid booking status",
      });
    }

    const booking = await updateBookingStatusService({
      bookingId: id,
      status,
      cancelledBy: status === "cancelled" ? "astrologer" : null,
      reason,
      refundAmount,
    });

    return res.json({
      ok: true,
      message: "Booking updated",
      data: booking,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};
