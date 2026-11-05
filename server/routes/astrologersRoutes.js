import express from "express";
import {
  listAstrologersHandler,
  getAstrologerByIdController,
  getAstrologerAvailabilityController,
  updateAstrologerAvailabilityController,
  getSpecializationsHandler,
} from "../controllers/astrologerController.js";
import {
  createAstrologerReview,
  listAstrologerReviews,
  getFeaturedTestimonials,
} from "../controllers/reviewController.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";
import { authRequired } from "../middleware/authMiddleware.js";

/*
  Astrologer routes optimized for:
  - correct middleware order
  - minimal DB pressure
  - safe high-read traffic
*/

const router = express.Router();

/* ------------------------------------------------------------
   PUBLIC — HIGH TRAFFIC
------------------------------------------------------------ */

// List astrologers (most-hit endpoint)
router.get(
  "/list",
  apiLimiter,
  listAstrologersHandler
);

// Get specializations (static or aggregated)
router.get(
  "/specializations",
  apiLimiter,
  getSpecializationsHandler
);

// Featured testimonials for landing page
router.get(
  "/featured-testimonials",
  apiLimiter,
  getFeaturedTestimonials
);

// Single astrologer profile
router.get(
  "/:id",
  apiLimiter,
  getAstrologerByIdController
);

// Availability lookup
router.get(
  "/:id/availability",
  apiLimiter,
  getAstrologerAvailabilityController
);

// Public reviews list for an astrologer
router.get(
  "/:id/reviews",
  apiLimiter,
  listAstrologerReviews
);

/* ------------------------------------------------------------
   PROTECTED — WRITE PATH
------------------------------------------------------------ */

router.patch(
  "/:id/availability",
  authRequired(["auth"], ["astrologer"]),
  apiLimiter,
  updateAstrologerAvailabilityController
);

// Create or update review for an astrologer (user testimonial)
router.post(
  "/:id/reviews",
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth", "profile"] }),
  apiLimiter,
  createAstrologerReview
);

export default router;
