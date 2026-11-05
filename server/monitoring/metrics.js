import client from "prom-client";

// Create a dedicated registry so we control what is exposed
export const metricsRegistry = new client.Registry();

// Collect default Node.js process metrics
client.collectDefaultMetrics({ register: metricsRegistry });

// Booking metrics
export const bookingCreatedCounter = new client.Counter({
  name: "booking_created_total",
  help: "Total number of bookings successfully created",
  labelNames: ["status"],
  registers: [metricsRegistry],
});

export const bookingFailedCounter = new client.Counter({
  name: "booking_failed_total",
  help: "Total number of failed booking creation attempts",
  labelNames: ["reason"],
  registers: [metricsRegistry],
});

// Slot lock metrics
export const slotLockAcquireCounter = new client.Counter({
  name: "slot_lock_acquire_total",
  help: "Total number of slot lock acquisition attempts",
  labelNames: ["result"], // success | failure
  registers: [metricsRegistry],
});

// Payment metrics
export const paymentOrderCreatedCounter = new client.Counter({
  name: "payment_order_created_total",
  help: "Total number of Razorpay orders created",
  labelNames: ["status"], // success | failure | reused
  registers: [metricsRegistry],
});

export const paymentStatusCounter = new client.Counter({
  name: "payment_status_total",
  help: "Total number of payment status transitions",
  labelNames: ["source", "status"], // source: verify|webhook, status: created|captured|failed|refunded|cancelled|processing
  registers: [metricsRegistry],
});

export const webhookEventsCounter = new client.Counter({
  name: "payment_webhook_events_total",
  help: "Total number of processed Razorpay webhook events",
  labelNames: ["event", "result"], // result: processed|ignored|unknown_payment
  registers: [metricsRegistry],
});

// Infra gauges
export const redisUpGauge = new client.Gauge({
  name: "redis_up",
  help: "Redis connection health (1 = up, 0 = down)",
  registers: [metricsRegistry],
});

export const mongoUpGauge = new client.Gauge({
  name: "mongo_up",
  help: "MongoDB connection health (1 = up, 0 = down)",
  registers: [metricsRegistry],
});

export async function metricsHandler(req, res) {
  try {
    res.setHeader("Content-Type", metricsRegistry.contentType);
    const body = await metricsRegistry.metrics();
    res.status(200).end(body);
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to generate metrics" });
  }
}
