import express from "express";

import {
  createAstrologerHandler,
  listAstrologersHandler,
  setVerificationAstrologerHandler
} from "../controllers/astrologerController.js";

import {
  adminBookings,
} from "../controllers/bookingController.js";

import {
  adminGetUserById,
  adminListAstrologers,
  adminListUsers,
  adminSetUserActiveStatus,
  adminCreateUser,
  adminDeleteUser,
  adminDeleteAstrologer,
  adminMonitoringSummary,
  adminGetPayments,
  adminRevenueChart,
} from "../controllers/adminController.js";

import { validate } from "../middleware/validateController.js";
import { createAstrologerSchema } from "../validators/createAstrologerSchemaValidator.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ------------------------------------------------------------------
   PRECOMPUTED MIDDLEWARE (ZERO RE-ALLOCATION PER REQUEST)
------------------------------------------------------------------ */

const adminAuth = authRequired(["auth"], ["admin"]);
const adminRateLimit = apiLimiter;

/* ------------------------------------------------------------------
   ASTROLOGER MANAGEMENT
------------------------------------------------------------------ */

router.post(
  "/astrologer/create",
  adminAuth,
  adminRateLimit,
  validate(createAstrologerSchema),
  createAstrologerHandler
);

router.patch(
  "/astrologer/:id/status",
  adminAuth,
  adminRateLimit,
  setVerificationAstrologerHandler
);

router.delete(
  "/astrologer/:id",
  adminAuth,
  adminRateLimit,
  adminDeleteAstrologer
);

/* ------------------------------------------------------------------
   BOOKINGS
------------------------------------------------------------------ */

router.get(
  "/list-all-bookings",
  adminAuth,
  adminRateLimit,
  adminBookings
);

/* ------------------------------------------------------------------
   USER MANAGEMENT
------------------------------------------------------------------ */

router.post(
  "/user/create",
  adminAuth,
  adminRateLimit,
  adminCreateUser
);

router.get(
  "/users",
  adminAuth,
  adminRateLimit,
  adminListUsers
);

router.get(
  "/users/:id",
  adminAuth,
  adminRateLimit,
  adminGetUserById
);

router.patch(
  "/users/:id/status",
  adminAuth,
  adminRateLimit,
  adminSetUserActiveStatus
);

router.delete(
  "/users/:id",
  adminAuth,
  adminRateLimit,
  adminDeleteUser
);

/* ------------------------------------------------------------------
   ASTROLOGER LISTING
------------------------------------------------------------------ */

router.get(
  "/astrologers",
  adminAuth,
  adminRateLimit,
  adminListAstrologers
);

/* ------------------------------------------------------------------
   MONITORING / METRICS SUMMARY
------------------------------------------------------------------ */

router.get(
  "/monitoring/summary",
  adminAuth,
  adminRateLimit,
  adminMonitoringSummary
);

/* ------------------------------------------------------------------
   PAYMENTS
------------------------------------------------------------------ */

router.get(
  "/payments",
  adminAuth,
  adminRateLimit,
  adminGetPayments
);

/* ------------------------------------------------------------------
   REVENUE CHART
------------------------------------------------------------------ */

router.get(
  "/revenue/chart",
  adminAuth,
  adminRateLimit,
  adminRevenueChart
);

export default router;
