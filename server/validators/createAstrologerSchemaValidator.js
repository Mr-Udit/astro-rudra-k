import Joi from "joi";

/*
  CREATE ASTROLOGER VALIDATION — HIGH TRAFFIC OPTIMIZED

  Improvements:
  - schema compiled once (module scope)
  - strict input normalization
  - defensive limits to prevent payload abuse
  - no dynamic validators per request
*/

export const createAstrologerSchema = Joi.object({
  /* =========================
     BASIC USER INFO
  ========================= */
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required(),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),

  phoneNumber: Joi.string()
    .pattern(/^[0-9+]+$/)
    .min(8)
    .max(15)
    .required(),

  /* =========================
     PROFILE IMAGE
  ========================= */
  // admin form may send simple URL string after uploading client‑side,
  // other parts of the app still send the full object, so we accept
  // either.  ultimately the service only needs a URL.
  profileImage: Joi.alternatives().try(
    Joi.string().uri(),
    Joi.object({
      url: Joi.string()
        .uri()
        .required(),

      public_id: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required()
    })
  ).required(),

  /* =========================
     SKILLS
  ========================= */
  skills: Joi.array()
    .items(
      Joi.string()
        .trim()
        .min(2)
        .max(50)
    )
    .min(1)
    .max(20)
    .required(),

  /* =========================
     EXPERIENCE
  ========================= */
  experienceYears: Joi.number()
    .integer()
    .min(0)
    .max(60)
    .required(),

  title: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .optional(),

  languages: Joi.array()
    .items(
      Joi.string()
        .trim()
        .min(2)
        .max(30)
    )
    .max(10)
    .optional(),

  experienceSummary: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  /* =========================
     AVAILABILITY
  ========================= */
  availability: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid(
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          )
          .required(),

        startTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),

        endTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required()
      }).required()
    )
    .min(1)
    .max(7)
    .required()
})
.options({
  abortEarly: false,
  stripUnknown: true
});
