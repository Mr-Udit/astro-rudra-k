# Feature Status

Last verified: 2026-11-10 on `feat/jitsi-jaas-consultations`.

| ID | Area | Feature | Status | Evidence | Test status |
|---|---|---|---|---|---|
| C1 | Consultation | JaaS audio, video, and built-in chat room join | IMPLEMENTED | `server/routes/bookingRoutes.js`, `server/controllers/bookingController.js`, `server/services/jaasService.js`, `client/src/pages/ConsultationPage.tsx` | Static checks and build pending; live JaaS credentials and multi-user runtime test not performed |

The server authorizes the booking participant, requires `confirmed` status and
a captured payment, enforces a ten-minute pre-start window plus five-minute
grace period, and issues a short-lived participant-specific RS256 JWT. Automatic
completion after a participant leaves remains a product decision and is not
implemented.
