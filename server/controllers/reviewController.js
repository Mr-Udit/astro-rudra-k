import mongoose from "mongoose";
import { AstrologerProfile, AstrologerReview } from "../models/AstrologersModel.js";
import { Booking } from "../models/BookingModel.js";
import { AppError } from "../utils/AppError.js";

/* ------------------------------------------------------------------
   CREATE OR UPDATE REVIEW FOR ASTROLOGER (USER TESTIMONIAL)
   - Only allowed for completed consultations
   - One review per user per astrologer (upsert)
------------------------------------------------------------------ */

export const createAstrologerReview = async (req, res) => {
  try {
    const { id: astrologerId } = req.params;
    const { rating, comment, bookingId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
      return res.status(400).json({ ok: false, message: "Invalid astrologer id" });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: "Rating must be between 1 and 5" });
    }

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ ok: false, message: "Valid bookingId is required" });
    }

    if (!req.user?.id || req.user.role !== "user") {
      return res.status(401).json({ ok: false, message: "Only users can leave reviews" });
    }

    // Ensure astrologer exists and is active
    const astrologer = await AstrologerProfile.findById(astrologerId, {
      _id: 1,
      isActive: 1,
    }).lean();

    if (!astrologer || astrologer.isActive === false) {
      return res.status(404).json({ ok: false, message: "Astrologer not found" });
    }

    // Ensure user has a completed booking with this astrologer
    const completedBooking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
      astrologerId,
      status: "completed",
    }).lean();

    if (!completedBooking) {
      return res.status(400).json({
        ok: false,
        message: "You can only review completed consultations with this astrologer",
      });
    }

    const sanitizedComment = (comment || "").toString().trim().slice(0, 500);

    const review = await AstrologerReview.findOneAndUpdate(
      { astrologerId, userId: req.user.id },
      {
        $set: {
          rating,
          comment: sanitizedComment,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(201).json({
      ok: true,
      message: "Review saved",
      data: {
        id: review._id,
        astrologerId: review.astrologerId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (err) {
    // Handle duplicate key error from unique (astrologerId,userId) index
    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "You have already reviewed this astrologer",
      });
    }

    const statusCode = err instanceof AppError ? err.statusCode : 500;
    return res.status(statusCode).json({
      ok: false,
      message: err.message || "Failed to save review",
    });
  }
};

/* ------------------------------------------------------------------
   LIST REVIEWS FOR ASTROLOGER
   - Public, paginated
------------------------------------------------------------------ */

export const listAstrologerReviews = async (req, res) => {
  try {
    const { id: astrologerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(astrologerId)) {
      return res.status(400).json({ ok: false, message: "Invalid astrologer id" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      AstrologerReview.find({ astrologerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AstrologerReview.countDocuments({ astrologerId }),
    ]);

    return res.json({
      ok: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: reviews.map((r) => ({
        id: r._id,
        astrologerId: r.astrologerId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch reviews",
    });
  }
};

/* ------------------------------------------------------------------
   FEATURED TESTIMONIALS (FOR LANDING PAGE)
   - Top recent reviews across astrologers
------------------------------------------------------------------ */

export const getFeaturedTestimonials = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);

    const pipeline = [
      { $sort: { createdAt: -1, rating: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "astrologerprofiles",
          localField: "astrologerId",
          foreignField: "_id",
          as: "astrologer",
        },
      },
      { $unwind: { path: "$astrologer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          astrologerName: "$astrologer.name",
        },
      },
    ];

    const reviews = await AstrologerReview.aggregate(pipeline);

    const data = reviews.map((r) => ({
      id: r._id.toString(),
      text: r.comment || "",
      name: "Verified Client",
      role: r.astrologerName ? `Client of ${r.astrologerName}` : "Astro Rudra Client",
      rating: r.rating,
      date: r.createdAt,
    }));

    return res.json({
      ok: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch testimonials",
    });
  }
};
