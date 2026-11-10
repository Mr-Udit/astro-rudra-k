import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";
import BlacklistedToken from "../models/BlacklistedTokenModel.js";
import { generateAndStoreOtp, verifyOtp } from "../services/otpService.js";
import generateToken from "../utils/generateTokenUtil.js";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import { logger } from "../utils/logger.js";

/*
  AUTH CONTROLLER — LARGE SCALE OPTIMIZED
*/

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const JWT_PROFILE_EXPIRY = process.env.JWT_PROFILE_EXPIRY || "15m";

if (!JWT_SECRET) {
  logger.error("JWT_SECRET is missing");
  throw new Error("JWT_SECRET is missing — authentication cannot start");
}
/* ------------------------------------------------------------------
   REGISTER
------------------------------------------------------------------ */

export async function register(req, res) {
  try {
    const { email, username, action, otp } = req.body;

    if (!email || !username || !action) {
      return res.status(400).json({
        ok: false,
        message: "Email, username and action are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const usernameRegex = /^[a-z0-9_]{3,30}$/;

    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({
        ok: false,
        message:
          "Username must be 3–30 characters and contain only lowercase letters, numbers, or underscores.",
      });
    }

    const existingUser = await User.findOne(
      {
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
      { email: 1, username: 1 },
    ).lean();

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          ok: false,
          message: "Email already exists. Please login instead.",
        });
      }

      if (existingUser.username === normalizedUsername) {
        return res.status(409).json({
          ok: false,
          message: "Username already taken.",
        });
      }
    }

    /* =========================
       REQUEST OTP
    ========================= */

    if (action === "request") {
      const OTP = await generateAndStoreOtp({
        email: normalizedEmail,
        purpose: "register",
      });

      return res.json({
        ok: true,
        message: "OTP sent successfully.",
        ...(process.env.NODE_ENV !== "production" ? { otp: OTP } : {}),
      });
    }

    /* =========================
       VERIFY OTP
    ========================= */

    if (action !== "verify") {
      return res.status(400).json({
        ok: false,
        message: "Invalid action.",
      });
    }

    if (!otp) {
      return res.status(400).json({
        ok: false,
        message: "OTP is required.",
      });
    }

    const result = await verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: "register",
    });

    if (!result.ok) {
      const map = {
        expired: "OTP expired. Request a new one.",
        invalid: "Invalid OTP.",
        too_many_attempts: "Too many OTP attempts. Try again later.",
      };

      return res
        .status(result.reason === "too_many_attempts" ? 429 : 400)
        .json({
          ok: false,
          message: map[result.reason] || "OTP verification failed.",
          attempts: result.attempts,
        });
    }

    /* =========================
       CREATE USER
    ========================= */

    const newUser = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      role: "user",
      isProfileComplete: false,
      isActive: true,
      loginCount: 0,
      lastLoginAt: new Date(),
    });

    /* =========================
       ISSUE PROFILE TOKEN
    ========================= */

    generateToken(
      res,
      { id: newUser._id, role: "user", type: "profile" },
      "30m",
    );

    return res.status(201).json({
      ok: true,
      message: "Account created successfully. Please complete your profile.",
      user: {
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isProfileComplete: false,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.stack || error);

    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Email or username already registered.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "An unexpected error occurred during registration.",
    });
  }
}
/* ------------------------------------------------------------------
   LOGIN
------------------------------------------------------------------ */
export async function login(req, res, next) {
  try {
    const { username, role, action, otp } = req.body;

    if (!username || !role || !action) {
      return res.status(400).json({
        ok: false,
        message: "Username, role and action are required",
      });
    }

    if (!["user", "astrologer", "admin"].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid role",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    /* ==============================
       FETCH ACCOUNT
    ============================== */

    let account;

    if (role === "user" || role === "admin") {
      account = await User.findOne(
        { username: normalizedUsername, role: role },
        {
          _id: 1,
          email: 1,
          role: 1,
          isProfileComplete: 1,
          isActive: 1,
          fullName: 1,
          lastLoginAt: 1,
        },
      ).lean();
    } else {
      account = await AstrologerProfile.findOne(
        { username: normalizedUsername },
        {
          _id: 1,
          email: 1,
          isActive: 1,
          name: 1,
          lastActiveAt: 1,
        },
      ).lean();
    }

    if (!account) {
      return res.status(404).json({
        ok: false,
        message: `No ${role} account found with this username.`,
      });
    }

    if (!account.isActive) {
      return res.status(403).json({
        ok: false,
        message: "Your account is currently disabled.",
      });
    }

    /* ==============================
       REQUEST OTP
    ============================== */

    if (action === "request") {
      const OTP = await generateAndStoreOtp({
        email: account.email,
        purpose: `${role}_auth`,
      });
      return res.json({
        ok: true,
        message: "OTP sent successfully.",
        ...(process.env.NODE_ENV !== "production" ? { otp: OTP } : {}),
      });
    }

    /* ==============================
       VERIFY OTP
    ============================== */

    if (action !== "verify") {
      return res.status(400).json({
        ok: false,
        message: "Invalid action",
      });
    }

    if (!otp) {
      return res.status(400).json({
        ok: false,
        message: "OTP is required",
      });
    }

    const result = await verifyOtp({
      email: account.email,
      otp,
      purpose: `${role}_auth`,
    });

    if (!result.ok) {
      const map = {
        expired: "OTP expired. Request a new one.",
        invalid: "Invalid OTP.",
        too_many_attempts: "Too many OTP attempts. Try again later.",
      };

      return res
        .status(result.reason === "too_many_attempts" ? 429 : 400)
        .json({
          ok: false,
          message: map[result.reason] || "OTP failed",
          attempts: result.attempts,
        });
    }

    /* ==============================
       SUCCESS FLOW
    ============================== */

    if (role === "user" || role === "admin") {
      if (!account.isProfileComplete) {
        generateToken(
          res,
          { id: account._id, role: account.role, type: "profile" },
          JWT_PROFILE_EXPIRY,
        );

        return res.json({
          ok: true,
          message: "Profile incomplete.",
          user: {
            _id: account._id,
            username: normalizedUsername,
            email: account.email,
            role: account.role,
            fullName: account.fullName,
            isProfileComplete: false,
            isActive: true,
          },
        });
      }

      generateToken(
        res,
        { id: account._id, role: account.role, type: "auth" },
        JWT_EXPIRY,
      );

      // Fire-and-forget safely
      await User.findByIdAndUpdate(
        account._id,
        {
          $set: { lastLoginAt: new Date() },
          $inc: { loginCount: account?.loginCount + 1 || 1 },
        },
        { new: true },
      );

      return res.json({
        ok: true,
        message: "Login successful.",
        user: {
          _id: account._id,
          username: normalizedUsername,
          email: account.email,
          role: account.role,
          fullName: account.fullName,
          lastLoginAt: account.lastLoginAt,
          isProfileComplete: true,
          isActive: true,
        },
      });
    }

    // ASTROLOGER FLOW

    generateToken(
      res,
      { id: account._id, role: "astrologer", type: "auth" },
      JWT_EXPIRY,
    );

    void AstrologerProfile.updateOne(
      { _id: account._id },
      { $set: { lastActiveAt: new Date() } },
    );

    return res.json({
      ok: true,
      message: "Login successful.",
      astrologer: {
        _id: account._id,
        username: normalizedUsername,
        email: account.email,
        role: "astrologer",
        fullName: account.name,
        lastLoginAt: account.lastLoginAt,
        isActive: true,
        isProfileComplete: true,
      },
    });
  } catch (error) {
    console.error("Login error:", error.stack || error);

    // Handle known DB duplicate error (defensive)
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Duplicate key error.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "An unexpected error occurred during login.",
    });
  }
}

