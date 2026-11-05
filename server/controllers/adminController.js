import mongoose from "mongoose";
import { AstrologerProfile } from "../models/AstrologersModel.js";
import { User } from "../models/UserModel.js";
import { Booking } from "../models/BookingModel.js";
import Payment from "../models/PaymentModel.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import {
  bookingFailedCounter,
  paymentStatusCounter,
  webhookEventsCounter,
  redisUpGauge,
  mongoUpGauge,
} from "../monitoring/metrics.js";

/* ------------------------------------------------------------------
   ADMIN — CREATE USER
------------------------------------------------------------------ */
export const adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, role } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        ok: false,
        message: "Full name and email are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        message: "User with this email already exists",
      });
    }

    // Hash a default password
    const hashedPassword = await bcrypt.hash("Welcome@123", 10);

    const user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
      isProfileComplete: false,
    });

    await user.save();

    return res.json({
      ok: true,
      message: "User created successfully",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to create user",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — LIST USERS (HIGH TRAFFIC OPTIMIZED)
------------------------------------------------------------------ */
export const adminListUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const query = { role: "user" };

    if (req.query.isActive === "true") query.isActive = true;
    else if (req.query.isActive === "false") query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "_id fullName email isActive lastLoginAt isProfileComplete createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    return res.json({
      ok: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch users",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — ACTIVATE / DEACTIVATE USER
------------------------------------------------------------------ */
export const adminSetUserActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "isActive must be boolean",
      });
    }

    const updated = await User.updateOne({ _id: id }, { $set: { isActive } });

    if (!updated.matchedCount) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.json({
      ok: true,
      message: `User ${isActive ? "activated" : "deactivated"}`,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to update user",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — DELETE USER
------------------------------------------------------------------ */
export const adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug("Delete user request", { userId: id });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid user ID",
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    logger.debug("User found", { userId: id, exists: !!user });
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    // Check if it's the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          ok: false,
          message: "Cannot delete the last admin",
        });
      }
    }

    // Delete the user (this will also delete related astrologer profile if exists)
    const deleteResult = await User.findByIdAndDelete(id);
    logger.debug("User deleted", { userId: id });

    // Also delete astrologer profile if exists
    await AstrologerProfile.deleteOne({ userId: id });

    return res.json({
      ok: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to delete user",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — GET USER BY ID
------------------------------------------------------------------ */
export const adminGetUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password -otp").lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.json({
      ok: true,
      data: user,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch user",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — LIST ASTROLOGERS (AGGREGATION OPTIMIZED)
------------------------------------------------------------------ */
export const adminListAstrologers = async (req, res) => {
  try {
    const astrologers = AstrologerProfile.find(
      { },
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
        isActive: 1,
        createdAt: 1,
        isVerified: 1,
      },
    )
      .sort({ experience: -1, createdAt: -1 })
      .lean();
    return res.json({
      ok: true,
      data: await astrologers
    });
  } catch (error) {
    console.error("Error fetching astrologers:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch astrologers",
    });
  }
};

/* ------------------------------------------------------------------
   ADMIN — VERIFY / UNVERIFY ASTROLOGER
------------------------------------------------------------------ */
export const updateAstrologerVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "isVerified must be boolean",
      });
    }

    const updated = await AstrologerProfile.updateOne(
      { userId },
      { $set: { isVerified } },
    );

    if (!updated.matchedCount) {
      return res.status(404).json({
        ok: false,
        message: "Astrologer profile not found",
      });
    }

    return res.json({
      ok: true,
      message: `Astrologer ${isVerified ? "verified" : "unverified"}`,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to update verification",
    });
  }
};
/* ------------------------------------------------------------------
   ADMIN — MONITORING SUMMARY (METRICS + DB SNAPSHOT)
------------------------------------------------------------------ */

function getGaugeValueSafely(gauge) {
  try {
    const data = gauge.get();
    const first = data?.values?.[0];
    return typeof first?.value === "number" ? first.value : 0;
  } catch {
    return 0;
  }
}

function getCounterTotal(metric) {
  try {
    const data = metric.get();
    if (!data?.values) return 0;
    return data.values.reduce((sum, v) => sum + (v.value || 0), 0);
  } catch {
    return 0;
  }
}

