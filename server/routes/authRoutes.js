import express from "express";
import {
  checkUsernameAvailability,
  login,
  logout,
  register,
  verifySession,
} from "../controllers/authController.js";
import { authRequired, authOptional } from "../middleware/authMiddleware.js";
import {
  apiLimiter,
  authLimiter,
  otpVerifyLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ------------------------------------------------------------------
   LOGIN / OTP
   ------------------------------------------------------------------
*/

router.post(
  "/register",
  authLimiter,
  otpVerifyLimiter,
  // csrfProtection, // CSRF protection for state-changing request
  register,
);

router.post(
  "/login",
  authLimiter,
  otpVerifyLimiter,
  // csrfProtection, // CSRF protection for state-changing request
  login,
);

/* ------------------------------------------------------------------
   SESSION VERIFICATION (allows unauthenticated requests)
------------------------------------------------------------------ */

router.get(
  "/verify",
  apiLimiter,
  authOptional(), // Allows anonymous users - returns null if not authenticated
  verifySession,
);

/* ------------------------------------------------------------------
   LOGOUT
------------------------------------------------------------------ */

router.post(
  "/logout",
  authRequired({ allowedTokenTypes: ["auth", "profile"] }),
  // csrfProtection, // CSRF protection for state-changing request
  logout,
);

router.post(
  "/check-username",
  apiLimiter,
  // csrfProtection, // CSRF protection for state-changing request
  checkUsernameAvailability,
);

export default router;
