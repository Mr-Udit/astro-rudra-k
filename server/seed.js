/**
 * Database Seed Script
 * Populates the database with realistic test data for development/testing
 * Run with: node seed.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/UserModel.js";
import { AstrologerProfile, AstrologerReview } from "./models/AstrologersModel.js";
import { Booking } from "./models/BookingModel.js";
import Payment from "./models/PaymentModel.js";
import { generateBookingId } from "./utils/geneateBookingId.js";
import { generatePaymentId } from "./utils/paymentIdGenerator.js";
import connectDB from "./config/db.js";

const SALT_ROUNDS = 10;

// ============================================================
// TEST DATA
// ============================================================

const testUsers = [
  {
    username: "john_doe",
    email: "john.doe@example.com",
    phoneNumber: "+14155550101",
    fullName: "John Doe",
    password: "Test@123",
    role: "user",
    isProfileComplete: true,
    isActive: true,
    dateOfBirth: new Date("1990-05-15"),
    gender: "male",
    location: "San Francisco, CA",
  },
  {
    username: "jane_smith",
    email: "jane.smith@example.com",
    phoneNumber: "+14155550102",
    fullName: "Jane Smith",
    password: "Test@123",
    role: "user",
    isProfileComplete: true,
    isActive: true,
    dateOfBirth: new Date("1992-08-22"),
    gender: "female",
    location: "New York, NY",
  },
  {
    username: "mike_wilson",
    email: "mike.wilson@example.com",
    phoneNumber: "+14155550103",
    fullName: "Mike Wilson",
    password: "Test@123",
    role: "user",
    isProfileComplete: true,
    isActive: true,
    dateOfBirth: new Date("1988-11-30"),
    gender: "male",
    location: "Los Angeles, CA",
  },
  {
    username: "sarah_jones",
    email: "sarah.jones@example.com",
    phoneNumber: "+14155550104",
    fullName: "Sarah Jones",
    password: "Test@123",
    role: "user",
    isProfileComplete: true,
    isActive: true,
    dateOfBirth: new Date("1995-03-18"),
    gender: "female",
    location: "Chicago, IL",
  },
  {
    username: "david_brown",
    email: "david.brown@example.com",
    phoneNumber: "+14155550105",
    fullName: "David Brown",
    password: "Test@123",
    role: "user",
    isProfileComplete: true,
    isActive: true,
    dateOfBirth: new Date("1985-07-25"),
    gender: "male",
    location: "Houston, TX",
  },
];

const testAstrologers = [
  {
    name: "Pandit Rajesh Sharma",
    title: "Vedic Astrologer & Numerologist",
    email: "rajesh.sharma@astrology.com",
    phoneNumber: "+919876543210",
    experience: 20,
    price: 1499,
    specializations: ["Vedic", "Numerology", "KP Astrology"],
    languages: ["Hindi", "English", "Sanskrit"],
    about: "With over 20 years of experience in Vedic astrology and numerology, I provide accurate predictions and practical remedies for career, relationships, health, and spiritual growth. My approach combines traditional wisdom with modern understanding.",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "18:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "18:00" },
      { day: "Friday", startTime: "10:00", endTime: "17:00" },
      { day: "Saturday", startTime: "10:00", endTime: "16:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Dr. Priya Patel",
    title: "Vedic Astrologer & Relationship Counselor",
    email: "priya.patel@astrology.com",
    phoneNumber: "+919876543211",
    experience: 15,
    price: 1299,
    specializations: ["Vedic", "Tarot", "Relationship"],
    languages: ["Hindi", "English", "Gujarati"],
    about: "Specializing in relationship astrology and compatibility analysis. I help individuals and couples understand their cosmic connection and navigate relationship challenges with Vedic remedies and counseling.",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "19:00" },
      { day: "Thursday", startTime: "10:00", endTime: "19:00" },
      { day: "Saturday", startTime: "09:00", endTime: "15:00" },
      { day: "Sunday", startTime: "10:00", endTime: "14:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/women/45.jpg",
  },
  {
    name: "Acharya Vikram Singh",
    title: "KP Astrologer & Vastu Expert",
    email: "vikram.singh@astrology.com",
    phoneNumber: "+919876543212",
    experience: 25,
    price: 1799,
    specializations: ["KP Astrology", "Vastu", "Prashna"],
    languages: ["Hindi", "English", "Punjabi"],
    about: "Renowned KP astrologer and Vastu consultant with 25 years of experience. Expert in precise timing of events, career guidance, property Vastu, and Prashna (horary) astrology for immediate answers.",
    availability: [
      { day: "Monday", startTime: "08:00", endTime: "20:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "20:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "20:00" },
      { day: "Thursday", startTime: "08:00", endTime: "20:00" },
      { day: "Friday", startTime: "08:00", endTime: "18:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/men/67.jpg",
  },
  {
    name: "Guruji Anjali Devi",
    title: "Nadi Astrologer & Spiritual Healer",
    email: "anjali.devi@astrology.com",
    phoneNumber: "+919876543213",
    experience: 30,
    price: 2499,
    specializations: ["Nadi", "Palmistry", "Face Reading", "Spiritual Healing"],
    languages: ["Hindi", "English", "Tamil", "Telugu"],
    about: "Master of ancient Nadi astrology and palmistry with three decades of experience. Provides deep karmic insights, past life analysis, and spiritual healing through mantra and gemstone recommendations.",
    availability: [
      { day: "Monday", startTime: "11:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "11:00", endTime: "17:00" },
      { day: "Friday", startTime: "11:00", endTime: "17:00" },
      { day: "Sunday", startTime: "09:00", endTime: "13:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/women/28.jpg",
  },
  {
    name: "Astro Manoj Kumar",
    title: "Vedic Astrologer & Gemstone Consultant",
    email: "manoj.kumar@astrology.com",
    phoneNumber: "+919876543214",
    experience: 12,
    price: 999,
    specializations: ["Vedic", "Gemstone", "Remedial"],
    languages: ["Hindi", "English", "Bengali"],
    about: "Expert in Vedic astrology with specialization in gemstone therapy and remedial measures. Helps clients choose the right gemstones based on their birth chart for career, health, and prosperity.",
    availability: [
      { day: "Tuesday", startTime: "14:00", endTime: "22:00" },
      { day: "Thursday", startTime: "14:00", endTime: "22:00" },
      { day: "Saturday", startTime: "10:00", endTime: "18:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    name: "Shastri Lakshmi Narayan",
    title: "Traditional Vedic Astrologer",
    email: "lakshmi.narayan@astrology.com",
    phoneNumber: "+919876543215",
    experience: 40,
    price: 2999,
    specializations: ["Vedic", "Muhurta", "Yoga Analysis"],
    languages: ["Hindi", "English", "Sanskrit", "Marathi"],
    about: "Elder statesman of Vedic astrology with 40 years of traditional practice. Specializes in Muhurta (auspicious timing), Yoga analysis in birth charts, and traditional remedies from classical texts.",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "13:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "13:00" },
      { day: "Friday", startTime: "09:00", endTime: "13:00" },
    ],
    isVerified: true,
    isActive: true,
    isProfileComplete: true,
    profileImage: "https://randomuser.me/api/portraits/men/72.jpg",
  },
];

const testAdmin = {
  username: "admin",
  email: "admin@astrology.com",
  phoneNumber: "+14155550100",
  fullName: "Admin User",
  password: "Admin@123",
  role: "admin",
  isProfileComplete: true,
  isActive: true,
};

const consultationTypes = ["voice_call", "video_call", "chat"];
const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"];

const sampleProblemStatements = [
  "Career guidance needed - confused between two job offers",
  "Relationship compatibility analysis for marriage",
  "Health concerns - recurring headaches and stress",
  "Financial planning and investment timing",
  "Business expansion - auspicious timing needed",
  "Family disputes and property matters",
  "Education and career path for child",
  "Spiritual growth and life purpose guidance",
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatDateForBooking(date) {
  return date.toISOString().split("T")[0];
}

function getRandomTime() {
  const hours = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
  const minutes = Math.random() > 0.5 ? "30" : "00";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours;
  return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
}

function getRandomTime24() {
  const hours = Math.floor(Math.random() * 12) + 9; // 9 to 20
  const minutes = Math.random() > 0.5 ? "30" : "00";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      AstrologerProfile.deleteMany({}),
      AstrologerReview.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log("✅ Cleared existing data");

    // Create admin user
    console.log("👤 Creating admin user...");
    const adminPassword = await hashPassword(testAdmin.password);
    const admin = await User.create({
      ...testAdmin,
      password: adminPassword,
    });
    console.log(`✅ Created admin: ${admin.email}`);

    // Create regular users
    console.log("👥 Creating test users...");
    const createdUsers = [];
    for (const userData of testUsers) {
      const password = await hashPassword(userData.password);
      const user = await User.create({
        ...userData,
        password,
        lastLoginAt: new Date(),
        loginCount: Math.floor(Math.random() * 10) + 1,
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Helper to generate username from name
    const generateUsername = (name) => {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      return `astro_${base}`;
    };

    // Create astrologers
    console.log("🔮 Creating astrologers...");
    const createdAstrologers = [];
    for (const astroData of testAstrologers) {
      const password = await hashPassword("Astro@123");

      // Create user account for astrologer
      const astroUser = await User.create({
        username: astroData.email.split("@")[0].replace(".", "_"),
        email: astroData.email,
        phoneNumber: astroData.phoneNumber,
        fullName: astroData.name,
        password,
        role: "astrologer",
        isProfileComplete: true,
        isActive: true,
      });

      // Create astrologer profile with generated username
      const astrologer = await AstrologerProfile.create({
        ...astroData,
        userId: astroUser._id,
        username: generateUsername(astroData.name),
        consultations: Math.floor(Math.random() * 500) + 100,
      });

      createdAstrologers.push(astrologer);
      console.log(`✅ Created astrologer: ${astrologer.name}`);
    }

    // Create bookings
    console.log("📅 Creating bookings...");
    const createdBookings = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 30; i++) {
      const user = getRandomElement(createdUsers);
      const astrologer = getRandomElement(createdAstrologers);
      const consultationType = getRandomElement(consultationTypes);
      const bookingDate = getRandomDate(thirtyDaysAgo, thirtyDaysLater);
      const bookingTime = getRandomTime24();

      // Determine status based on date
      let status;
      if (bookingDate < now) {
        status = getRandomElement(["completed", "cancelled"]);
      } else {
        status = getRandomElement(["pending", "confirmed"]);
      }

      const booking = await Booking.create({
        bookingId: generateBookingId(),
        userId: user._id,
        astrologerId: astrologer._id,
        astrologerName: astrologer.name,
        userName: user.fullName,
        userEmail: user.email,
        userPhone: user.phoneNumber,
        bookingDate,
        bookingTime,
        consultationType,
        duration: consultationType === "video_call" ? 45 : consultationType === "voice_call" ? 30 : 60,
        price: astrologer.price,
        status,
        problemStatement: getRandomElement(sampleProblemStatements),
        cancellation: status === "cancelled" ? {
          cancelledBy: Math.random() > 0.5 ? "user" : "astrologer",
          reason: "Schedule conflict",
          cancelledAt: new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000),
          refundAmount: Math.random() > 0.5 ? astrologer.price * 0.5 : 0,
        } : undefined,
      });

      createdBookings.push(booking);
      console.log(`✅ Created booking: ${booking.bookingId} (${status})`);
    }

    // Create payments for confirmed/completed bookings
    console.log("💳 Creating payments...");
    const confirmedBookings = createdBookings.filter(b => b.status === "confirmed" || b.status === "completed");

    for (const booking of confirmedBookings) {
      const paymentId = generatePaymentId();
      const isCaptured = booking.status === "completed";

      const payment = await Payment.create({
        paymentId,
        idempotencyKey: `booking:${booking._id}`,
        bookingId: booking._id,
        userId: booking.userId,
        userName: booking.userName,
        amount: booking.price,
        currency: "INR",
        status: isCaptured ? "captured" : "authorized",
        gateway: "razorpay",
        razorpayOrderId: `order_${Math.random().toString(36).substring(2, 15)}`,
        razorpayPaymentId: isCaptured ? `pay_${Math.random().toString(36).substring(2, 15)}` : undefined,
        razorpaySignature: isCaptured ? `sig_${Math.random().toString(36).substring(2, 15)}` : undefined,
        capturedAt: isCaptured ? new Date(booking.createdAt.getTime() + 60 * 60 * 1000) : undefined,
        receipt: booking.bookingId,
        notes: {
          bookingId: booking.bookingId,
          userId: booking.userId.toString(),
        },
      });
      console.log(`✅ Created payment: ${payment.paymentId} (${payment.status})`);
    }

    // Create reviews for completed bookings
    console.log("⭐ Creating reviews...");
    const completedBookings = createdBookings.filter(b => b.status === "completed");

    // Track which user-astrologer pairs we've already reviewed
    const reviewedPairs = new Set();
    let reviewsCreated = 0;

    for (const booking of completedBookings) {
      if (reviewsCreated >= 10) break;

      const pairKey = `${booking.userId.toString()}-${booking.astrologerId.toString()}`;
      if (reviewedPairs.has(pairKey)) continue;

      const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
      const comments = [
        "Excellent consultation! Very accurate predictions and practical remedies.",
        "Amazing experience. The astrologer was very knowledgeable and patient.",
        "Highly recommended. Got clarity on my career path.",
        "Very insightful reading. The remedies suggested are working well.",
        "Professional and accurate. Will definitely book again.",
        "Great guidance on relationship matters. Thank you!",
        "Detailed analysis with practical solutions. Very satisfied.",
        "The astrologer explained everything clearly. Worth every penny.",
      ];

      try {
        await AstrologerReview.create({
          astrologerId: booking.astrologerId,
          userId: booking.userId,
          rating,
          comment: getRandomElement(comments),
        });
        reviewedPairs.add(pairKey);
        reviewsCreated++;
        console.log(`✅ Created review for booking: ${booking.bookingId} (${rating} stars)`);
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key - already reviewed this pair
          reviewedPairs.add(pairKey);
          continue;
        }
        throw err;
      }
    }

    // Update astrologer stats
    console.log("📊 Updating astrologer stats...");
    for (const astrologer of createdAstrologers) {
      const reviews = await AstrologerReview.find({ astrologerId: astrologer._id });
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      await AstrologerProfile.findByIdAndUpdate(astrologer._id, {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        consultations: Math.floor(Math.random() * 500) + 100,
      });
    }
    console.log("✅ Updated astrologer stats");

    // Print summary
    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   • Admin users: 1`);
    console.log(`   • Regular users: ${createdUsers.length}`);
    console.log(`   • Astrologers: ${createdAstrologers.length}`);
    console.log(`   • Bookings: ${createdBookings.length}`);
    console.log(`   • Payments: ${confirmedBookings.length}`);
    console.log(`   • Reviews: ${completedBookings.slice(0, 10).length}`);

    console.log("\n🔑 Test Credentials:");
    console.log("   Admin: admin@astrology.com / Admin@123");
    console.log("   Users: john.doe@example.com / Test@123");
    console.log("          jane.smith@example.com / Test@123");
    console.log("          mike.wilson@example.com / Test@123");
    console.log("   Astrologers: rajesh.sharma@astrology.com / Astro@123");
    console.log("                priya.patel@astrology.com / Astro@123");
    console.log("                (all astrologers use Astro@123)");

    console.log("\n🌐 You can now test the application at http://localhost:5173");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
}

// Run the seed
seedDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});