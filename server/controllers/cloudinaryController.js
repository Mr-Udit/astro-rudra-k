import { v2 as cloudinary } from "cloudinary";

/*
  CLOUDINARY SERVICE — HIGH TRAFFIC OPTIMIZED

  Key improvements:
  - dotenv loaded once globally (never here)
  - fail-fast env validation
  - single Cloudinary client instance
  - zero per-request configuration
  - no console logging on hot paths
*/

// ------------------------------------------------------------------
// ENV VALIDATION (BOOT TIME)
// ------------------------------------------------------------------

const {
  CLOUD_NAME,
  API_KEY,
  API_SECRET
} = process.env;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    "Cloudinary env vars missing: CLOUD_NAME, API_KEY, API_SECRET"
  );
}

// ------------------------------------------------------------------
// SINGLE CONFIGURATION INSTANCE
// ------------------------------------------------------------------

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
});

// ------------------------------------------------------------------
// SIGNED UPLOAD SIGNATURE
// ------------------------------------------------------------------

export const getUploadSignature = (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    API_SECRET
  );

  return res.json({
    ok: true,
    data: {
      timestamp,
      signature,
      cloudName: CLOUD_NAME,
      apiKey: API_KEY
    }
  });
};
