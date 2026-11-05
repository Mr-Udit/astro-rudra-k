import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { mongoUpGauge } from "../monitoring/metrics.js";

/*
  High-performance MongoDB connection manager
  Designed for large-scale Express deployments
*/

const DEFAULT_OPTIONS = Object.freeze({
  // ------------------------------------------------------------------
  // CONNECTION POOLING (most important performance setting)
  // ------------------------------------------------------------------
  maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 50,
  minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 10,
  maxConnecting: 5,

  // ------------------------------------------------------------------
  // TIMEOUTS
  // ------------------------------------------------------------------
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // ------------------------------------------------------------------
  // NETWORK
  // ------------------------------------------------------------------
  family: 4,
  noDelay: true,

  // ------------------------------------------------------------------
  // PERFORMANCE
  // ------------------------------------------------------------------
  autoIndex: process.env.NODE_ENV !== "production",
  monitorCommands: false,

  // ------------------------------------------------------------------
  // RELIABILITY
  // ------------------------------------------------------------------
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,

  // ------------------------------------------------------------------
  // READ / WRITE STRATEGY
  // ------------------------------------------------------------------
  readPreference: "primaryPreferred",
  readConcern: { level: "local" },
  writeConcern: {
    w: "majority",
    j: true,
    wtimeout: 5000,
  },
});

let isConnected = false;
let connectingPromise = null;
let retryCount = 0;

const MAX_RETRIES = 10;
const BASE_DELAY = 2000;
const MAX_DELAY = 30000;

// ------------------------------------------------------------------
// EXPONENTIAL BACKOFF (non-recursive, event-loop safe)
// ------------------------------------------------------------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const getRetryDelay = () =>
  Math.min(BASE_DELAY * 2 ** retryCount, MAX_DELAY);

// ------------------------------------------------------------------
// MAIN CONNECT FUNCTION
// ------------------------------------------------------------------
export const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  // Prevent parallel connection storms
  if (connectingPromise) return connectingPromise;

  mongoose.set("strictQuery", true);

  connectingPromise = (async () => {
    while (retryCount < MAX_RETRIES) {
      try {
        const conn = await mongoose.connect(
          process.env.MONGO_URI,
          DEFAULT_OPTIONS
        );

        isConnected = true;
        retryCount = 0;
        connectingPromise = null;

        mongoUpGauge.set(1);
        logger.info('MongoDB connected', { host: conn.connection.host });

        return conn;
      } catch (err) {
        retryCount++;

        const delay = getRetryDelay();

        logger.warn('MongoDB connection failed', {
          attempt: `${retryCount}/${MAX_RETRIES}`,
          retryIn: `${delay}ms`,
          error: err.message
        });

        await wait(delay);
      }
    }

    logger.error('MongoDB max retry attempts reached');
    mongoUpGauge.set(0);
    process.exit(1);
  })();

  return connectingPromise;
};

// ------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// ------------------------------------------------------------------
const shutdown = async (signal) => {
  try {
    logger.info('MongoDB shutting down', { signal });

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }

    process.exit(0);
  } catch (err) {
    logger.error('MongoDB shutdown error', { error: err.message });
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGUSR2", shutdown);

// ------------------------------------------------------------------
// CONNECTION STATE MONITORING (lightweight)
// ------------------------------------------------------------------
mongoose.connection.on("connected", () => {
  mongoUpGauge.set(1);
  logger.info('MongoDB connected');
});

mongoose.connection.on("disconnected", () => {
  logger.warn('MongoDB disconnected');
  isConnected = false;
  mongoUpGauge.set(0);
});

mongoose.connection.on("reconnected", () => {
  mongoUpGauge.set(1);
  logger.info('MongoDB reconnected');
});

mongoose.connection.on("error", (err) => {
  logger.error('MongoDB error', { error: err.message });
});

export default connectDB;
