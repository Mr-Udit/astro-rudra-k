import express from "express";
import { sendContactEmail } from "../controllers/contactController.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/",
  apiLimiter,
  sendContactEmail,
);

export default router;
