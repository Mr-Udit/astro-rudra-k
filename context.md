# Astro Rudra K - Engineering Context

Last verified: 2026-11-10

## 1. Project overview

Astro Rudra K is an astrology consultation marketplace. Users register/login with
username and email OTP, complete a profile, find astrologers, book consultations,
pay through Razorpay, and review completed consultations. Astrologers manage
availability and bookings. Admins manage users, astrologers, bookings, payments,
and monitoring.

`PROJECT_REPORT.md` reports approximately 72% completion. The report identifies
real-time consultation delivery (video, audio, and chat) as the major unfinished
product area. The report is a project status document and is not treated as proof
that every listed feature currently works.

## 2. Tech stack and versions

### Client

- React `^19.2.0`
- React DOM `^19.2.0`
- TypeScript `~5.9.3`
- Vite `^7.2.4`
- React Router DOM `^7.13.0`
- Axios `^1.13.5`
- TanStack React Query `^5.90.21`
- Zustand `^5.0.11`
- Tailwind CSS `^3.4.19`
- ESLint `^9.39.1`
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`

### Server

- Node.js ES modules
- Express `^4.18.2`
- Mongoose `^7.0.0`
- Redis client `^4.6.5`
- JSON Web Token `^9.0.0`
- Razorpay `^2.9.6`
- Cloudinary `^2.8.0`
- Nodemailer `^7.0.12`
- Resend `^6.7.0`
- Helmet `^8.1.0`
- Express Rate Limit `^7.5.1`
- ESLint `^10.0.2`
- Scripts: `npm start`, `npm run dev`, `npm test` (currently starts `index.js`)

## 3. Folder structure

### `client/src`

- `App.tsx`: router, providers, route protection
- `api/`: Axios API modules for auth, profiles, bookings, astrologers, and payments
- `components/`: layout, shadcn-style UI, and custom UI components
- `context/`: authentication and booking context
- `hooks/`: reusable hooks
- `lib/`: Axios clients, query configuration, utilities
- `pages/`: public pages, booking/payment flow, dashboards, consultation, Kundli
- `stores/`: Zustand stores
- `styles/`: client styling
- `types/`: shared frontend TypeScript types

### `server`

- `index.js`: Express startup, middleware, routes, jobs, health endpoint
- `config/`: MongoDB and Redis clients
- `controllers/`: HTTP handlers
- `middleware/`: auth, CSRF, rate limiting, security, validation, performance
- `models/`: User, Booking, Astrologer, Payment, OTP, blacklist models
- `monitoring/`: Prometheus metrics
- `routes/`: Express route modules
- `services/`: booking, OTP, cache, Razorpay, expiry, email services
- `utils/`: errors, logging, token, environment, pagination, time utilities
- `validators/`: Joi request schemas
- `public/`: server-served static assets

## 4. Environment

Environment variable names verified from source:

`NODE_ENV`, `PORT`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`, `MONGO_URI`,
`DB_MAX_POOL_SIZE`, `DB_MIN_POOL_SIZE`, `JWT_SECRET`, `JWT_EXPIRY`,
`JWT_PROFILE_EXPIRY`, `OTP_TTL_SECONDS`, `OTP_HASH_SECRET`, `RATE_LIMIT_MAX_ATTEMPTS`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`,
`RESEND_API_KEY`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `RAZORPAY_KEY_ID`,
`RAZORPAY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `REDIS_URL`, `BOOKING_EXPIRY_MINUTES`,
`LOG_LEVEL`, `DEBUG`, `API_BASE_URL`, `AUTH_COOKIE`, `ASTROLOGER_PROFILE_ID`,
`BOOKING_ID`, `LIST_CONN`, `LIST_DURATION`, `LIST_PIPELINE`, `BOOKING_DATE`,
`BOOKING_TIME`, `CONSULTATION_TYPE`, `BOOKINGS_CONN`, `BOOKINGS_DURATION`,
`BOOKINGS_PIPELINE`, `PAY_CONN`, `PAY_DURATION`, and `PAY_PIPELINE`.

Client variables verified from source:
`VITE_API_URL`, `VITE_DEFAULT_PROFILE_IMAGE_URL`, `VITE_CLOUDINARY_UPLOAD_BASE`,
`VITE_KUNDLI_APP_URL`, and `VITE_RAZORPAY_CHECKOUT_URL`.

Run from separate directories:

