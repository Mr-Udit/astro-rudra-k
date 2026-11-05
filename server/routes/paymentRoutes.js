import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-order",
  authRequired({ allowedRoles: ["user","admin","astrologer"], allowedTokenTypes: ["auth", "profile"] }),
  createOrder,
);

router.post(
  "/verify",
  authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth", "profile"] }),
  verifyPayment,
);

// Webhook must remain unauthenticated; signature validated separately
router.post("/webhook", razorpayWebhook);

export default router;
