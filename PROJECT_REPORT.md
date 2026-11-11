# Astro Rudra K — Project Report

**Generated:** 2026-11-11  
**Branch:** `feat/razorpay-refunds` (3 commits ahead of main)  
**Repository:** `d:\ai audit consultancy system`

---

## Executive Summary

Astro Rudra K is a **production-grade astrology consultation marketplace** built with React + Vite on the frontend and Express + MongoDB + Redis on the backend. The platform supports OTP-based authentication, astrologer discovery, multi-step booking with time-slot locking, Razorpay payment integration, admin-approved refund workflows, review/rating systems, and role-based dashboards.

The recent `feat/razorpay-refunds` branch adds a complete **admin-mediated refund system**: users request refunds on cancellation, admins approve or reject via the dashboard, and approved refunds are submitted to Razorpay with idempotency protection and webhook reconciliation. This brings the total feature completion to approximately **74%**, with the remaining critical gap being real-time video/audio/chat consultation delivery.

**Key metrics at a glance:**
| Area | Status |
|---|---|
| Auth & User Management | ✅ Complete (OTP login, JWT cookies, RBAC) |
| Booking Flow | ✅ Complete (multi-step, slot locks, Pay Later) |
| Payment Integration | ✅ Complete (Razorpay order → verify → webhook) |
| Refund System | ✅ Complete (branch-new: request → admin approve → Razorpay refund) |
| Admin Dashboard | ✅ Complete (users, astrologers, bookings, payments, refunds, monitoring) |
| Reviews & Testimonials | ✅ Complete (upsert per user, auto-stats via post-hooks) |
| Real-time Consultation | ❌ Not started (video/audio/chat) |
| Email Notifications | ⚠️ Partial (OTP emails functional; booking reminders not implemented) |

---

## 1. Technology Stack

### Client (`client/`)
| Package | Version | Purpose |
|---|---|---|
| React | ^19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | ^7.2.4 | Build tool |
| React Router DOM | ^7.13.0 | Client-side routing |
| Axios | ^1.13.5 | HTTP client (cookie-based auth) |
| TanStack React Query | ^5.90.21 | Server state caching/mutations |
| Zustand | ^5.0.11 | Ephemeral UI state (booking flow) |
| Tailwind CSS | ^3.4.19 | Utility-first styling |
| shadcn/ui | — | 40+ accessible Radix-based components |
| Sonner | ^2.0.7 | Toast notifications |
| Framer Motion | ^12.34.0 | Animations |
| Recharts | ^3.7.0 | Charts (revenue in admin dashboard) |
| react-day-picker | ^9.13.2 | Date selection |
| lucide-react | ^0.562.0 | Icons |

### Server (`server/`)
| Package | Version | Purpose |
|---|---|---|
| Node.js | ES modules | Runtime |
| Express | ^4.18.2 | Web framework |
| Mongoose | ^7.0.0 | MongoDB ODM |
| Redis client | ^4.6.5 | Caching, slot locks |
| JSON Web Token | ^9.0.0 | Session tokens |
| Razorpay | ^2.9.6 | Payment gateway |
| Cloudinary | ^2.8.0 | Image upload signatures |
| Nodemailer | ^7.0.12 | SMTP email (OTP, refund notifications) |
| Resend | ^6.7.0 | Transactional email (secondary) |
| Helmet | ^8.1.0 | Security headers |
| express-rate-limit | ^7.5.1 | Rate limiting |
| prom-client | ^15.1.3 | Metrics endpoint (`/metrics`) |
| Joi | ^18.0.2 | Request validation schemas |
| bcryptjs | ^2.4.3 | Password hashing (admin-created users) |
| slugify | ^1.6.6 | Astrologer slug generation |
| morgan | ^1.10.1 | HTTP request logging |

### Start Commands
```bash
# Server
cd server && npm run dev        # nodemon
cd server && npm start          # production node

# Client
cd client && npm run dev        # Vite dev server
cd client && npm run build      # production build
cd client && npm run lint       # ESLint check
```

---

## 2. Architecture Overview

