import { createClient } from "redis";
import { logger } from "../utils/logger.js";
import { redisUpGauge } from "../monitoring/metrics.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = createClient({ url: REDIS_URL });

redis.on("error", (err) => {
  redisUpGauge.set(0);
  logger.error("Redis error", { error: err.message });
});

redis.on("connect", () => {
  redisUpGauge.set(1);
  logger.info("Redis connected");
});

// Connect immediately on module import
redis.connect().catch((err) => {
  redisUpGauge.set(0);
  logger.error("Redis initial connection failed", { error: err.message });
});
