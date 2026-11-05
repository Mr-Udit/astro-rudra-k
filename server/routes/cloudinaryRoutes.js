import express from "express";
import { getUploadSignature } from "../controllers/cloudinaryController.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ------------------------------------------------------------------
   PRECOMPUTED MIDDLEWARE (HIGH-TRAFFIC SAFE)
------------------------------------------------------------------ */

const uploadLimiter = apiLimiter;
const auth = authRequired(["auth"]);

/* ------------------------------------------------------------------
   CLOUDINARY ROUTES
------------------------------------------------------------------ */

// Signed uploads must be authenticated
router.get(
  "/signature",
  auth,
  uploadLimiter,
  getUploadSignature
);

export default router;
