/**
 * Environment Variable Validation
 * 
 * Validates all critical environment variables at startup.
 * Fails fast if any required configuration is missing or invalid.
 * 
 * This must be called before any other module initialization.
 */

import { logger } from "./logger.js";

const REQUIRED_VARS = {
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: "JWT secret for signing tokens"
  },
  JWT_EXPIRY: {
    required: true,
    description: "JWT expiration time (e.g., '7d')"
  },
  MONGO_URI: {
    required: true,
    validateFn: (value) => {
      return value.startsWith("mongodb://") || value.startsWith("mongodb+srv://");
    },
    description: "MongoDB connection URI"
  },
  NODE_ENV: {
    required: true,
    validateFn: (value) => {
      return ["development", "production"].includes(value);
    },
    description: "Environment mode (development or production)"
  },
  PORT: {
    required: false,
    default: "4000",
    validateFn: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port < 65536;
    },
    description: "Server port number"
  },
  RAZORPAY_KEY_ID: {
    required: true,
    minLength: 10,
    description: "Razorpay public key"
  },
  RAZORPAY_SECRET: {
    required: true,
    minLength: 10,
    description: "Razorpay secret used for signature validation"
  },
  RAZORPAY_WEBHOOK_SECRET: {
    required: true,
    minLength: 10,
    description: "Razorpay webhook signing secret"
  },
  REDIS_URL: {
    required: false,
    description: "Redis connection URL for slot locking, caching, and queues"
  }
};

/**
 * Validate a single environment variable
 */
function validateVariable(name, config) {
  const value = process.env[name];

  // Check if required variable is missing
  if (!value) {
    if (config.required) {
      throw new Error(
        `❌ Missing required environment variable: ${name}\n` +
        `   Description: ${config.description}`
      );
    }
    // Set default if available and optional
    if (config.default) {
      process.env[name] = config.default;
    }
    return;
  }

  // Validate minimum length (for secrets)
  if (config.minLength && value.length < config.minLength) {
    throw new Error(
      `❌ Environment variable ${name} is too short\n` +
      `   Required length: ${config.minLength} characters\n` +
      `   Actual length: ${value.length} characters\n` +
      `   Security: Secrets must be sufficiently long to be cryptographically secure`
    );
  }

  // Run custom validation function
  if (config.validateFn && !config.validateFn(value)) {
    throw new Error(
      `❌ Invalid value for environment variable: ${name}\n` +
      `   Value: ${value}\n` +
      `   Description: ${config.description}`
    );
  }
}

/**
 * Validate all environment variables
 * Called at application startup
 */
export function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  logger.info("Environment validation", {
    NODE_ENV: nodeEnv,
    strict: isProduction
  });

  const errors = [];

  for (const [name, config] of Object.entries(REQUIRED_VARS)) {
    try {
      validateVariable(name, config);
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) {
    const fullMessage = [
      "\n" + "=".repeat(70),
      "ENVIRONMENT CONFIGURATION ERROR",
      "=".repeat(70),
      ...errors,
      "=".repeat(70),
      "\nApplication startup blocked due to invalid configuration.\n"
    ].join("\n");

    logger.error(fullMessage);
    console.error(fullMessage);
    process.exit(1);
  }

  logger.info("All environment variables validated successfully");
}

/**
 * Get validated environment config
 */
export function getEnvConfig() {
  return {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY,
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI: process.env.MONGO_URI,
    PORT: parseInt(process.env.PORT || "4000", 10),
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    IS_DEVELOPMENT: process.env.NODE_ENV === "development"
  };
}
