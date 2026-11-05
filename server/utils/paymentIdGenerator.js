import crypto from "crypto";

export const generatePaymentId = () => {
  const prefix = "PAYMENT";

  // timestamp (sortable)
  const timestamp = Date.now().toString(36).toUpperCase();

  // secure random component
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `${prefix}_${timestamp}_${random}`;
};