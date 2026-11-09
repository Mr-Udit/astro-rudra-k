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

import { Booking } from "../models/BookingModel.js";

/* ============================================================
   GET EARNINGS SUMMARY FOR ASTROLOGER
============================================================ */

export async function getAstrologerEarningsSummary(req, res) {
  try {
    const astrologerId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    // Aggregation pipeline to calculate earnings from completed bookings
    const pipeline = [
      {
        $match: {
          astrologerId: new mongoose.Types.ObjectId(astrologerId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$price" },
          totalConsultations: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalEarnings: 1,
          totalConsultations: 1,
        },
      },
    ];

    const result = await Booking.aggregate(pipeline);
    const data = result[0] || {
      totalEarnings: 0,
      totalConsultations: 0,
    };

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    logger.error("Failed to fetch astrologer earnings summary", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch earnings summary",
    });
  }
}

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

/* ============================================================
   FAVORITE ASTROLOGERS
============================================================ */

// Get user's favorite astrologers
export async function getFavorites(req, res) {
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  try {
    const user = await User.findById(userId, {
      favoriteAstrologers: 1,
    }).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    if (!user.favoriteAstrologers || user.favoriteAstrologers.length === 0) {
      return res.json({
        ok: true,
        favorites: [],
      });
    }

    // Fetch astrologer details for each favorite
    const favorites = await AstrologerProfile.find({
      _id: { $in: user.favoriteAstrologers },
    }, {
      name: 1,
      title: 1,
      profileImage: 1,
      experience: 1,
      price: 1,
      specializations: 1,
      isVerified: 1,
      isActive: 1,
    }).lean();

    return res.json({
      ok: true,
      favorites,
    });
  } catch (error) {
    logger.error("Failed to fetch favorites", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch favorites",
    });
  }
}

// Add astrologer to favorites
export async function addFavorite(req, res) {
  const userId = req.user?.id;
  const { astrologerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid astrologer ID",
    });
  }

  try {
    // Check if the astrologer exists
    const astrologer = await AstrologerProfile.findById(astrologerId);
    if (!astrologer) {
      return res.status(404).json({
        ok: false,
        message: "Astrologer not found",
      });
    }

    // Add to favorites if not already present
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favoriteAstrologers: astrologerId },
      },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.json({
      ok: true,
      favorites: updatedUser.favoriteAstrologers,
    });
  } catch (error) {
    logger.error("Failed to add favorite", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to add favorite",
    });
  }
}

// Remove astrologer from favorites
export async function removeFavorite(req, res) {
  const userId = req.user?.id;
  const { astrologerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid astrologer ID",
    });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { favoriteAstrologers: astrologerId },
      },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.json({
      ok: true,
      favorites: updatedUser.favoriteAstrologers,
    });
  } catch (error) {
    logger.error("Failed to remove favorite", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to remove favorite",
    });
  }
}

// Toggle astrologer favorite (add or remove)
export async function toggleFavorite(req, res) {
  const userId = req.user?.id;
  const { astrologerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid astrologer ID",
    });
  }

  try {
    // Check if the astrologer exists
    const astrologer = await AstrologerProfile.findById(astrologerId);
    if (!astrologer) {
      return res.status(404).json({
        ok: false,
        message: "Astrologer not found",
      });
    }

    const user = await User.findById(userId, { favoriteAstrologers: 1 }).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const isFavorite = user.favoriteAstrologers?.some(
      (id) => id.toString() === astrologerId
    ) || false;

    let updatedUser;
    if (isFavorite) {
      // Remove from favorites
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoriteAstrologers: astrologerId } },
        { new: true }
      ).lean();
    } else {
      // Add to favorites
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteAstrologers: astrologerId } },
        { new: true }
      ).lean();
    }

    if (!updatedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const newFavoriteState = !isFavorite;

    return res.json({
      ok: true,
      isFavorite: newFavoriteState,
      favorites: updatedUser.favoriteAstrologers,
    });
  } catch (error) {
    logger.error("Failed to toggle favorite", {
      error: error.message,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to toggle favorite",
    });
  }
}