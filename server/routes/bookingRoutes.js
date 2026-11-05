import express from "express";
import {
  createBookingHandler,
  cancelBookingHandler,
  rescheduleBookingHandler,
  myBookings,
  astrologerUpcomingBookings,
  astrologerBookingHistory,
  getBooking,
  updateBookingStatusController,
} from "../controllers/bookingController.js";

import { authRequired } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

/*
  BOOKING ROUTES — TRAFFIC AWARE

  Optimizations:
  - strict middleware ordering
  - heavy routes protected early
  - zero redundant authorization calls
*/

const router = express.Router();

/* ------------------------------------------------------------
   CREATE / UPDATE
------------------------------------------------------------ */

router.post(
  "/create",
  authRequired(["auth"]),
  apiLimiter,
  createBookingHandler
);

router.patch(
  "/:id/cancel",
  authRequired(["auth"], ["user"]),
  apiLimiter,
  cancelBookingHandler
);

router.patch(
  "/:id/reschedule",
  authRequired(["auth"], ["user"]),
  apiLimiter,
  rescheduleBookingHandler
);

router.patch(
  "/:id/status",
  authRequired(["auth"], ["astrologer", "user", "admin"]),
  apiLimiter,
  updateBookingStatusController
);

/* ------------------------------------------------------------
   USER BOOKINGS
------------------------------------------------------------ */

router.get(
  "/my-bookings",
  authRequired(["auth"]),
  apiLimiter,
  myBookings
);

/* ------------------------------------------------------------
   ASTROLOGER BOOKINGS
------------------------------------------------------------ */

router.get(
  "/astrologer/my-consultations",
  authRequired(["auth"],),
  apiLimiter,
  astrologerUpcomingBookings // We will modify this or add a specific one
);

router.get(
  "/astrologer/:astrologerProfileId/upcoming",
  authRequired(["auth"], ["astrologer"]),
  apiLimiter,
  astrologerUpcomingBookings
);

router.get(
  "/astrologer/:astrologerProfileId/history",
  authRequired(["auth"], ["astrologer"]),
  apiLimiter,
  astrologerBookingHistory
);

/* ------------------------------------------------------------
   SINGLE BOOKING
------------------------------------------------------------ */

router.get(
  "/:id",
  authRequired(["auth"], ["user", "astrologer", "admin"]),
  apiLimiter,
  getBooking
);

export default router;