- Client: `cd client; npm run dev`
- Server: `cd server; npm run dev` or `npm start`
- Client build: `cd client; npm run build`
- Client lint: `cd client; npm run lint`
- Server lint: `cd server; npx eslint .`
- Server syntax check: `node --check <file>`

The server defaults to port `4000`; the client Vite default is used unless
configured by Vite.

## 5. Architecture

The client uses React Router and Axios with `withCredentials: true`. The server
loads dotenv, validates the environment, configures CORS/security/body parsing,
then mounts `/auth`, `/profile`, `/astrologers`, `/bookings`, `/api/cloudinary`,
`/admin`, and `/payment`.

Authentication uses username + OTP. Registration creates a `User` and issues a
short-lived profile JWT. Login verifies an OTP and issues an auth JWT. JWTs are
stored in HTTP-only cookies by the token utility. The auth middleware validates
the JWT, checks the blacklist, loads the account, and sets:

```js
req.user = { id, role, type, fullName?, email?, phoneNumber?, username? }
```

`authRequired` currently accepts one object:

```js
authRequired({ allowedRoles = [], allowedTokenTypes = ["auth", "profile"] })
```

Several routes currently pass arrays instead of this object; this is an open
verified security bug being handled in S1.

Redis is used for astrologer list/availability caching and booking slot locks.
Razorpay order creation, signature verification, and webhook handling are in the
payment controller/services. Cloudinary uses a server-generated signature, then
the client uploads directly to Cloudinary.

## 6. Roles and permissions

- **User**: public discovery; authenticated profile, booking, payment verification,
  favorites, and reviews; user dashboard.
- **Astrologer**: authenticated astrologer profile availability, consultations,
  status updates, earnings, and astrologer dashboard.
- **Admin**: authenticated admin management routes, monitoring, payments,
  revenue, user management, and astrologer management.

These are intended permissions. Current route middleware mismatches mean some
server role checks are not currently enforced until S1 is fixed.

## 7. API map

| Method | Path | Middleware | Controller |
|---|---|---|---|
| POST | `/auth/register` | authLimiter, otpVerifyLimiter | register |
| POST | `/auth/login` | authLimiter, otpVerifyLimiter | login |
| GET | `/auth/test-login` | authLimiter | inline test handler |
| GET | `/auth/verify` | apiLimiter, authOptional | verifySession |
| POST | `/auth/logout` | authRequired (intended auth/profile) | logout |
| POST | `/auth/check-username` | apiLimiter | checkUsernameAvailability |
| GET | `/profile/get` | authRequired, apiLimiter | getProfile |
| PATCH | `/profile/update` | authRequired, apiLimiter | updateProfile |
| GET | `/profile/favorites` | authRequired, apiLimiter | getFavorites |
| POST | `/profile/favorites/:astrologerId` | authRequired, apiLimiter | toggleFavorite |
| POST | `/profile/favorites/:astrologerId/add` | authRequired, apiLimiter | addFavorite |
| DELETE | `/profile/favorites/:astrologerId` | authRequired, apiLimiter | removeFavorite |
| GET | `/profile/earnings/summary` | authRequired, apiLimiter | getAstrologerEarningsSummary |
| GET | `/astrologers/list` | apiLimiter | listAstrologersHandler |
| GET | `/astrologers/specializations` | apiLimiter | getSpecializationsHandler |
| GET | `/astrologers/featured-testimonials` | apiLimiter | getFeaturedTestimonials |
| GET | `/astrologers/:id` | apiLimiter | getAstrologerByIdController |
| GET | `/astrologers/:id/availability` | apiLimiter | getAstrologerAvailabilityController |
| GET | `/astrologers/:id/reviews` | apiLimiter | listAstrologerReviews |
| PATCH | `/astrologers/:id/availability` | authRequired astrologer, apiLimiter | updateAstrologerAvailabilityController |
| POST | `/astrologers/:id/reviews` | authRequired user, apiLimiter | createAstrologerReview |
| POST | `/bookings/create` | authRequired, apiLimiter | createBookingHandler |
| PATCH | `/bookings/:id/cancel` | authRequired user, apiLimiter | cancelBookingHandler |
| PATCH | `/bookings/:id/reschedule` | authRequired user, apiLimiter | rescheduleBookingHandler |
| PATCH | `/bookings/:id/status` | authRequired user/astrologer/admin, apiLimiter | updateBookingStatusController |
| GET | `/bookings/my-bookings` | authRequired, apiLimiter | myBookings |
| GET | `/bookings/astrologer/my-consultations` | authRequired, apiLimiter | astrologerUpcomingBookings |
| GET | `/bookings/astrologer/:astrologerProfileId/upcoming` | authRequired astrologer, apiLimiter | astrologerUpcomingBookings |
| GET | `/bookings/astrologer/:astrologerProfileId/history` | authRequired astrologer, apiLimiter | astrologerBookingHistory |
| GET | `/bookings/:id` | authRequired user/astrologer/admin, apiLimiter | getBooking |
| POST | `/payment/create-order` | authRequired user/admin/astrologer | createOrder |
| POST | `/payment/verify` | authRequired user | verifyPayment |
| POST | `/payment/webhook` | none; signature checked in controller | razorpayWebhook |
| GET | `/api/cloudinary/signature` | authRequired, apiLimiter | getUploadSignature |
| POST | `/admin/astrologer/create` | adminAuth, apiLimiter, validation | createAstrologerHandler |
| PATCH | `/admin/astrologer/:id/status` | adminAuth, apiLimiter | setVerificationAstrologerHandler |
| DELETE | `/admin/astrologer/:id` | adminAuth, apiLimiter | adminDeleteAstrologer |
| GET | `/admin/list-all-bookings` | adminAuth, apiLimiter | adminBookings |
| POST | `/admin/user/create` | adminAuth, apiLimiter | adminCreateUser |
| GET | `/admin/users` | adminAuth, apiLimiter | adminListUsers |
| GET | `/admin/users/:id` | adminAuth, apiLimiter | adminGetUserById |
| PATCH | `/admin/users/:id/status` | adminAuth, apiLimiter | adminSetUserActiveStatus |
| DELETE | `/admin/users/:id` | adminAuth, apiLimiter | adminDeleteUser |
| GET | `/admin/astrologers` | adminAuth, apiLimiter | adminListAstrologers |
| GET | `/admin/monitoring/summary` | adminAuth, apiLimiter | adminMonitoringSummary |
| GET | `/admin/payments` | adminAuth, apiLimiter | adminGetPayments |
| GET | `/admin/revenue/chart` | adminAuth, apiLimiter | adminRevenueChart |