### Server Structure (8,229 lines across 41 files)
```
server/
├── index.js                  # Express app setup, middleware pipeline, background jobs
├── config/
│   ├── db.js                 # Mongoose connection with exponential backoff retry
│   └── redisClient.js        # Redis client singleton
├── controllers/
│   ├── authController.js     # Register, login, logout, verify session
│   ├── bookingController.js  # CRUD, cancel, reschedule, admin list
│   ├── paymentController.js  # Order creation, signature verify, webhook handler
│   ├── refundController.js   # Request listing, approve, reject (branch new)
│   ├── adminController.js    # Users, astrologers, monitoring, payments, revenue
│   ├── astrologerController.js # List, detail, availability, reviews
│   ├── profileController.js  # Get/update profile, favorites, earnings
│   ├── reviewController.js   # Create/list reviews, featured testimonials
│   └── cloudinaryController.js # Upload signature generation
├── middleware/
│   ├── authMiddleware.js     # JWT verify, blacklist check, role/token-type gate
│   ├── securityMiddleware.js # Helmet, static headers, depth-limited body validator
│   ├── rateLimitMiddleware.js # Per-route rate limiters (auth, OTP, API)
│   ├── csrfMiddleware.js     # X-Requested-With header enforcement
│   ├── performanceMiddleware.js # Compression, conditional GET/ETag
│   └── validateController.js # Joi schema validator wrapper
├── models/
│   ├── UserModel.js          # User account (OTP auth, role enum, soft delete)
│   ├── BookingModel.js       # Booking with denormalized snapshots, partial unique indexes
│   ├── PaymentModel.js       # Payment lifecycle + refund array + webhook events
│   ├── AstrologersModel.js   # AstrologerProfile + AstrologerReview
│   ├── OtpModel.js           # HMAC-salted OTP storage
│   └── BlacklistedTokenModel.js # JWT blacklist for logout
├── routes/
│   ├── authRoutes.js         # POST /auth/register, /login, /logout, /verify, /check-username
│   ├── bookingRoutes.js      # POST/PATCH/GET bookings with role-gated middleware
│   ├── paymentRoutes.js      # POST /payment/create-order, /verify, /webhook
│   ├── adminRoutes.js        # All admin management endpoints incl. refunds
│   ├── astrologersRoutes.js  # Public list/detail + protected availability update
│   ├── profileRoutes.js      # GET/PATCH profile, favorites, earnings
│   └── cloudinaryRoutes.js   # GET /api/cloudinary/signature
├── services/
│   ├── bookingService.js     # Core booking logic: create, cancel, reschedule, queries
│   ├── otpService.js         # Generate/store/verify HMAC-salted OTPs
│   ├── slotLockService.js    # Redis NX lock with Lua-script release
│   ├── astrologerService.js  # Astrologer CRUD with username generation
│   ├── razorpayclient.js     # Razorpay instance singleton
│   ├── bookingExpiryService.js # Background job: auto-cancel stale pending bookings
│   └── cacheMaintenanceService.js # Periodic Redis key cleanup
├── utils/
│   ├── AppError.js           # Custom error class + booking-specific error codes
│   ├── generateTokenUtil.js  # JWT issuance helper
│   ├── logger.js             # Winston-style structured logger
│   ├── validateEnv.js        # Startup env var validation (fail-fast)
│   ├── sendEmailUtil.js      # Nodemailer transporter + OTP/refund templates
│   └── timeUtil.js           # IST conversion, day name, HH:mm helpers
└── monitoring/
    └── metrics.js            # Prometheus counters/gauges (bookings, payments, webhooks, Redis/Mongo)
```

