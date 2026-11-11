import express from "express";

import {
  createAstrologerHandler,
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
import {
  listRefundRequests,
  approveRefund,
  rejectRefund,
} from "../controllers/refundController.js";

const router = express.Router();

/* ------------------------------------------------------------------
   PRECOMPUTED MIDDLEWARE (ZERO RE-ALLOCATION PER REQUEST)
------------------------------------------------------------------ */

const adminAuth = authRequired({ allowedRoles: ["admin"], allowedTokenTypes: ["auth"] });
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

router.get("/refunds", adminAuth, adminRateLimit, listRefundRequests);
router.post("/refunds/:id/approve", adminAuth, adminRateLimit, approveRefund);
router.post("/refunds/:id/reject", adminAuth, adminRateLimit, rejectRefund);

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
