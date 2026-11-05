import mongoose from "mongoose";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import { User } from "../models/UserModel.js";
import generateToken from "../utils/generateTokenUtil.js";
import { logger } from "../utils/logger.js";

/*
  PROFILE CONTROLLER — HIGH TRAFFIC OPTIMIZED

  Key guarantees:
  - single user lookup
  - lean reads
  - minimal field selection
  - zero duplicate DB calls
  - predictable execution paths
  - no unnecessary console logging
*/

const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

/* ============================================================
   GET PROFILE — O(1) READ
============================================================ */

export async function getProfile(req, res) {
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  try {
    let account = null;
    if (req.user.role === "user" || req.user.role === "admin") {
      account = await User.findById(userId, {
        email: 1,
        role: 1,
        isActive: 1,
        phoneNumber: 1,
        fullName: 1,
        dateOfBirth: 1,
        gender: 1,
        location: 1,
      }).lean();
    }

    if (req.user.role === "astrologer") {
      account = await AstrologerProfile.findById(userId, {
        name:1,
        email:1,
        role:1,
        isActive:1,
        isVerified:1,
        phoneNumber:1,
      }).lean();
    }

    if (!account) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }
    if (!account.isActive) {
      return res.status(403).json({
        ok: false,
        message: "Account is disabled",
      });
    }
    return res.json({
      ok: true,
      user: account,
    });
  } catch (error) {
    logger.error("Failed to load profile", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to load profile",
    });
  }
}

/* ============================================================
   UPDATE PROFILE — O(1) WRITE
============================================================ */

export async function updateProfile(req, res) {
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  const { fullName, phoneNumber, dateOfBirth, location, gender } = req.body;

  /* ---------------- VALIDATIONS ---------------- */

  const errors = {};

  // Full Name
  if (
    typeof fullName !== "string" ||
    !/^[a-zA-Z\s]{2,60}$/.test(fullName.trim())
  ) {
    errors.fullName =
      "Full name must be 2-60 characters and contain only letters and spaces.";
  }

  // Phone Number (E.164 format)
  if (
    typeof phoneNumber !== "string" ||
    !/^\+[1-9]\d{7,14}$/.test(phoneNumber)
  ) {
    errors.phoneNumber =
      "Phone number must be in valid international format (e.g., +919876543210).";
  }

  // Date of Birth
  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (!dateOfBirth || Number.isNaN(dob.getTime()) || dob >= today) {
    errors.dateOfBirth = "Invalid date of birth.";
  } else {
    const age =
      today.getFullYear() -
      dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        ? 1
        : 0);

    if (age < 13) {
      errors.dateOfBirth = "User must be at least 13 years old.";
    }
  }

  // Location
  if (
    typeof location !== "string" ||
    location.trim().length < 2 ||
    location.trim().length > 100
  ) {
    errors.location = "Location must be between 2 and 100 characters.";
  }

  // Gender
  const allowedGenders = ["male", "female", "other"];

  if (!allowedGenders.includes(gender)) {
    errors.gender = "Gender must be male, female, or other.";
  }

  // If validation fails
  if (Object.keys(errors).length > 0) {
    // console.log("Profile update validation errors:", errors);
    return res.status(400).json({
      ok: false,
      errors,
    });
  }

  /* ---------------- UPDATE ---------------- */

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fullName: fullName.trim(),
          phoneNumber,
          dateOfBirth: dob,
          location: location.trim(),
          gender,
          isProfileComplete: true,
        },
      },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }
    if (req.cookies?.profile) {
      res.clearCookie("profile");
      generateToken(
        res,
        { id: updatedUser._id, role: updatedUser.role, type: "auth" },
        JWT_EXPIRY,
      );
      const now = new Date();
      User.updateOne(
        { _id: updatedUser._id },
        { $set: { lastLoginAt: now } },
      ).catch(() => {});
    }
    return res.json({
      ok: true,
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Profile update failed", {
      error: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: "Failed to update profile",
    });
  }
}