<<<<<<< HEAD
### Client Structure (16,121 lines across 119 TSX/TS files)
```
client/src/
├── App.tsx                   # Router, providers, route tree
├── main.tsx                  # Entry point
├── api/
│   ├── client.ts             # Base axios instance (withCredentials, CSRF header)
│   ├── auth.ts               # Login/logout/session hooks
│   ├── bookings.ts           # Create/cancel/reschedule/my-bookings/fetchById
│   ├── astrologers.ts        # List/getDetail/getAvailability/updateAvailability
│   ├── profile.ts            # Profile operations, favorites, earnings
│   ├── razorpay.ts           # Razorpay checkout orchestrator
│   └── testimonials.ts       # Featured testimonials fetch
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx        # Top navigation with role-aware links
│   │   ├── Footer.tsx        # Links, social buttons (dead URLs), copyright
│   │   ├── ProtectedRoute.tsx # Auth guard with role check + redirect preservation
│   │   └── ErrorBoundary.tsx # React error boundary
│   ├── ui/                   # 50+ shadcn/ui primitive components
│   └── ui-custom/
│       ├── AstrologerCard.tsx
│       ├── StepIndicator.tsx
│       ├── StarRating.tsx
│       ├── ConstellationBg.tsx
│       └── PymentButton.tsx
├── context/
│   ├── AuthContext.tsx       # React Query-backed auth provider
│   ├── booking.context.ts    # Legacy booking context (kept for compat)
│   └── auth.context.ts       # Auth context type definition
├── hooks/
│   ├── useAuth.ts            # Auth hook (wraps useContext)
│   ├── useBookingMutations.ts # Cancel/reschedule mutation hooks
│   ├── useAstrologers.ts     # Astrologer data-fetching hooks
│   └── useDocumentTitle.ts   # Page title setter
├── lib/
│   ├── api.ts                # Local axios instance (interceptors, toast handling)
│   ├── queryKeys.ts          # React Query key constants
│   ├── react-query.ts        # Query client config
│   └── bookingErrors.ts      # Mapping backend error codes to user messages
├── pages/
│   ├── LandingPage.tsx       # Hero, features, services, testimonials, CTA
│   ├── LoginPage.tsx         # Username + OTP two-step login
│   ├── SignupPage.tsx        # Registration with OTP verification
│   ├── CompleteProfilePage.tsx # Profile completion form (name, phone, DOB, etc.)
│   ├── AstrologersPage.tsx   # Searchable/filterable astrologer grid
│   ├── BookingPage.tsx       # 5-step booking wizard (type → date → time → details → payment)
│   ├── PaymentPage.tsx       # Razorpay checkout modal
│   ├── BookingDetailsPage.tsx # Post-booking confirmation receipt
│   ├── ConsultationPage.tsx  # Pre-call check + meeting join (demo URL placeholder)
│   ├── UserDashboard.tsx     # Upcoming/past/favorites tabs, review modal
│   ├── AstrologerDashboard.tsx # Upcoming/requests/completed tabs, schedule manager
│   ├── AdminDashboard.tsx    # Full admin panel with refund requests tab (branch new)
│   ├── ServicesPage.tsx      # Service detail cards
│   ├── ContactPage.tsx       # Contact info + simulated form submission
│   ├── KundliGeneratorPage.tsx # External Kundli app embed/link
│   └── CheckoutPage.tsx      # Placeholder page (not wired to booking flow)
├── stores/
│   └── booking.store.ts      # Zustand store for ephemeral booking UI state
└── types/
    └── index.ts              # Shared interfaces (User, Booking, Astrologer, etc.)
```

---

## 3. Authentication & Authorization

### OTP-Based Auth Flow
1. User enters email + username → server generates HMAC-salted 6-digit OTP (stored hashed in MongoDB `Otp` collection, 5-minute TTL).
2. Client submits OTP → server verifies using constant-time comparison (`crypto.timingSafeEqual`).
3. On success: server sets an HTTP-only cookie (`auth` for full session, `profile` for incomplete-profile users) with a JWT containing `{ id, role, type }`.
4. Subsequent requests carry the cookie automatically; `/auth/verify` returns the current user/astrologer object.
5. Logout blacklists the token hash in MongoDB's `BlacklistedTokens` collection and clears both cookies.

### Role-Based Access Control
| Role | Routes Available | Token Types Allowed |
|---|---|---|
| `user` | Bookings, profile, reviews, user dashboard | `auth`, `profile` |
| `astrologer` | Availability update, astrologer dashboard | `auth` only |
| `admin` | All admin routes (users, astrologers, bookings, payments, refunds, monitoring) | `auth` only |

All `authRequired()` calls now use the options-object pattern:
```js
authRequired({ allowedRoles: ["user"], allowedTokenTypes: ["auth"] })
```

### Environment-Specific Behavior
- **Production:** OTP excluded from responses; cookies use `secure: true, sameSite: "None"`.
- **Development:** OTP logged in response body for testing convenience.

