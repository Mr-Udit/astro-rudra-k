import { redis } from "../config/redisClient.js";
import { logger } from "../utils/logger.js";

// Simple periodic cleanup for astrologer cache keys.
// In practice Redis has built-in eviction, but this allows
// explicitly removing rarely-used data if needed.

const ASTRO_CACHE_PATTERN = "astrologer:*:availability:v1";
const MIN_USAGE_THRESHOLD = 1; // delete keys with 0 or 1 hits

export async function runAstrologerCacheCleanup() {
  try {
    const keys = await redis.keys(ASTRO_CACHE_PATTERN);
    if (!keys.length) return;

    const pipeline = redis.multi();

    for (const key of keys) {
      const counterKey = `${key}:hits`;
      pipeline.get(counterKey);
    }

    const results = await pipeline.exec();

    const keysToDelete = [];

    keys.forEach((key, index) => {
      const [err, value] = results[index] || [];
      if (err) return;
      const hits = parseInt(value || "0", 10);
      if (Number.isNaN(hits) || hits <= MIN_USAGE_THRESHOLD) {
        keysToDelete.push(key, `${key}:hits`);
      }
    });

    if (!keysToDelete.length) return;

    await redis.del(...keysToDelete);

    logger.info("Astrologer cache cleanup removed keys", {
      removed: keysToDelete.length / 2,
    });
  } catch (err) {
    logger.error("Astrologer cache cleanup failed", {
      error: err.message,
    });
  }
}
