import { logger } from "../utils/logger.js";

/**
 * Send a contact-form message via Nodemailer.
 * The message is forwarded to the platform support address configured
 * via SMTP_USER in the environment.
 */
export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        ok: false,
        message: "Name, email, subject, and message are required",
      });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (typeof subject !== "string" || subject.trim().length < 1) {
      return res.status(400).json({
        ok: false,
        message: "Subject is required",
      });
    }

    if (typeof message !== "string" || message.trim().length < 1) {
      return res.status(400).json({
        ok: false,
        message: "Message is required",
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim().slice(0, 2000);
    const trimmedPhone = phone ? String(phone).trim() : "";

    // Dynamically import Nodemailer to reuse the same transporter pattern
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlBody = `
<div style="font-family:Arial,max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#7c3aed">New Contact Message</h2>
  <p><strong>From:</strong> ${trimmedName} &lt;${trimmedEmail}&gt;</p>
  ${trimmedPhone ? `<p><strong>Phone:</strong> ${trimmedPhone}</p>` : ""}
  <p><strong>Subject:</strong> ${trimmedSubject}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <p>${trimmedMessage.replace(/\n/g, "<br>")}</p>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">Sent from AstroRudra-K contact form</p>
</div>
`;

    const textBody = `New Contact Form Submission

From: ${trimmedName} <${trimmedEmail}>
${trimmedPhone ? `Phone: ${trimmedPhone}\n` : ""}Subject: ${trimmedSubject}

Message:
${trimmedMessage}

---
Sent from AstroRudra-K contact form`;

    const info = await transport.sendMail({
      from: `"AstroRudra-K Contact" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      replyTo: trimmedEmail,
      subject: `[Contact] ${trimmedSubject}`,
      text: textBody,
      html: htmlBody,
    });

    logger.info("Contact form email sent", {
      messageId: info.messageId,
      from: trimmedEmail,
      subject: trimmedSubject,
    });

    return res.json({
      ok: true,
      message: "Message sent successfully. We will get back to you soon.",
    });
  } catch (error) {
    logger.error("Contact form email send failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to send message. Please try again later.",
    });
  }
};