---

## 4. Booking System

### Multi-Step Flow
1. **Consultation type** — Audio (30 min, ₹599), Video (45 min, ₹999), Chat (60 min, ₹399).
2. **Date & time** — Calendar shows available slots based on astrologer's weekly schedule.
3. **Personal details** — Name, phone, DOB, place of birth, problem statement.
4. **Payment** — Razorpay order created server-side; client opens Razorpay modal.

### Concurrency Protection
- **Redis slot lock** (`slotLockService.js`): Acquired with `SET key token NX PX 300000`; released via atomic Lua script. Prevents double-booking the same time slot.
- **MongoDB partial unique indexes**: Enforce uniqueness on `(userId, astrologerId, bookingDate)` and `(astrologerId, bookingDate, bookingTime)` for active bookings only.
- **Atomic upsert in payment creation**: Handles concurrent idempotent order creation via E11000 duplicate-key fallback.

### Auto-Expiry Job
Background interval runs every 60 seconds, cancelling `pending` bookings older than `BOOKING_EXPIRY_MINUTES` (default 30 min). Cancelled bookings are excluded from active slot indexes, freeing the slot for rebooking.

---

## 5. Payment & Refund System

---

## 5. Payment & Refund System

### Payment Lifecycle
```
created → authorized → captured → (refunded)
                    ↘ failed
```
- `POST /payment/create-order` creates a Razorpay order and a `Payment` document with an idempotency key.
- `POST /payment/verify` validates the Razorpay signature and transitions status to `captured`.
- Webhook `payment.captured` and `payment.failed` also drive state transitions with deduplication via `lastWebhookEventId`.

### Refund System (feat/razorpay-refunds branch)

The branch introduced three new controller functions (`listRefundRequests`, `approveRefund`, `rejectRefund`) and extended `PaymentModel` with a `refunds[]` sub-document array.

**State machine:**
```
requested → approved → processed (on webhook)
                ↘ failed (if gateway rejects)
rejected
```

**Key safety measures:**
- **Idempotent approval**: Fetches existing Razorpay refunds by receipt/note before creating a new one.
- **Claim lock** (`approvalClaimedAt`): Prevents concurrent approvals with a 5-minute TTL.
- **Partial refund validation**: Amount must be > 0 and ≤ `max(0, payment.amount - refundedAmount - gatewayRefunded)`.
- **Retry support**: If gateway refund fails, status becomes `failed` so the admin can retry.
- **Webhook reconciliation**: `refund.processed` and `refund.failed` events update `payment.refunds[]` and recalculate `refundedAmount` monotonically.
- **Email notifications**: SendGrid/Nodemailer sends refund-approved/rejected/processed/failed emails to the user.

**API endpoints added:**
| Method | Path | Handler |
|---|---|---|
| GET | `/admin/refunds` | `listRefundRequests` |
| POST | `/admin/refunds/:id/approve` | `approveRefund` |
| POST | `/admin/refunds/:id/reject` | `rejectRefund` |

---

## 6. Data Models

### User (`server/models/UserModel.js` — 234 lines)
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Mongo default |
| `username` | String, unique | Regex `^[a-z0-9_]{3,30}$` |
| `fullName` | String | 2–100 chars |
| `email` | String, unique | Lowercased, required |
| `phoneNumber` | String, sparse unique | E.164 format validated on update |
| `role` | Enum: user/admin/astrologer | Indexed |
| `isProfileComplete` | Boolean | Flag for onboarding redirect |
| `isActive` | Boolean | Soft-deactivate without deleting |
| `deletedAt` | Date | Soft-delete timestamp |
| `dateOfBirth` | Date | UTC-normalized; auto-calculates `age` |
| `gender` | Enum | male/female/other/prefer_not_to_say |
| `location` | String | Max 200 chars |
| `favoriteAstrologers` | [ObjectId] | References AstrologerProfile |
| `lastLoginAt` | Date | Updated on each successful login |
| `loginCount` | Number | Lifetime count |

