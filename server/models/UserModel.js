import mongoose from "mongoose";

/* ============================================================
   USER SCHEMA
============================================================ */

const userSchema = new mongoose.Schema(
  {
    /* ------------------------------------------------------------
       CORE IDENTITY
    ------------------------------------------------------------ */

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

    fullName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "astrologer"],
      required: true,
      index: true,
    },

    /* ------------------------------------------------------------
       PROFILE STATUS
    ------------------------------------------------------------ */

    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ------------------------------------------------------------
       DATE OF BIRTH (UTC SAFE)
    ------------------------------------------------------------ */

    dateOfBirth: {
      type: Date,
      index: true,
      set: normalizeUTCDate,
      validate: {
        validator(value) {
          if (!value) return true;
          return value < new Date();
        },
        message: "Date of birth must be in the past",
      },
    },

    age: {
      type: Number,
      min: 0,
      max: 120,
      index: true,
    },

    /* ------------------------------------------------------------
       PROFILE INFO
    ------------------------------------------------------------ */

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      lowercase: true,
      trim: true,
      default: "prefer_not_to_say",
      index: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      index: true,
    },

    /* ------------------------------------------------------------
       ACTIVITY TRACKING
    ------------------------------------------------------------ */

    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    /* ------------------------------------------------------------
       FAVORITES / WISHLIST
    ------------------------------------------------------------ */

    favoriteAstrologers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AstrologerProfile",
        index: true,
      },
    ],
  },
  {
    timestamps: true,
    minimize: true,
    versionKey: false,
    autoIndex: false,
  },
);

/* ============================================================
   HELPERS
============================================================ */

function normalizeUTCDate(value) {
  if (!value) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function calculateAge(dob) {
  if (!dob) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getUTCFullYear();
  const m = today.getMonth() - dob.getUTCMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getUTCDate())) {
    age--;
  }

  return age;
}

/* ============================================================
   AUTO-CALCULATED FIELDS
============================================================ */

userSchema.pre("save", function (next) {
  if (this.isModified("dateOfBirth") && this.dateOfBirth) {
    this.age = calculateAge(this.dateOfBirth);
  }
  next();
});

/* ============================================================
   INDEX STRATEGY (QUERY DRIVEN)
============================================================ */

// Active users by role
userSchema.index({ role: 1, isActive: 1 });

// Profile completion dashboard
userSchema.index({ isProfileComplete: 1, role: 1 });

// Recently active users
userSchema.index({ lastLoginAt: -1 });

// Age filtering
userSchema.index({ age: 1 });

// Phone unique only if exists
userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    sparse: true,
  },
);

// Favorite astrologers for quick lookup
userSchema.index({ favoriteAstrologers: 1 });

/* ============================================================
   SAFE DELETE METHOD
============================================================ */

userSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

/* ============================================================
   EXPORT
============================================================ */

export const User = mongoose.model("User", userSchema);
