import crypto from "crypto";

export function generateBookingId() {
  const randomNumber = crypto.randomInt(1000, 10000);
  return `BOOKING_${randomNumber}`;
}