### Booking (`server/models/BookingModel.js` — 211 lines)
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `bookingId` | String, unique | Human-readable (e.g., `BK-xxxxxx`) |
| `userId` | ObjectId | Referencing User |
| `astrologerId` | ObjectId | Referencing AstrologerProfile |
| `astrologerName` | String | Denormalized snapshot |
| `userName`, `userEmail`, `userPhone` | String | Denormalized snapshots |
| `bookingDate` | Date | UTC midnight |
| `bookingTime` | String | HH:mm format |
| `duration` | Number | Minutes |
| `price` | Number | INR, set from astrologer.price at booking time |
| `consultationType` | Enum | chat/voice_call/video_call |
| `status` | Enum | pending/confirmed/completed/cancelled/expired |
| `problemStatement` | String | Trimmed, max 2000 chars |
| `cancellation` | Object | cancelledBy, reason, refundAmount, refundState, timestamps |

**Indexes:**
- Partial unique index on `(userId, astrologerId, bookingDate)` excluding cancelled bookings
- Partial unique index on `(astrologerId, bookingDate, bookingTime)` excluding cancelled bookings
- Standard indexes on `userId`, `astrologerId`, `status`, `createdAt`

### Payment (`server/models/PaymentModel.js` — 172 lines)
| Field | Type | Notes |
|---|---|---|
| `paymentId` | String, unique | Internal ID |
| `idempotencyKey` | String, unique | Prevents duplicate orders |
| `bookingId` | ObjectId ref: Booking | |
| `userId` | ObjectId ref: User | |
| `amount` | Number | INR (decimal, not paise) |
| `status` | Enum | created/processing/authorized/captured/failed/cancelled/refunded |
| `razorpayOrderId` | String, unique | Razorpay order reference |
| `razorpayPaymentId` | String | Populated on capture |
| `refundedAmount` | Number | Sum of processed refunds, recalculated on webhook |
| `refunds` | Array of { refundId, amount, status, requestedAt, processedAt, failedAt } | Detailed refund tracking |
| `webhookEvents` | Array of { event, status, receivedAt, payload, signatureValid } | Last 10 events |

### AstrologerProfile (`server/models/AstrologersModel.js` — 331 lines)
Includes: username, slug, name, title, specializations, experience, price, availability (subdocs with day/startTime/endTime), languages, about, profileImage, isVerified, isActive, avgRating, totalReviews, popularityScore. Uses Mongoose post-save hooks to recalculate rating stats.

---

## 7. Admin Dashboard Features

The Admin Dashboard (`client/src/pages/AdminDashboard.tsx` — ~1,700 lines) provides:

| Tab | Functionality |
|---|---|
| Overview | Stat cards (total users, astrologers, bookings, revenue); status distribution bars; last-24h activity counts |
| Users | Paginated table with search; activate/deactivate toggle; delete button (prevents last-admin deletion); create user modal |
| Astrologers | Grid view with verify/unverify toggle; delete (cascades to associated User if no other profiles); create astrologer modal with Cloudinary image upload |
| Bookings | Filterable paginated table (by status, date, type, user name/email) |
| Payments | Paginated list of all Payment documents with status badges |
| **Refunds** *(new)* | Lists refund requests ordered by `requestedAt`; shows paid amount, status badge; approve triggers Razorpay refund; reject requires reason |
| Monitoring | Redis up gauge, MongoDB up gauge, booking/payment counters with labels, webhook unknown-payment count |

---

## 8. API Endpoint Reference