## 8. Frontend map

| Path | Page | Protection | Roles |
|---|---|---|---|
| `/` | LandingPage | public | any |
| `/login` | LoginPage | public | any |
| `/signup` | SignupPage | public | any |
| `/astrologers` | AstrologersPage | public | any |
| `/services` | ServicesPage | public | any |
| `/contact` | ContactPage | public | any |
| `/kundli` | KundliGeneratorPage | public | any |
| `/consultation/:id` | ConsultationPage | page checks auth | intended booking participant/admin |
| `/complete-profile` | CompleteProfilePage | ProtectedRoute, profile incomplete allowed | authenticated |
| `/booking` | BookingPage | public entry; login required to continue | any/user flow |
| `/booking/details` | BookingDetailsPage | ProtectedRoute | authenticated |
| `/booking/payment` | PaymentPage | ProtectedRoute | authenticated |
| `/user/dashboard` | UserDashboard | ProtectedRoute | user |
| `/astrologer/dashboard` | AstrologerDashboard | ProtectedRoute | astrologer |
| `/admin/dashboard` | AdminDashboard | ProtectedRoute | admin |
| `/checkout` | CheckoutPage | currently unprotected | UNVERIFIED; commented code suggests admin |
| `*` | LandingPage | public fallback | any |

## 9. Data models

Verified Mongoose models: `User`, `Booking`, `AstrologerProfile`,
`AstrologerReview`, `Payment`, `Otp`, and `BlacklistedToken`.

`Booking` uses `_id`, `bookingId`, `userId`, `astrologerId`, snapshots
(`astrologerName`, `userName`, `userEmail`, `userPhone`), `bookingDate`,
`bookingTime`, `duration`, `price`, `consultationType`, `status`, cancellation
metadata, and timestamps.

`User` uses `_id`, `username`, `fullName`, `email`, `phoneNumber`, `role`,
`isProfileComplete`, `isActive`, profile fields, favorites, and timestamps.

The client `Booking` type also declares `id`, `bookingId`, `userId`,
`astrologerProfileId`, `durationMinutes`, `amount`, and snapshot fields. This
does not exactly match the server model/controller, which returns `id`,
`userId`, `astrologerId`, `duration`, and `price`. The mismatch is relevant to F2.

## 10. Known issues

