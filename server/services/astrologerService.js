import mongoose from "mongoose";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import { User } from "../models/UserModel.js";
import { redis } from "../config/redisClient.js";

/*
  ASTROLOGER SERVICE — LARGE SCALE OPTIMIZED
  */
async function generateAstrologerUsername(fullName) {
  if (!fullName || typeof fullName !== "string") {
    throw new Error("Full name is required");
  }

  // Create slug
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const baseUsername = `astro_${slug}`;

  // Find similar usernames
  const existingUsers = await User.find({
    username: { $regex: `^${baseUsername}(_\\d+)?$` },
  }).select("username");

  if (existingUsers.length === 0) {
    return baseUsername;
  }

  // Extract numbers
  const numbers = existingUsers
    .map((u) => {
      const match = u.username.match(/_(\d+)$/);
      return match ? parseInt(match[1], 10) : 1;
    })
    .sort((a, b) => b - a);

  const nextNumber = numbers[0] + 1;

  return `${baseUsername}_${nextNumber}`;
}

/* ============================================================
   CREATE ASTROLOGER (ATOMIC)
============================================================ */

export const createAstrologer = async (payload) => {
  const session = await mongoose.startSession();
  console.log("Creating astrologer with payload:", payload);
  try {
    session.startTransaction();

    // normalize inbound field names so admin form works without any
    // backend churn.  the validator still accepts "skills" and
    // "experienceYears" but the DB model uses "specializations" and
    // "experience".
    const experienceValue =
      payload.experienceYears ?? payload.experience ?? 0;
    const specializationsValue =
      payload.skills ?? payload.specializations ?? [];
    const languagesValue =
      payload.languages || [];

    await AstrologerProfile.create(
      [
        {
          username: await generateAstrologerUsername(payload.fullName),
          name: payload.fullName,
          title: payload.title || '',
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          price: payload.price || 0,
          availability: payload.availability || [],
          experience: experienceValue,
          specializations: specializationsValue,
          languages: languagesValue,
          // accept either string or object
          profileImage: typeof payload.profileImage === 'string'
            ? payload.profileImage
            : payload.profileImage?.url,
          isVerified: true,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      ok: true,
      message: "Astrologer created successfully",
    };
  } catch (err) {
    await session.abortTransaction();
    console.log("Error creating astrologer:", err);
    throw err;
  } finally {
    session.endSession();
  }
};

/* ============================================================
   LIST ASTROLOGERS (EXTREMELY HOT PATH, REDIS CACHED)
============================================================ */

const ASTROLOGER_LIST_CACHE_KEY = "astrologers:list:v1";
const ASTROLOGER_LIST_TTL_SECONDS = 60 * 5; // 5 minutes

export const listAstrologers = async () => {
  // Try Redis cache first
  try {
    const cached = await redis.get(ASTROLOGER_LIST_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Fallback silently to DB on Redis issues
  }

  const astrologers = await AstrologerProfile.find(
    { isVerified: true },
    {
      name: 1,
      title: 1,
      email: 1,
      phoneNumber: 1,
      price: 1,
      availability: 1,
      experience: 1,
      specializations: 1,
      languages: 1,
      profileImage: 1,
    },
  )
    .sort({ experience: -1, createdAt: -1 })
    .lean();

  try {
    await redis.setEx(
      ASTROLOGER_LIST_CACHE_KEY,
      ASTROLOGER_LIST_TTL_SECONDS,
      JSON.stringify(astrologers),
    );
  } catch {
    // Ignore cache write errors
  }

  return astrologers;
};

/* ============================================================
   GET ASTROLOGER BY ID
============================================================ */

export const getAstrologerById = async (profileId) => {
  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    throw new Error("Invalid astrologer ID");
  }

  const astrologer = await AstrologerProfile.findById(profileId, {
    fullName: 1,
    email: 1,
    phoneNumber: 1,
    price: 1,
    availability: 1,
    experienceYears: 1,
    skills: 1,
    language: 1,
    profileImage: 1,
    isVerified: 1,
    bio: 1,
    experienceSummary: 1,
  }).lean();

  if (!astrologer) {
    throw new Error("Astrologer not found");
  }

  return {
    name: astrologer.fullName,
    email: astrologer.email,
    phoneNumber: astrologer.phoneNumber,
    price: astrologer.price,
    availability: astrologer.availability,
    experience: astrologer.experienceYears,
    specializations: astrologer.skills,
    language: astrologer.language,
    profileImage: astrologer.profileImage,
    bio: astrologer.bio,
    experienceSummary: astrologer.experienceSummary,
    isVerified: astrologer.isVerified,
  };
};

/* ============================================================
   VERIFY / UNVERIFY ASTROLOGER
============================================================ */

export const setAstrologerStatus = async (profileId, status) => {
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    throw new Error("Invalid astrologer ID");
  }

  // Validate status (must be boolean)
  if (typeof status !== "boolean") {
    throw new Error("Status must be boolean");
  }

  const profile = await AstrologerProfile.findByIdAndUpdate(
    profileId,
    { $set: { isVerified: status } },
    {
      new: true,
      projection: { isVerified: 1 },
    },
  ).lean();

  if (!profile) {
    throw new Error("Astrologer not found");
  }

  return profile;
};

/* ============================================================
   DELETE ASTROLOGER (PERMANENT)
============================================================ */

// export const removeAstrologer = async (profileId) => {
//   const profile = await AstrologerProfile.findById(
//     profileId,
//     { userId: 1 }
//   ).lean();

//   if (!profile) {
//     throw new Error("Astrologer not found");
//   }

//   // Actually delete the user and astrologer profile from database
//   await Promise.all([
//     User.findByIdAndDelete(profile.userId),
//     AstrologerProfile.findByIdAndDelete(profileId)
//   ]);

//   return true;
// };
