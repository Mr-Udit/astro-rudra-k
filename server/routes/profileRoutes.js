import express from "express";
import {
  getProfile,
  updateProfile,
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getAstrologerEarningsSummary,
} from "../controllers/profileController.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ------------------------------------------------------------------
   PRECOMPUTED MIDDLEWARE (HIGH-TRAFFIC SAFE)
------------------------------------------------------------------ */

const profileAuth = authRequired(); // Just check for valid token
const updateAuth = authRequired(); // Just check for valid token
const profileLimiter = apiLimiter;

/* ------------------------------------------------------------------
   PROFILE ROUTES
------------------------------------------------------------------ */

// Read-only profile fetch
router.get(
  "/get",
  profileAuth,
  profileLimiter,
  getProfile
);

// Partial profile update
router.patch(
  "/update",
  updateAuth,
  profileLimiter,
  updateProfile
);

/* ------------------------------------------------------------------
   FAVORITES / WISHLIST ROUTES
------------------------------------------------------------------ */

// Get user's favorite astrologers
router.get(
  "/favorites",
  profileAuth,
  profileLimiter,
  getFavorites
);

// Toggle astrologer favorite (add or remove)
router.post(
  "/favorites/:astrologerId",
  updateAuth,
  profileLimiter,
  toggleFavorite
);

// Add astrologer to favorites (legacy)
router.post(
  "/favorites/:astrologerId/add",
  updateAuth,
  profileLimiter,
  addFavorite
);

// Remove astrologer from favorites (legacy)
router.delete(
  "/favorites/:astrologerId",
  updateAuth,
  profileLimiter,
  removeFavorite
);

/* ------------------------------------------------------------------
   ASTROLOGER EARNINGS ROUTES
------------------------------------------------------------------ */

// Get astrologer earnings summary
router.get(
  "/earnings/summary",
  profileAuth,
  profileLimiter,
  getAstrologerEarningsSummary
);

export default router;