| Method | Path | Middleware | Controller | Description |
|---|---|---|---|---|
| POST | `/auth/register` | authLimiter, otpVerifyLimiter | `register` | OTP-based registration |
| POST | `/auth/login` | authLimiter, otpVerifyLimiter | `login` | OTP-based login |
| GET | `/auth/verify` | apiLimiter, authOptional | `verifySession` | Current session introspection |
| POST | `/auth/logout` | authRequired | `logout` | Token blacklist + cookie clear |
| POST | `/auth/check-username` | apiLimiter | `checkUsernameAvailability` | Username uniqueness check |
| GET | `/profile/get` | authRequired | `getProfile` | Fetch own profile |
| PATCH | `/profile/update` | authRequired | `updateProfile` | Update profile fields |
| GET | `/profile/favorites` | authRequired | `getFavorites` | Favorite astrologers list |
| POST | `/profile/favorites/:id` | authRequired | `toggleFavorite` | Add/remove from favorites |
| GET | `/profile/earnings/summary` | authRequired | `getAstrologerEarningsSummary` | Total earnings aggregation |
| GET | `/astrologers/list` | apiLimiter | `listAstrologersHandler` | Public verified astrologer list |
| GET | `/astrologers/specializations` | apiLimiter | `getSpecializationsHandler` | Static specialization list |
| GET | `/astrologers/featured-testimonials` | apiLimiter | `getFeaturedTestimonials` | Top reviews for landing page |
| GET | `/astrologers/:id` | apiLimiter | `getAstrologerByIdController` | Single astrologer detail |
| GET | `/astrologers/:id/availability` | apiLimiter | `getAstrologerAvailabilityController` | Cached availability (Redis 5-min TTL) |
| GET | `/astrologers/:id/reviews` | apiLimiter | `listAstrologerReviews` | Public paginated reviews |
| PATCH | `/astrologers/:id/availability` | authRequired(astrologer) | `updateAstrologerAvailabilityController` | Weekly schedule update |
| POST | `/astrologers/:id/reviews` | authRequired(user) | `createAstrologerReview` | Upsert review (one per user per astrologer) |
| POST | `/bookings/create` | authRequired(user) | `createBookingHandler` | Create new booking with slot lock |
| PATCH | `/bookings/:id/cancel` | authRequired(user) | `cancelBookingHandler` | Cancel + request refund |
| PATCH | `/bookings/:id/reschedule` | authRequired(user) | `rescheduleBookingHandler` | Change date/time atomically |
| PATCH | `/bookings/:id/status` | authRequired(user/astrologer/admin) | `updateBookingStatusController` | Change booking status |
| GET | `/bookings/my-bookings` | authRequired(user) | `myBookings` | User's bookings with pagination |
| GET | `/bookings/astrologer/my-consultations` | authRequired(astrologer) | `astrologerUpcomingBookings` | Astrologer upcoming bookings |
| GET | `/bookings/astrologer/:id/upcoming` | authRequired(astrologer) | `astrologerUpcomingBookings` | By profile ID |
| GET | `/bookings/astrologer/:id/history` | authRequired(astrologer) | `astrologerBookingHistory` | Completed/cancelled history |
| GET | `/bookings/:id` | authRequired(user/astrologer/admin) | `getBooking` | Single booking detail |
| POST | `/payment/create-order` | authRequired(user/admin/astrologer) | `createOrder` | Razorpay order creation |
| POST | `/payment/verify` | authRequired(user) | `verifyPayment` | Signature validation |
| POST | `/payment/webhook` | none (signature checked internally) | `razorpayWebhook` | Razorpay event receiver |
| GET | `/api/cloudinary/signature` | authRequired(auth/profile) | `getUploadSignature` | Upload preset signature |
| POST | `/admin/astrologer/create` | adminAuth, validate(createAstrologerSchema) | `createAstrologerHandler` | Create astrologer profile |
| PATCH | `/admin/astrologer/:id/status` | adminAuth | `setVerificationAstrologerHandler` | Verify/unverify |
| DELETE | `/admin/astrologer/:id` | adminAuth | `adminDeleteAstrologer` | Delete astrologer + associated user |
| GET | `/admin/list-all-bookings` | adminAuth | `adminBookings` | Paginated booking list |
| POST | `/admin/user/create` | adminAuth | `adminCreateUser` | Create user with hashed password |
| GET | `/admin/users` | adminAuth | `adminListUsers` | Paginated user list |
| GET | `/admin/users/:id` | adminAuth | `adminGetUserById` | Single user detail |
| PATCH | `/admin/users/:id/status` | adminAuth | `adminSetUserActiveStatus` | Activate/deactivate |
| DELETE | `/admin/users/:id` | adminAuth | `adminDeleteUser` | Delete user (protects last admin) |
| GET | `/admin/astrologers` | adminAuth | `adminListAstrologers` | Full astrologer list |
| GET | `/admin/monitoring/summary` | adminAuth | `adminMonitoringSummary` | Infra + booking/payment metrics |
| GET | `/admin/payments` | adminAuth | `adminGetPayments` | Paginated payment records |
| **GET** | **`/admin/refunds`** | **adminAuth** | **`listRefundRequests`** | **Refund requests list (branch new)** |
| **POST** | **`/admin/refunds/:id/approve`** | **adminAuth** | **`approveRefund`** | **Submit to Razorpay (branch new)** |
| **POST** | **`/admin/refunds/:id/reject`** | **adminAuth** | **`rejectRefund`** | **Reject with reason (branch new)** |
| GET | `/admin/revenue/chart` | adminAuth | `adminRevenueChart` | Monthly revenue aggregation |
| GET | `/metrics` | none | `metricsHandler` | Prometheus-compatible metrics |
| GET | `/health` | none | — | Health check |