function getCounterTotalByLabel(metric, labelKey, labelValue) {
  try {
    const data = metric.get();
    if (!data?.values) return 0;
    return data.values
      .filter((v) => v.labels && v.labels[labelKey] === labelValue)
      .reduce((sum, v) => sum + (v.value || 0), 0);
  } catch {
    return 0;
  }
}

export const adminMonitoringSummary = async (req, res) => {
  try {
    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      bookingsByStatusAgg,
      totalPayments,
      paymentsByStatusAgg,
      createdBookings24h,
      completedBookings24h,
      createdPayments24h,
      capturedPayments24h,
      failedPayments24h,
    ] = await Promise.all([
      Booking.countDocuments({}),
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.countDocuments({}),
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Booking.countDocuments({ createdAt: { $gte: last24h } }),
      Booking.countDocuments({ status: "completed", createdAt: { $gte: last24h } }),
      Payment.countDocuments({ createdAt: { $gte: last24h } }),
      Payment.countDocuments({ status: "captured", createdAt: { $gte: last24h } }),
      Payment.countDocuments({ status: "failed", createdAt: { $gte: last24h } }),
    ]);

    const bookingsByStatus = bookingsByStatusAgg.reduce((acc, item) => {
      if (!item?._id) return acc;
      acc[item._id] = item.count || 0;
      return acc;
    }, {});

    const paymentsByStatus = paymentsByStatusAgg.reduce((acc, item) => {
      if (!item?._id) return acc;
      acc[item._id] = item.count || 0;
      return acc;
    }, {});

    const bookingFailedTotal = getCounterTotal(bookingFailedCounter);
    const paymentFailedTotal = getCounterTotalByLabel(
      paymentStatusCounter,
      "status",
      "failed",
    );
    const webhookUnknownPaymentTotal = getCounterTotalByLabel(
      webhookEventsCounter,
      "result",
      "unknown_payment",
    );

    const redisUp = getGaugeValueSafely(redisUpGauge);
    const mongoUp = getGaugeValueSafely(mongoUpGauge);

    return res.json({
      ok: true,
      data: {
        infra: {
          redisUp,
          mongoUp,
        },
        bookings: {
          total: totalBookings,
          byStatus: bookingsByStatus,
          last24h: {
            created: createdBookings24h,
            completed: completedBookings24h,
          },
          failedTotal: bookingFailedTotal,
        },
        payments: {
          total: totalPayments,
          byStatus: paymentsByStatus,
          last24h: {
            created: createdPayments24h,
            captured: capturedPayments24h,
            failed: failedPayments24h,
          },
          failedTotal: paymentFailedTotal,
          webhookUnknownPaymentTotal,
        },
      },
    });
  } catch (error) {
    logger.error("Admin monitoring summary error", { message: error?.message });
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch monitoring summary",
    });
  }
};
/* ------------------------------------------------------------------
   ADMIN — DELETE ASTROLOGER
------------------------------------------------------------------ */
export const adminDeleteAstrologer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete astrologer request", { astrologerId: id });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid ID format:", id);
      return res.status(400).json({
        ok: false,
        message: "Invalid astrologer ID",
      });
    }

    // Check if astrologer profile exists
    const astrologer = await AstrologerProfile.findById(id);
    console.log("Astrologer found", { astrologerId: id, exists: !!astrologer });

    if (!astrologer) {
      return res.status(404).json({
        ok: false,
        message: "Astrologer not found",
      });
    }

    // Delete the astrologer profile
    await AstrologerProfile.findByIdAndDelete(id);
    console.log("Astrologer deleted", { astrologerId: id });

    // Also delete the associated user if they have no other profiles
    if (astrologer.userId) {
      const otherProfiles = await AstrologerProfile.countDocuments({
        userId: astrologer.userId,
      });
      if (otherProfiles === 0) {
        await User.findByIdAndDelete(astrologer.userId);
        console.log("Associated user deleted", { userId: astrologer.userId });
      }
    }

    return res.json({
      ok: true,
      message: "Astrologer deleted successfully",
    });
  } catch (error) {
    console.error("Delete astrologer error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to delete astrologer",
    });
  }
};
