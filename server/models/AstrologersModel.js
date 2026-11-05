import mongoose, { mongo } from "mongoose";
import slugify from "slugify";

/* ============================================================
   AVAILABILITY SUBDOCUMENT (Optimized Storage)
   day: 0–6 (Sunday–Saturday)
   time stored as minutes from midnight (faster comparisons)
============================================================ */

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
      index: true,
    },

    // stored as "HH:mm" (string comparison is safe)
    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
    minimize: true,
  },
);

/* ============================================================
   ASTROLOGER PROFILE MODEL
============================================================ */

const astrologerProfileSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    profileImage: {
      type: String,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    consultations: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    specializations: {
      type: [String],
      required: true,
      set: (arr) => arr.map((v) => v.toLowerCase().trim()),
      index: true,
    },

    languages: {
      type: [String],
      required: true,
      set: (arr) => arr.map((v) => v.toLowerCase().trim()),
      index: true,
    },

    about: {
      type: String,
      maxlength: 500,
    },

    availability: {
      type: [availabilitySchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ================================
       AUTO-CALCULATED FIELDS
    ================================= */

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    totalReviews: {
      type: Number,
      default: 0,
      index: true,
    },

    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },

    lastActiveAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ============================================================
   INDEX STRATEGY (Query-Driven)
============================================================ */

// Main listing page (sorted by rating & experience)
astrologerProfileSchema.index({
  isActive: 1,
  isVerified: 1,
  averageRating: -1,
  experience: -1,
});

// Specialization filtering
astrologerProfileSchema.index({
  specializations: 1,
  isActive: 1,
});

// Price filtering
astrologerProfileSchema.index({
  price: 1,
  isActive: 1,
});

// Recent activity ranking
astrologerProfileSchema.index({
  lastActiveAt: -1,
});

/* ============================================================
   AUTO-GENERATED SLUG
============================================================ */

astrologerProfileSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(`${this.name}-${this.astrologerId}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

/* ============================================================
   REVIEW MODEL (SEPARATE COLLECTION)
   Prevents document growth
============================================================ */

const astrologerReviewSchema = new mongoose.Schema(
  {
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AstrologerProfile",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate review by same user
astrologerReviewSchema.index({ astrologerId: 1, userId: 1 }, { unique: true });

/* ============================================================
   AUTO UPDATE PROFILE STATS WHEN REVIEW CHANGES
============================================================ */

async function updateAstrologerStats(astrologerId) {
  const stats = await mongoose.model("AstrologerReview").aggregate([
    { $match: { astrologerId } },
    {
      $group: {
        _id: "$astrologerId",
        avgRating: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avgRating || 0;
  const total = stats[0]?.total || 0;

  await mongoose.model("AstrologerProfile").updateOne(
    { astrologerId },
    {
      averageRating: avg,
      totalReviews: total,
      popularityScore: avg * Math.log(total + 1),
    },
  );
}

// After review create/update/delete
astrologerReviewSchema.post("save", function () {
  updateAstrologerStats(this.astrologerId);
});

astrologerReviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) updateAstrologerStats(doc.astrologerId);
});

/* ============================================================
   EXPORT MODELS
============================================================ */

export const AstrologerProfile = mongoose.model(
  "AstrologerProfile",
  astrologerProfileSchema,
);

export const AstrologerReview = mongoose.model(
  "AstrologerReview",
  astrologerReviewSchema,
);
