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
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  createBookingHandler
);

router.patch(
  "/:id/cancel",
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  cancelBookingHandler
);

router.patch(
  "/:id/reschedule",
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  rescheduleBookingHandler
);

router.patch(
  "/:id/status",
  authRequired({
    allowedRoles: ["astrologer", "user", "admin"],
    allowedTokenTypes: ["auth"],
  }),
  apiLimiter,
  updateBookingStatusController
);

/* ------------------------------------------------------------
   USER BOOKINGS
------------------------------------------------------------ */

router.get(
  "/my-bookings",
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  myBookings
);

/* ------------------------------------------------------------
   ASTROLOGER BOOKINGS
------------------------------------------------------------ */

router.get(
  "/astrologer/my-consultations",
  authRequired({ allowedRoles: ["astrologer"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  astrologerUpcomingBookings // We will modify this or add a specific one
);

router.get(
  "/astrologer/:astrologerProfileId/upcoming",
  authRequired({ allowedRoles: ["astrologer"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  astrologerUpcomingBookings
);

router.get(
  "/astrologer/:astrologerProfileId/history",
  authRequired({ allowedRoles: ["astrologer"], allowedTokenTypes: ["auth"] }),
  apiLimiter,
  astrologerBookingHistory
);

/* ------------------------------------------------------------
   SINGLE BOOKING
------------------------------------------------------------ */

router.get(
  "/:id",
  authRequired({
    allowedRoles: ["user", "astrologer", "admin"],
    allowedTokenTypes: ["auth"],
  }),
  apiLimiter,
  getBooking
);

export default router;
