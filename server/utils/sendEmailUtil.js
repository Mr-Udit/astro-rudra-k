import nodemailer from "nodemailer";

/*
  HIGH-TRAFFIC EMAIL SERVICE

  Optimizations:
  - dotenv loaded once globally (NOT here)
  - no console logs per request
  - single transporter instance
  - pooled SMTP connections
  - zero runtime verification overhead
  - safe startup validation
*/

// ------------------------------------------------------------------
// ENV VALIDATION (FAIL FAST AT BOOT)
// ------------------------------------------------------------------

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "465",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE = "true"
} = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  throw new Error(
    "SMTP_USER and SMTP_PASS must be defined in environment variables"
  );
}

// ------------------------------------------------------------------
// SMTP TRANSPORTER — CONNECTION POOLING ENABLED
// ------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  pool: true,              // critical for high traffic
  maxConnections: 5,       // tune based on server size
  maxMessages: 100,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// ------------------------------------------------------------------
// PRECOMPILED EMAIL TEMPLATES
// ------------------------------------------------------------------

const htmlTemplate = otp => `
<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
  <h2>AstroRudra-K Login Verification</h2>
  <p>Your one-time password is:</p>
  <h1 style="letter-spacing:4px">${otp}</h1>
  <p>This code will expire shortly.</p>
  <p>Do not share this code with anyone.</p>
</div>
`;

const textTemplate = otp =>
`AstroRudra-K Login OTP

Your OTP is: ${otp}

Do not share this code with anyone.
`;

// ------------------------------------------------------------------
// SEND OTP EMAIL (NON-BLOCKING SAFE)
// ------------------------------------------------------------------

export async function sendOtpEmail(service, email, otp) {
  const mailOptions = {
    from: `"AstroRudra-K Security" <${SMTP_USER}>`,
    to: email,
    subject: "Your AstroRudra-K Login OTP",
    text: textTemplate(otp),
    html: htmlTemplate(otp)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }

}

export async function sendRefundNotification(email, event, amount, bookingId) {
  const messages = {
    approved: ["Refund approved", "Your refund request has been approved and submitted to Razorpay."],
    rejected: ["Refund request rejected", "Your refund request was rejected by an administrator."],
    processed: ["Refund processed", "Your refund has been processed by Razorpay."],
    failed: ["Refund failed", "Your refund could not be processed and will be reviewed."],
  };
  const [subject, message] = messages[event] || messages.failed;
  const info = await transporter.sendMail({
    from: `"AstroRudra-K Support" <${SMTP_USER}>`,
    to: email,
    subject,
    text: `${message}\nBooking: ${bookingId}\nAmount: ₹${Number(amount || 0).toFixed(2)}`,
  });
  return { success: true, messageId: info.messageId };
}