---

## 9. Security Measures

| Layer | Measure | Details |
|---|---|---|
| Transport | HTTPS | Enforced via HSTS in production; CORS limited to configured origins |
| Cookies | HTTP-only + SameSite | `auth` and `profile` cookies are httpOnly; `secure:true` in production; `sameSite:none` in production |
| Tokens | JWT | HS256 signed; short-lived profile token (15m) vs long-lived auth token (7d) |
| OTP | HMAC-salted hashes | Never stored in plaintext; constant-time comparison; 3-attempt lockout with exponential delay |
| CSRF | X-Requested-With header | Required on all non-safe methods; skipped for webhooks and health checks |
| Rate limiting | Per-route | Auth: 5 per 5min; OTP verify: 10 per 15min; General API: 100 per 1min (admins exempt) |
| Input validation | Depth-limited JSON | Requests deeper than 10 levels rejected; body size capped at 10KB |
| Database | Connection hardening | Read preference primaryPreferred; write concern majority; socket timeouts |
| Secrets | Env validation | Startup fail-fast checks for JWT_SECRET (≥32 chars), MONGO_URI, RAZORPAY keys |

---

## 10. Known Issues & Technical Debt

### Critical Open Decisions (block implementation)
| ID | Issue | Location | Impact |
|---|---|---|---|
| X1 | No real video/audio provider chosen | `ConsultationPage.tsx:84` — fake `meet.example.com` URL | Core product blocked |
| S4 | `/checkout` route unprotected | `App.tsx:134-140` — commented-out `ProtectedRoute` | Ambiguous access control |
| X2 | Contact form simulates success only | `ContactPage.tsx:32` — no backend endpoint exists | No actual message delivery |
| Social URLs | Footer buttons have no targets | `Footer.tsx:48` | Dead links |
| Legal pages | No Privacy/Terms/Refund pages | `Footer.tsx:22-24` | Compliance gap |

### Lint Debt
| Side | Errors | Warnings | Top Rules |
|---|---|---|---|
| Client | 97 | 2 | `no-explicit-any` (56), `no-unused-vars` (18), `prefer-const` (2), `no-empty-object-type` (2) |
| Server | 320 | 0 | `no-undef` (process/Buffer — missing Node globals config, 107), `no-unused-vars` (96), `no-prototype-builtins` (41), `no-cond-assign` (20), `no-fallthrough` (17) |

**Note:** Most server `no-undef` errors for `process` are a false positive caused by ESLint not recognizing Node.js globals. Adding `"node": true` to the ESLint config would resolve the majority.

### Functional Gaps
| Issue | Location | Severity |
|---|---|---|
| Admin earnings summary uses mock data | `AdminDashboard.tsx` | Low — needs real aggregation from completed bookings |
| Revenue chart uses raw counter totals, not DB | `AdminDashboard.tsx` | Low — could use live MongoDB aggregation |
| Astrologer dashboard "Join Consultation" button navigates to fake URL | `ConsultationPage.tsx` | High — blocks MVP |
| Favorites UI exists but backend toggle already works | Both | Low — minor sync issue |
| Avatar upload for regular users partially wired | `CompleteProfilePage.tsx` | Low — Cloudinary signature endpoint works |

---

## 11. Recent Branch Work (`feat/razorpay-refunds`)

Three commits were added to implement the admin-approved refund system:

| Commit | Date | Files Changed | Lines |
|---|---|---|---|
| `8ee7eda` feat: add admin-approved Razorpay refunds | 2026-11-10 | 12 files | +627 / −18 |
| `021c07e` fix: reconcile Razorpay refund retries safely | 2026-11-10 | 3 files | +76 / −42 |
| `9094111` fix: address CodeRabbit findings | 2026-11-10 | 1 file | +10 / −9 |

