/**
 * CONTACT API
 *
 * Endpoint для отправки контактных сообщений
 */

import express from "express";
import { sendCustomEmail } from "../services/emailService.js";
import { sanitizeInput } from "../middlewares/security.js";
import { baseLogger } from "../middlewares/logger.js";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

/** Escape HTML special characters for safe email insertion */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * POST /api/contact
 * Отправить контактное сообщение администратору
 * Body: { name, email, type, message }
 */
router.post("/", async (req, res) => {
  try {
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const type = sanitizeInput(req.body.type);
    const message = sanitizeInput(req.body.message);

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const subject = `[HaoriVision Contact] ${escapeHtml(type) || "General"} — from ${escapeHtml(name)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 16px; border: 1px solid #a855f7; }
          h1 { color: #a855f7; margin-bottom: 24px; }
          .field { margin-bottom: 16px; }
          .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .value { color: #fff; font-size: 16px; margin-top: 4px; }
          .message-box { background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f733; border-radius: 8px; padding: 20px; margin-top: 24px; line-height: 1.6; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Contact Message</h1>

          <div class="field">
            <div class="label">Name</div>
            <div class="value">${escapeHtml(name)}</div>
          </div>

          <div class="field">
            <div class="label">Email</div>
            <div class="value">${escapeHtml(email)}</div>
          </div>

          <div class="field">
            <div class="label">Type</div>
            <div class="value">${escapeHtml(type) || "General"}</div>
          </div>

          <div class="message-box">
            <div class="label">Message</div>
            <div class="value" style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>
          </div>

          <div class="footer">
            <p>HAORI VISION Contact Form</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Always save to DB first — never lose a message
    const saved = await ContactMessage.create({
      name,
      email,
      type: type || "general",
      message,
      emailSent: false,
    });

    // Try sending email (non-blocking — success even if email fails)
    let emailSent = false;
    try {
      const result = await sendCustomEmail(adminEmail, subject, htmlContent);
      if (result.success) {
        emailSent = true;
        saved.emailSent = true;
        await saved.save();
      }
    } catch (emailErr) {
      baseLogger.warn(
        { err: emailErr },
        "Contact email failed, but message saved to DB",
      );
    }

    res.json({
      success: true,
      message: emailSent
        ? "Сообщение отправлено"
        : "Сообщение сохранено, мы свяжемся с вами",
      id: saved._id,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Contact form error");
    res.status(500).json({ error: "Ошибка при отправке сообщения" });
  }
});

export default router;
