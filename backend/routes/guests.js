/**
 * 🎫 GUEST CHECK-IN API
 *
 * Endpoints для регистрации гостей и генерации Light Cards
 */

import express from "express";
import { createCanvas, loadImage, registerFont } from "canvas";
import QRCode from "qrcode";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GUESTS_DIR = path.join(__dirname, "../../data/guests");
const LIGHT_CARDS_DIR = path.join(__dirname, "../../public/light-cards");

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(GUESTS_DIR, { recursive: true });
  await fs.mkdir(LIGHT_CARDS_DIR, { recursive: true });
}

/**
 * POST /api/guests/checkin
 * Чекин гостя + генерация Light Card
 */
router.post("/checkin", async (req, res) => {
  try {
    await ensureDirs();

    const { name, email, photoConsent, language } = req.body;

    if (!name || !email || !photoConsent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Создать guest ID
    const guestId = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();

    const guest = {
      id: guestId,
      name,
      email,
      photoConsent,
      language: language || "en",
      checkinTime: new Date().toISOString(),
      timestamp,
    };

    // Сохранить guest data
    const guestFile = path.join(GUESTS_DIR, `${guestId}.json`);
    await fs.writeFile(guestFile, JSON.stringify(guest, null, 2));

    // Генерация Light Card
    const lightCard = await generateLightCard(guest);

    baseLogger.info(`[Guests] Guest checked in: ${name} (${guestId})`);

    res.json({
      success: true,
      guestId,
      lightCard,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Guests] Check-in failed");
    res.status(500).json({ error: "Check-in failed" });
  }
});

/**
 * GET /api/guests/:guestId
 * Получить данные гостя
 */
router.get("/:guestId", async (req, res) => {
  try {
    const { guestId } = req.params;
    const guestFile = path.join(GUESTS_DIR, `${guestId}.json`);

    const data = await fs.readFile(guestFile, "utf-8");
    const guest = JSON.parse(data);

    res.json(guest);
  } catch (error) {
    baseLogger.error({ err: error }, "[Guests] Failed to load guest");
    res.status(404).json({ error: "Guest not found" });
  }
});

/**
 * Генерация Light Card (PNG + QR)
 */
async function generateLightCard(guest) {
  const width = 800;
  const height = 1200;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Gradient orbs
  const gradient1 = ctx.createRadialGradient(
    width - 100,
    100,
    0,
    width - 100,
    100,
    300,
  );
  gradient1.addColorStop(0, "rgba(255, 16, 240, 0.3)");
  gradient1.addColorStop(1, "rgba(255, 16, 240, 0)");
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, width, height);

  const gradient2 = ctx.createRadialGradient(
    100,
    height - 100,
    0,
    100,
    height - 100,
    250,
  );
  gradient2.addColorStop(0, "rgba(0, 191, 255, 0.3)");
  gradient2.addColorStop(1, "rgba(0, 191, 255, 0)");
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, width, height);

  // Header: HAORI VISION
  ctx.fillStyle = "#000000";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("HAORI VISION", width / 2, 150);

  ctx.font = "24px Arial";
  ctx.fillStyle = "#666666";
  ctx.fillText("Eclipse of Light", width / 2, 190);

  // Guest Name
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#000000";
  ctx.fillText(guest.name, width / 2, height / 2 - 50);

  // Date
  const date = new Date(guest.checkinTime).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.font = "24px Arial";
  ctx.fillStyle = "#666666";
  ctx.fillText(date, width / 2, height / 2);

  // QR Code
  const qrData = JSON.stringify({
    guestId: guest.id,
    name: guest.name,
    email: guest.email,
    timestamp: guest.timestamp,
  });

  const qrImage = await QRCode.toDataURL(qrData, {
    width: 240,
    margin: 0,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const qr = await loadImage(qrImage);

  // QR background
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(width / 2 - 140, height / 2 + 80, 280, 280);

  ctx.drawImage(qr, width / 2 - 120, height / 2 + 100, 240, 240);

  // Guest ID
  ctx.font = "20px monospace";
  ctx.fillStyle = "#999999";
  ctx.fillText(`#${guest.id}`, width / 2, height - 80);

  // Save PNG
  const filename = `light-card-${guest.id}.png`;
  const filepath = path.join(LIGHT_CARDS_DIR, filename);

  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(filepath, buffer);

  return {
    guestId: guest.id,
    imageUrl: `/light-cards/${filename}`,
    qrData,
    generatedAt: new Date().toISOString(),
  };
}

export default router;
