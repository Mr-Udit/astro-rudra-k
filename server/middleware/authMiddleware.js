import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import BlacklistedToken from "../models/BlacklistedTokenModel.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing — authentication cannot initialize");
}

/* ============================================================
   INTERNAL TOKEN VALIDATION
============================================================ */

async function verifyAndValidateToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (!decoded?.id || !decoded?.role || !decoded?.type) {
    throw new Error("Invalid token payload");
  }

  const tokenHash = BlacklistedToken.hashToken(token);

  const isBlacklisted = await BlacklistedToken.exists({ tokenHash });

  if (isBlacklisted) {
    throw new Error("Blacklisted token");
  }

  return decoded;
}

/* ============================================================
   OPTIONAL AUTH
============================================================ */

export function authOptional() {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.auth || req.cookies?.profile;

      if (!token) {
        req.user = null;
        return next();
      }

      const decoded = await verifyAndValidateToken(token);

      req.user = {
        id: decoded.id,
        role: decoded.role,
        type: decoded.type,
      };

      return next();
    } catch {
      req.user = null;
      return next();
    }
  };
}

/* ============================================================
   REQUIRED AUTH
============================================================ */

export function authRequired({
  allowedRoles = [],
  allowedTokenTypes = ["auth" , "profile"],
} = {}) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.auth || req.cookies?.profile;
      // console.log("Received token:", token);
      if (!token) {
      console.log("No token provided");
        return res.status(401).json({
          ok: false,
          message: "Unauthorized",
        });
      }

      const decoded = await verifyAndValidateToken(token);

      /* ------------------------------------------------------------
         TOKEN TYPE CHECK
      ------------------------------------------------------------ */

      if (!allowedTokenTypes.includes(decoded.type)) {
        console.log(decoded.type, allowedTokenTypes);
        return res.status(403).json({
          ok: false,
          message: "Insufficient token privileges",
        });
      }

      /* ------------------------------------------------------------
         ROLE CHECK (JWT FIRST)
      ------------------------------------------------------------ */

      if (
        allowedRoles.length &&
        !allowedRoles.includes(decoded.role)
      ) {
        return res.status(403).json({
          ok: false,
          message: "Access denied",
        });
      }

      /* ------------------------------------------------------------
         ROLE-BASED DB VALIDATION
      ------------------------------------------------------------ */

      let account = null;

      if (decoded.role === "user" || decoded.role === "admin") {
        account = await User.findById(
          decoded.id,
          { role: 1, isActive: 1, fullName :1, username:1, email:1, phoneNumber:1 } 
        ).lean();
      }

      if (decoded.role === "astrologer") {
        account = await AstrologerProfile.findById(
          decoded.id,
          { isActive: 1 }
        ).lean();
      }

      if (!account || !account.isActive) {
        return res.status(401).json({
          ok: false,
          message: "Account invalid or disabled",
        });
      }

      req.user = {
        id: decoded.id,
        role: decoded.role,
        type: decoded.type,
      };
      if (account.fullName) {
        req.user.fullName = account.fullName;
      }
      if (account.email) {
        req.user.email = account.email;
      }
      if (account.phoneNumber) {
        req.user.phoneNumber = account.phoneNumber;
      }
      if (account.username) {
        req.user.username = account.username;
      }
      /* The line `console.log("Authenticated user:", req.user);` is logging the information of the
      authenticated user to the console. It will display the user's details such as their ID, role,
      type, full name, email, phone number, and username if available. This logging statement is
      used to provide visibility into the user's information after successful authentication within
      the `authRequired` middleware function. */
      console.log("Authenticated user:", req.user);
      // console.log("token valid for the user:", req.user.id);
      // console.log("token valid for the username:", req.user.username);
      return next();
    } catch (err) {
      console.log("Error in authRequired middleware:", err);
      return res.status(401).json({
        ok: false,
        message: "Invalid or expired token",
      });
    }
  };
}
