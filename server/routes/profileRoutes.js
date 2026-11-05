import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
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

export default router;