/* ------------------------------------------------------------------
   LOGOUT
------------------------------------------------------------------ */

export async function logout(req, res) {
  try {
    const token = req.cookies?.auth || req.cookies?.profile;
    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "No token provided",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        ignoreExpiration: true,
      });
    } catch {
      return res.status(400).json({
        ok: false,
        message: "Invalid token",
      });
    }

    if (decoded?.exp) {
      await BlacklistedToken.create({
        tokenHash: BlacklistedToken.hashToken(token),
        expiresAt: new Date(decoded.exp * 1000),
      });
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("auth", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
    });
    res.clearCookie("profile", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
    });

    return res.json({
      ok: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Logout failed",
    });
  }
}

/* ------------------------------------------------------------------
   VERIFY SESSION
------------------------------------------------------------------ */
export async function verifySession(req, res) {
  try {
    // If token missing or invalid, middleware should not attach user
    if (!req.user?.id || !req.user?.role) {
      return res.json({
        ok: true,
        user: null,
      });
    }

    const { id, role } = req.user;

    /* ============================================================
       USER SESSION CHECK
    ============================================================ */

    if (role === "user" || role === "admin") {
      const user = await User.findById(id, {
        username: 1,
        email: 1,
        role: 1,
        isProfileComplete: 1,
        isActive: 1,
        fullName: 1,
        lastLoginAt: 1,
        loginCount: 1,
      }).lean();

      if (!user || !user.isActive) {
        return res.json({ ok: true, user: null });
      }

      return res.json({
        ok: true,
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
          isProfileComplete: user.isProfileComplete,
          isActive: true,
          lastLoginAt: user.lastLoginAt,
          loginCount: user.loginCount,
        },
      });
    }

    /* ============================================================
       ASTROLOGER SESSION CHECK
    ============================================================ */

    if (role === "astrologer") {
      const astrologer = await AstrologerProfile.findById(id, {
        username: 1,
        email: 1,
        name: 1,
        isActive: 1,
        isVerified: 1,
        lastActiveAt: 1,
      }).lean();

      if (!astrologer || !astrologer.isActive) {
        return res.json({ ok: true, user: null });
      }

      return res.json({
        ok: true,
        astrologer: {
          _id: astrologer._id,
          username: astrologer.username,
          fullName: astrologer.name,
          isVerified: astrologer.isVerified,
          lastActiveAt: astrologer.lastActiveAt,
          isActive: true,
          isProfileComplete: astrologer.isProfileComplete || true,
          role: "astrologer",
        },
      });
    }

    // If role is unexpected
    console.log("Unexpected role in token:", role);
    return res.json({ ok: true, user: null });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Session verification failed",
    });
  }
}

/* ------------------------------------------------------------------
   USERNAME AVAILABILITY CHECK
------------------------------------------------------------------ */

export async function checkUsernameAvailability(req, res) {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      ok: false,
      message: "Username is required",
    });
  }

  const normalizedUsername = username.toLowerCase().trim();

  /* ------------------------------------------------------------
     FORMAT VALIDATION (Fail Fast)
  ------------------------------------------------------------ */

  const usernameRegex = /^[a-z0-9_]{3,30}$/;

  if (!usernameRegex.test(normalizedUsername)) {
    return res.status(400).json({
      ok: false,
      message:
        "Username must be 3–30 characters and contain only lowercase letters, numbers, or underscores.",
    });
  }

  /* ------------------------------------------------------------
     CHECK DATABASE
  ------------------------------------------------------------ */

  const existingUser = await User.findOne(
    { username: normalizedUsername },
    { _id: 1 },
  ).lean();

  if (existingUser) {
    return res.json({
      ok: true,
      available: false,
      message: "Username already taken",
    });
  }

  return res.json({
    ok: true,
    available: true,
    message: "Username is available",
  });
}
