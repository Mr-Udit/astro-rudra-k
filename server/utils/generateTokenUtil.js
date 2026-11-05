import jwt from "jsonwebtoken";
import crypto from "crypto";

/* ============================================================
   CONFIG
============================================================ */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing — authentication cannot initialize");
}

/* ============================================================
   EXPIRY CACHE (Performance Optimized)
============================================================ */

const EXPIRY_CACHE = Object.create(null);

function parseExpiryToMs(exp) {
  if (EXPIRY_CACHE[exp]) return EXPIRY_CACHE[exp];

  const len = exp.length;
  const unit = exp.charCodeAt(len - 1);
  const num = Number(exp.slice(0, len - 1));

  let ms;

  if (!Number.isFinite(num)) {
    ms = 2 * 60 * 60 * 1000;
  } else {
    switch (unit) {
      case 104: // h
        ms = num * 60 * 60 * 1000;
        break;
      case 109: // m
        ms = num * 60 * 1000;
        break;
      case 115: // s
        ms = num * 1000;
        break;
      case 100: // d
        ms = num * 24 * 60 * 60 * 1000;
        break;
      default:
        ms = 2 * 60 * 60 * 1000;
    }
  }

  EXPIRY_CACHE[exp] = ms;
  return ms;
}

/* ============================================================
   COOKIE OPTIONS
============================================================ */

export const getCookieOptions = (expiresIn) => {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: parseExpiryToMs(expiresIn),
  };
};

/* ============================================================
   TOKEN GENERATOR
   - id: Mongo _id
   - role: "user" | "astrologer"
   - type: "auth" | "profile"
============================================================ */

const generateToken = (
  res,
  { id, role, type },
  expiresIn = "2h"
) => {
  if (!id || !role || !type) {
    throw new Error("Missing token payload data");
  }

  const token = jwt.sign(
    {
      id,
      role,
      type,
      jti: crypto.randomUUID(), // unique per token
    },
    JWT_SECRET,
    {
      expiresIn,
      algorithm: "HS256",
    }
  );

  res.cookie(type, token, getCookieOptions(expiresIn));
};

export default generateToken;
