import crypto from "crypto";
import { redis } from "../config/redisClient.js";
import { slotLockAcquireCounter } from "../monitoring/metrics.js";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const buildSlotKey = (astrologerId, bookingDate, bookingTime) => {
  const dateStr =
    bookingDate instanceof Date
      ? bookingDate.toISOString().split("T")[0]
      : bookingDate;
  return `slot:${astrologerId}:${dateStr}:${bookingTime}`;
};

export async function acquireSlotLock({
  astrologerId,
  bookingDate,
  bookingTime,
  ttlMs = DEFAULT_TTL_MS,
}) {
  const key = buildSlotKey(astrologerId, bookingDate, bookingTime);
  const token = crypto.randomBytes(16).toString("hex");

  const ok = await redis.set(key, token, "NX", "PX", ttlMs);
  if (ok !== "OK") {
    slotLockAcquireCounter.inc({ result: "failure" });
    return { acquired: false, key, token: null };
  }

  slotLockAcquireCounter.inc({ result: "success" });

  return { acquired: true, key, token };
}

const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

export async function releaseSlotLock({ key, token }) {
  if (!key || !token) return false;
  const res = await redis.eval(RELEASE_SCRIPT, 1, key, token);
  return res === 1;
}
