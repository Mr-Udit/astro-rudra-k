import mongoose from "mongoose";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import {
  listAstrologers,
  getAstrologerById,
  createAstrologer,
  // removeAstrologer,
  setAstrologerStatus,
} from "../services/astrologerService.js";
import { redis } from "../config/redisClient.js";
import { logger } from "../utils/logger.js";

/*
  ASTROLOGER CONTROLLER — SCALE OPTIMIZED

  Improvements applied:
  - zero unnecessary model imports
  - strict ObjectId validation
  - lean read paths only
  - minimized DB payloads
  - no duplicated queries
  - predictable error handling
  - constant-time update operations
*/

/* ============================================================
   CREATE ASTROLOGER
============================================================ */

export const createAstrologerHandler = async (req, res) => {
  try {
    const result = await createAstrologer(req.body);
    return res.status(201).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

/* ============================================================
   LIST ASTROLOGERS (HIGH READ)
============================================================ */

export const listAstrologersHandler = async (req, res) => {
  // console.log("Listing astrologers...");
  const astrologers = await listAstrologers();
  // console.log("Fetched astrologers:", astrologers);
  return res.json({
    ok: true,
    data: astrologers,
  });
};

/* ============================================================
   GET ASTROLOGER BY ID
============================================================ */

export const getAstrologerByIdController = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid astrologer id",
    });
  }

  try {
    const astrologer = await getAstrologerById(id);

    return res.json({
      ok: true,
      data: astrologer,
    });
  } catch (err) {
    return res.status(
      err.message === "Astrologer not found" ? 404 : 500
    ).json({
      ok: false,
      message: err.message,
    });
  }
};

/* ============================================================
   GET AVAILABILITY (CACHED PER ASTROLOGER)
============================================================ */

const AVAILABILITY_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

export const getAstrologerAvailabilityController = async (
  req,
  res
) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid astrologer id",
    });
  }

  const cacheKey = `astrologer:${id}:availability:v1`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // Track usage for cleanup decisions
      try {
        await redis.incr(`${cacheKey}:hits`);
      } catch {
        // ignore
      }
      return res.json({ ok: true, data: JSON.parse(cached) });
    }
  } catch {
    // Ignore cache errors and hit DB instead
  }

  const astrologer = await AstrologerProfile.findById(
    id,
    { availability: 1 }
  ).lean();

  if (!astrologer) {
    return res.status(404).json({
      ok: false,
      message: "Astrologer not found",
    });
  }

  const availability = astrologer.availability || [];

  try {
    await redis.setEx(
      cacheKey,
      AVAILABILITY_CACHE_TTL_SECONDS,
      JSON.stringify(availability),
    );
  } catch {
    // Ignore cache write errors
  }

  return res.json({
    ok: true,
    data: availability,
  });
};

/* ============================================================
   UPDATE AVAILABILITY (WRITE PATH)
============================================================ */

export const updateAstrologerAvailabilityController =
  async (req, res) => {
    const { id } = req.params;
    const { availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid astrologer id",
      });
    }

    if (!Array.isArray(availability) || !availability.length) {
      return res.status(400).json({
        ok: false,
        message: "Availability array required",
      });
    }

    const timeRegex =
      /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const slot of availability) {
      if (
        !slot.day ||
        !timeRegex.test(slot.startTime) ||
        !timeRegex.test(slot.endTime) ||
        slot.startTime >= slot.endTime
      ) {
        return res.status(400).json({
          ok: false,
          message:
            "Invalid availability slot format",
        });
      }
    }

    const updated =
      await AstrologerProfile.findByIdAndUpdate(
        id,
        { $set: { availability } },
        {
          new: true,
          runValidators: true,
          projection: { availability: 1 },
        }
      ).lean();

    if (!updated) {
      return res.status(404).json({
        ok: false,
        message: "Astrologer not found",
      });
    }

    // Invalidate cached availability and astrologer list since schedule changed
    try {
      await Promise.all([
        redis.del(`astrologer:${id}:availability:v1`),
        redis.del("astrologers:list:v1"),
      ]);
    } catch {
      // Ignore cache invalidation errors
    }

    return res.json({
      ok: true,
      message: "Availability updated",
      data: updated.availability,
    });
  };

/* ============================================================
   GET SPECIALIZATIONS
============================================================ */

export const getSpecializationsHandler = async (req, res) => {
  // Static list for now, or could be aggregated from DB
  const specializations = [
    "Vedic",
    "Numerology",
    "Tarot",
    "Palmistry",
    "Vastu",
    "Face Reading",
    "KP Astrology",
    "Nadi",
    "Prashna",
  ];

  return res.json({
    ok: true,
    data: specializations,
  });
};

/* ============================================================
   VERIFY / UNVERIFY ASTROLOGER
============================================================ */

export const setVerificationAstrologerHandler =
  async (req, res) => {
    try {
      const profile = await setAstrologerStatus(
        req.params.id,
        req.body.isVerified
      );

      return res.json({
        ok: true,
        message: "Verification updated",
        data: profile,
      });
    } catch (err) {
      return res.status(404).json({
        ok: false,
        message: err.message,
      });
    }
  };

/* ============================================================
   SOFT DELETE ASTROLOGER
============================================================ */

// export const removeAstrologerHandler = async (
//   req,
//   res
// ) => {
//   try {
//     await removeAstrologer(req.params.id);

//     return res.json({
//       ok: true,
//       message: "Astrologer removed",
//     });
//   } catch (err) {
//     return res.status(404).json({
//       ok: false,
//       message: err.message,
//     });
//   }
// };
