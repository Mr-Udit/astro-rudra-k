import rateLimit from "express-rate-limit";

/*
  High-performance rate-limiting configuration

  Design goals:
  - Minimal per-request overhead
  - No memory explosion under high traffic
  - Safe behind reverse proxies
  - Predictable behavior at scale

  IMPORTANT:
  For very large traffic (50k+ RPS), Redis-based rate limiting
  should be used instead of in-memory stores.
*/

/* ------------------------------------------------------------------
   SHARED OPTIONS
------------------------------------------------------------------ */

const BASE_OPTIONS = {
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
};

/* ------------------------------------------------------------------
   AUTH RATE LIMITER
   Strict — brute-force protection
------------------------------------------------------------------ */

export const authLimiter = rateLimit({
  ...BASE_OPTIONS,

  windowMs: 5 * 60 * 1000,
  max: 5,

  message: {
    ok: false,
    message: "Too many login attempts. Please try again later.",
  },

  // Avoid expensive cookie parsing
  skip: (req) => Boolean(req.cookies?.auth || req.cookies?.profile),
});

/* ------------------------------------------------------------------
   OTP VERIFICATION LIMITER
------------------------------------------------------------------ */

export const otpVerifyLimiter = rateLimit({
  ...BASE_OPTIONS,

  windowMs: 15 * 60 * 1000,
  max: 10,

  message: {
    ok: false,
    message: "Too many OTP attempts. Please request a new OTP.",
  },
});

/* ------------------------------------------------------------------
   GENERAL API LIMITER
------------------------------------------------------------------
   NOTE:
   - In-memory store is per-process
   - If you use Node cluster or multiple servers,
     limits will be per-instance
------------------------------------------------------------------ */

export const apiLimiter = rateLimit({
  ...BASE_OPTIONS,

  windowMs: 60 * 1000,
  max: 100,

  message: {
    ok: false,
    message: "Too many requests. Please slow down.",
  },

  skip: (req) => req.user?.role === "admin",
});