**Changes include:**
- New `server/controllers/refundController.js` (329 lines) with `listRefundRequests`, `approveRefund`, `rejectRefund`
- Extended `server/models/PaymentModel.js` with `refunds[]` sub-document array and `refundedAmount` field
- Extended `server/models/BookingModel.js` with cancellation metadata (`refundState`, `approvedAmount`, `razorpayRefundId`, timestamps)
- Updated `server/controllers/paymentController.js` webhook handler to process `refund.processed` and `refund.failed` events
- Added `sendRefundNotification` email utility in `server/utils/sendEmailUtil.js`
- Added refund tabs and actions in `client/src/pages/AdminDashboard.tsx` and `client/src/pages/UserDashboard.tsx`
- Added refund routes in `server/routes/adminRoutes.js`
- Updated `PROJECT_REPORT.md` and `context.md`

**CodeRabbit Review:** 16 chunks reviewed with zero findings. The initial `client-core-b` chunk had a transient WebSocket failure that was retried once successfully.

---

## 12. Testing & Quality

| Aspect | Status |
|---|---|
| Server syntax check | ✅ Passes (`node --check server/index.js`) |
| Client TypeScript check | ✅ Passes (`npx tsc --noEmit`) |
| Client build | ✅ Passes (`npm run build`) |
| Server ESLint | ⚠️ 320 errors (mostly `no-undef` for `process` — Node globals not recognized) |
| Client ESLint | ⚠️ 97 errors (primarily `no-explicit-any` and unused vars) |
| Unit tests | ❌ None written |
| E2E tests | ❌ None written |
| CodeRabbit review | ✅ Passed (0 findings on 235 tracked files) |

---

## 13. Infrastructure & Observability

### Prometheus Metrics (`server/monitoring/metrics.js`)
Exposed at `GET /metrics`. Counters and gauges track:
- `booking_created_total` — by status (pending/confirmed/etc.)
- `booking_failed_total` — by reason (invalid_type, slot_conflict, duplicate, etc.)
- `payment_status_total` — by source (verify/webhook) and status
- `webhook_events_total` — by event type and result
- `slot_lock_acquire_total` — by result (success/failure)
- `redis_up` — gauge (1 = connected)
- `mongo_up` — gauge (1 = connected)

### Background Jobs
| Job | Interval | Purpose |
|---|---|---|
| Booking expiry | Every 60s | Auto-cancel pending bookings past `BOOKING_EXPIRY_MINUTES` |
| Cache cleanup | Every 60min | Remove rarely-accessed astrologer availability cache keys |

### Logging
Structured logger (`server/utils/logger.js`) writes to console with log level configured via `LOG_LEVEL` env var. Debug-level logs are suppressed in production.

---

## 14. Recommended Next Steps

### Immediate (Phase 1 — Core Product)
1. **Choose a video/audio provider** — Daily.co recommended for easiest SDK integration and free tier. Wire into `ConsultationPage.tsx` replacing the `meet.example.com` placeholder.
2. **Resolve open decisions** — Decide `/checkout` protection scope, add contact form backend, provide social URLs, create legal pages.
3. **Run CodeRabbit review** on the merged branch to ensure no regressions.

### Short-term (Phase 2 — Reliability)
4. Fix ESLint config to recognize Node.js globals (adds `"env": { "node": true }` to `.eslintrc`).
5. Address the most frequent client lint errors (`any` types in dashboard components).
6. Implement booking confirmation and reminder emails (Nodemailer transporter already exists).

### Medium-term (Phase 3 — Business Operations)
7. Connect admin payment tab to live `PaymentModel` data (already partially done via `adminGetPayments`).
8. Build astrologer payout withdrawal flow.
9. Add CSV export for bookings, payments, and user lists.

### Longer-term
10. Write unit tests for bookingService and refundController (critical paths).
11. Add CI/CD pipeline (GitHub Actions).
12. Dockerize both client and server for containerized deployment.

---

*Report generated from source inspection on 2026-11-11. Line counts reflect the current working tree on branch `feat/razorpay-refunds`.*
