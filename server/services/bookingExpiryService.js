import { Booking } from "../models/BookingModel.js";
import { logger } from "../utils/logger.js";

/**
 * Booking Expiry Service
 *
 * Periodically auto-cancels stale pending bookings that were created
 * (e.g. via "Pay Later") but never paid within a reasonable time window.
 *
 * NOTE:
 * - We mark them as `cancelled` with `cancellation.cancelledBy = 'system'`.
 * - This keeps index semantics consistent: cancelled bookings are excluded
 *   from the "active" partial indexes, so slots become bookable again.
 */

function getExpiryMinutes() {
  const raw = process.env.BOOKING_EXPIRY_MINUTES;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30; // sensible default
  }
  return parsed;
}

export async function expireStalePendingBookings() {
  const expiryMinutes = getExpiryMinutes();
  const cutoff = new Date(Date.now() - expiryMinutes * 60_000);

  try {
    const now = new Date();

    const result = await Booking.updateMany(
      {
        status: "pending",
        createdAt: { $lt: cutoff },
      },
      {
        $set: {
          status: "cancelled",
          "cancellation.cancelledBy": "system",
          "cancellation.reason": "Auto-cancelled due to payment timeout",
          "cancellation.cancelledAt": now,
        },
      },
    );

    const modifiedCount =
      typeof result.modifiedCount === "number"
        ? result.modifiedCount
        : // Fallback for older driver versions
          result.nModified || 0;

    if (modifiedCount > 0) {
      logger.info("Booking expiry job cancelled stale bookings", {
        count: modifiedCount,
        expiryMinutes,
        cutoff: cutoff.toISOString(),
      });
    }

    return modifiedCount;
  } catch (err) {
    logger.error("Booking expiry job failed", {
      error: err.message,
    });
    throw err;
  }
}
