// Environment configuration — MUST be first import to load env vars before other modules
import "dotenv/config";

// Validate environment variables immediately after loading .env
import { validateEnvironment } from "./utils/validateEnv.js";
validateEnvironment();

// Core dependencies
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Database
import connectDB from "./config/db.js";

// Middleware
import {
  securityHeaders,
  validateRequestStructure,
  configureTrustedProxy,
} from "./middleware/securityMiddleware.js";

import {
  enableCompression,
  enableConditionalGET,
} from "./middleware/performanceMiddleware.js";

import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import astrologerRoutes from "./routes/astrologersRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";
import { logger } from "./utils/logger.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { metricsHandler } from "./monitoring/metrics.js";
import { expireStalePendingBookings } from "./services/bookingExpiryService.js";
import { runAstrologerCacheCleanup } from "./services/cacheMaintenanceService.js";

const isProduction = process.env.NODE_ENV === "production";
const defaultAllowedOrigins = [
  "https://astro-rudra-k.vercel.app",
  "http://localhost:4000",
  "http://localhost:5173",
  "https://astro-rudra-k-main-backend.onrender.com",
];
const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin/server-to-server requests with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  maxAge: 86400,
};

// Create Express app
const app = express();

// ------------------------------------------------------------------------------------
// TRUST PROXY (required for rate-limit + real IPs)
// ------------------------------------------------------------------------------------
configureTrustedProxy(app);

// ------------------------------------------------------------------------------------
// WEBHOOK RAW BODY (must be before JSON parser)
// ------------------------------------------------------------------------------------
app.use("/payment/webhook", express.raw({ type: "application/json" }));

// ------------------------------------------------------------------------------------
// CORS (first middleware)
// ------------------------------------------------------------------------------------
app.use(
  cors(corsOptions)
);

app.options("*", cors(corsOptions));

// ------------------------------------------------------------------------------------
// BODY PARSING (tight limits = lower memory pressure)
// ------------------------------------------------------------------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ------------------------------------------------------------------------------------
// SECURITY
// ------------------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    strictTransportSecurity: isProduction
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);

app.use(securityHeaders);
app.use(cookieParser());
app.use(validateRequestStructure);
app.use(csrfProtection);

// ------------------------------------------------------------------------------------
// PERFORMANCE
// ------------------------------------------------------------------------------------
app.use(enableCompression);
app.use(enableConditionalGET);

// ------------------------------------------------------------------------------------
// LOGGING (disabled noise endpoints)
// ------------------------------------------------------------------------------------
app.use(
  morgan(":method :url :status :response-time ms", {
    skip: (req) =>
      req.path === "/health" ||
      req.method === "OPTIONS",
  })
);

app.use(express.static("public"));

// ------------------------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------------------------
app.get("/", apiLimiter, (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Welcome to Astro Rudra API",
  });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/astrologers", astrologerRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/admin", adminRoutes);
app.use("/payment", paymentRoutes);

// ------------------------------------------------------------------------------------
// METRICS (Prometheus compatible)
// ------------------------------------------------------------------------------------
app.get("/metrics", metricsHandler);
 
// ------------------------------------------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// ------------------------------------------------------------------------------------
// 404 HANDLER
// ------------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Endpoint not found",
  });
});

// ------------------------------------------------------------------------------------
// GLOBAL ERROR HANDLER
// ------------------------------------------------------------------------------------
app.use((err, req, res, next) => {
  const message = isProduction
    ? "Internal Server Error"
    : err.message;

  logger.error(err.message, { stack: err.stack });

  res.status(500).json({
    ok: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ------------------------------------------------------------------------------------
// SERVER START
// ------------------------------------------------------------------------------------
async function startServer() {
  // Add timeout to prevent hanging indefinitely
  const connectionTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Database connection timeout after 30 seconds")), 30000)
  );

  try {
    await Promise.race([connectDB(), connectionTimeout]);
  } catch (err) {
    logger.error("Database connection failed", { error: err.message });
    process.exit(1);
  }

  const PORT = process.env.PORT || 4000;

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // --------------------------------------------------
  // BACKGROUND BOOKING EXPIRY JOB
  // --------------------------------------------------
  // Periodically auto-cancel stale pending bookings that
  // were never paid (e.g. from "Pay Later" flow).
  const EXPIRY_JOB_INTERVAL_MS = 60_000; // run every 60 seconds

  setInterval(async () => {
    try {
      const cancelledCount = await expireStalePendingBookings();
      if (cancelledCount > 0) {
        logger.info("Booking expiry job run", { cancelledCount });
      }
    } catch (err) {
      logger.error("Booking expiry job execution error", {
        error: err.message,
      });
    }
  }, EXPIRY_JOB_INTERVAL_MS);

  // --------------------------------------------------
  // BACKGROUND ASTROLOGER CACHE CLEANUP JOB
  // --------------------------------------------------
  const CACHE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // run every hour

  setInterval(async () => {
    try {
      await runAstrologerCacheCleanup();
    } catch (err) {
      logger.error("Astrologer cache cleanup job execution error", {
        error: err.message,
      });
    }
  }, CACHE_CLEANUP_INTERVAL_MS);

  global.SERVER = server;
}

startServer().catch((err) => {
  logger.error("Startup failure", err);
  process.exit(1);
});

// ------------------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// ------------------------------------------------------------------------------------
const shutdown = () => {
  if (global.SERVER) {
    global.SERVER.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (err) =>
  logger.error("Unhandled Rejection", err)
);
process.on("uncaughtException", (err) =>
  logger.error("Uncaught Exception", err)
);

export default app;