| ID | Status | Location | Notes |
|---|---|---|---|
| S1 | FIXED | `server/middleware/authMiddleware.js:68`; `server/routes/*.js` | Converted every array-shaped `authRequired` call to the existing options object. Admin, astrologer, user booking, and token-type restrictions are now explicit. |
| S2 | FIXED | `server/controllers/authController.js:85,262` | OTP is included only when `NODE_ENV !== "production"` so the existing development toast remains supported; OTP console logging was removed. |
| S3 | FIXED | `server/routes/authRoutes.js` | Removed unused `/auth/test-login`; repo search found no callers, and the route contained the invalid `login(req, {})` response argument. |
| S4 | NEEDS DECISION | `client/src/App.tsx:134-140`; `client/src/pages/CheckoutPage.tsx` | Checkout is currently public, the only page text says to use the booking flow, and no client caller was found. The intended role (any authenticated user versus a specific role) is ambiguous; no protection was guessed. |
| B1/B2 | FIXED | `server/controllers/bookingController.js`; `server/middleware/validateController.js` | Replaced every verified `req.user.userId`/optional variant with `req.user.id`; booking service signatures already accept a user ID and callers remain unchanged. |
| F1 | FIXED | `client/src/pages/CompleteProfilePage.tsx:20` | Avatar file state is now `File | null`, while preview URL remains a separate string state. |
| F2 | FIXED | `client/src/pages/ConsultationPage.tsx:138`; `client/src/types/index.ts`; booking API aggregation | Typed the returned participant IDs and compare them to the authenticated account's `_id` after string normalization; admin access remains role-based. |
| F3 | FIXED | `client/src/pages/ConsultationPage.tsx:3` | Imported `CheckCircle` from the existing `lucide-react` dependency. |
| F4 | FIXED | `client/src/pages/KundliGeneratorPage.tsx:394` | Converted the `Object.entries` value to a safe string for React rendering. |
| X1 | NEEDS DECISION | `client/src/pages/ConsultationPage.tsx:84` | Fake `meet.example.com` demo URL. No provider may be invented. |
| X2 | NEEDS DECISION | `client/src/pages/ContactPage.tsx:32`; `server/routes` | No contact route or controller exists, so the form only simulates success. A backend endpoint or external contact destination must be specified before wiring. |
| Dead social URLs | NEEDS DECISION | `client/src/components/layout/Footer.tsx:48` | Buttons have no URLs. User must supply approved social links. |
| Dead astrologer buttons | SKIPPED | `client/src/pages/AstrologerDashboard.tsx:600,616,632` | Confirmed buttons have no handlers and no matching earnings/details or astrologer profile-edit route/page exists. Report-only per scope; no route invented. |
| User Edit Profile | NOT REPRODUCED | `client/src/pages/UserDashboard.tsx:523` | Button navigates to existing protected `/complete-profile`, which is the intended profile completion/edit flow. |
| Legal links | SKIPPED | `client/src/components/layout/Footer.tsx:22-24`; `client/src/App.tsx` | Confirmed no privacy/terms/refund components or routes exist. Report-only; no legal text invented. |
| Lint debt | OPEN | `client/`; `server/` | Final lint runs remain non-zero. Client: 94 errors and 2 warnings; server: 319 errors. Grouped counts are recorded below. Only lint errors in files already touched by this audit were corrected. |

### Remaining lint debt

Client (`npm run lint`): 94 errors, 2 warnings.

| Rule | Count |
|---|---:|
| `@typescript-eslint/no-explicit-any` | 56 |
| `@typescript-eslint/no-unused-vars` | 18 |
| `prefer-const` | 2 |
| `@typescript-eslint/no-empty-object-type` | 2 |
| `no-empty` | 1 |

Server (`npx eslint .`): 319 errors.

| Rule | Count |
|---|---:|
| `no-undef` | 107 |
| `no-unused-vars` | 96 |
| `no-prototype-builtins` | 41 |
| `no-cond-assign` | 20 |
| `no-fallthrough` | 17 |
| `no-empty` | 15 |
| `no-useless-assignment` | 5 |
| `no-constant-condition` | 4 |
| `no-redeclare` | 3 |
| `no-case-declarations` | 2 |
| `no-control-regex` | 2 |
| `valid-typeof` | 2 |
| `no-unused-private-class-members` | 1 |
| `getter-return` | 1 |
| `no-misleading-character-class` | 1 |
| `no-unreachable` | 1 |
| `no-useless-escape` | 1 |

