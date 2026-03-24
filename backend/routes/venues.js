/**
 * 🎯 VENUE PROFILES API
 *
 * Endpoints для сохранения/загрузки venue profiles
 */

import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENUES_DIR = path.join(__dirname, "../../data/show/venues");

// Ensure venues directory exists
async function ensureVenuesDir() {
  try {
    await fs.access(VENUES_DIR);
  } catch {
    await fs.mkdir(VENUES_DIR, { recursive: true });
  }
}

/**
 * GET /api/venues
 * Список всех venue profiles
 */
router.get("/", async (req, res) => {
  try {
    await ensureVenuesDir();

    const files = await fs.readdir(VENUES_DIR);
    const venues = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    res.json({ venues });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to list venues");
    res.status(500).json({ error: "Failed to list venues" });
  }
});

/**
 * GET /api/venues/:venueId
 * Загрузить venue profile
 */
router.get("/:venueId", async (req, res) => {
  try {
    const { venueId } = req.params;
    const filePath = path.join(VENUES_DIR, `${venueId}.json`);

    const data = await fs.readFile(filePath, "utf-8");
    const profile = JSON.parse(data);

    res.json(profile);
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to load venue");
    res.status(404).json({ error: "Venue not found" });
  }
});

/**
 * POST /api/venues/save
 * Сохранить venue profile
 */
router.post("/save", async (req, res) => {
  try {
    await ensureVenuesDir();

    const profile = req.body;

    if (!profile.id) {
      return res.status(400).json({ error: "Missing venue id" });
    }

    const filePath = path.join(VENUES_DIR, `${profile.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");

    baseLogger.info(`[Venues] Venue profile saved: ${profile.id}`);

    res.json({ success: true, venueId: profile.id });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to save venue");
    res.status(500).json({ error: "Failed to save venue" });
  }
});

/**
 * DELETE /api/venues/:venueId
 * Удалить venue profile
 */
router.delete("/:venueId", async (req, res) => {
  try {
    const { venueId } = req.params;
    const filePath = path.join(VENUES_DIR, `${venueId}.json`);

    await fs.unlink(filePath);

    baseLogger.info(`[Venues] Venue profile deleted: ${venueId}`);

    res.json({ success: true });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to delete venue");
    res.status(500).json({ error: "Failed to delete venue" });
  }
});

export default router;