## 11. Change log

| Date | File | Change | Why | Verification |
|---|---|---|---|---|
| 2026-11-10 | `context.md` | Created verified project context and issue register | Required before code changes | Source/package/report inspection completed |
| 2026-11-10 | `server/routes/authRoutes.js`, `astrologersRoutes.js`, `cloudinaryRoutes.js`, `adminRoutes.js`, `bookingRoutes.js` | Converted all legacy array-shaped `authRequired` calls to options objects with explicit token types and roles | S1 role checks were being ignored by the existing middleware signature | `rg "authRequired\\(\\["` returned no matches; `node --check` passed for all five files |
| 2026-11-10 | `server/controllers/authController.js` | Gated both OTP response fields to non-production and removed OTP logging | S2 required development OTP visibility without production exposure | `node --check controllers\\authController.js` passed; no OTP logging remains |
| 2026-11-10 | `server/routes/authRoutes.js` | Removed unused `/auth/test-login` route | S3 route called `login` with `{}` as `res` and had no callers | `rg "test-login|login\\(req,\\s*\\{\\}\\)"` returned no matches; `node --check routes\\authRoutes.js` passed |
| 2026-11-10 | `server/controllers/bookingController.js`, `server/middleware/validateController.js` | Replaced stale `req.user.userId` references with `req.user.id` | Auth middleware sets `req.user.id`; booking cancellation, lookup, error logging, and validation were otherwise using an absent property | `rg "req\\.user\\.userId|req\\.user\\?\\.userId"` returned no matches; `node --check` passed for both files |
| 2026-11-10 | `client/src/pages/CompleteProfilePage.tsx` | Separated selected avatar `File` state from preview URL state | F1 assigned a `File` to string state and passed the string to the upload function | `npx tsc --noEmit` passed in `client` |
| 2026-11-10 | `client/src/pages/ConsultationPage.tsx` | Added participant ID fields, corrected access checks to use auth `_id`, and imported `CheckCircle` | F2 compared mismatched client fields to the booking aggregation and F3 had a missing icon import | `npx tsc --noEmit` passed in `client` |
| 2026-11-10 | `client/src/pages/KundliGeneratorPage.tsx` | Rendered planetary position values via `String` | F4 reported `Object.entries` values as `unknown` React children | `npm run build` passed in `client` |
| 2026-11-10 | `client/src/components/layout/Footer.tsx` | Replaced `Icon.name` React keys with explicit stable social keys | Social icon component names are not a reliable unique key | `npm run build` passed in `client` |
| 2026-11-10 | `client/src/pages/CompleteProfilePage.tsx`, `ConsultationPage.tsx`, `KundliGeneratorPage.tsx`, `server/controllers/authController.js`, `server/routes/adminRoutes.js`, `server/routes/authRoutes.js` | Corrected lint errors in files already touched by the audit: typed unknown catches, removed unused imports/variables, and replaced the remaining local `any` types | Phase 6 permits fixes only in files already modified for this audit | Client build passed; final lint counts recorded above |
| 2026-11-10 | `context.md` | Recorded final client/server lint totals and grouped rule counts | Complete the required audit report and preserve the remaining lint debt | `npm run lint` and `npx eslint .` completed; both remain non-zero |

## 12. Conventions and gotchas

- Server uses ES modules and `.js` import extensions.
- Server API responses generally use `{ ok, message, data }`; structured errors
  may use `{ ok, error: { code, message } }`.
- Authentication identity is `req.user.id`, not `req.user.userId`.
- Booking model uses `astrologerId`; the client type currently also uses
  `astrologerProfileId`.
- Mongo identifiers commonly appear as `_id`; controllers may map them to `id`.
- `authRequired` must be called with an options object.
- Do not expose `.env` values in notes, logs, commits, or reports.
- Existing working-tree changes must not be reverted unless explicitly requested.

## 13. Open decisions and next steps

- Choose a real consultation provider for X1 (for example Daily, Agora,
  Twilio, Jitsi, or an approved WebRTC implementation) before implementation.
- Provide approved Facebook, Twitter/X, Instagram, and YouTube URLs before wiring
  footer social buttons.
- Determine whether `/checkout` is admin-only or available to any authenticated
  user after reviewing its callers and intended product flow.
- Resolve the listed product decisions before implementing checkout protection,
  consultation video, contact submission, social URLs, or legal pages.
- Address remaining lint debt separately; it was not broadly refactored under this audit's scope.
