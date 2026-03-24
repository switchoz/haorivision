import express from "express";
import authAdmin from "../middlewares/authAdmin.js";
import { serverFlags } from "../config/flags.js";
import { baseLogger } from "../middlewares/logger.js";

const r = express.Router();

// Все роуты защищены authAdmin middleware
r.use(authAdmin);

/**
 * GET /api/admin/flags
 * Получить текущие флаги
 */
r.get("/", (_req, res) => {
  res.json(serverFlags);
});

/**
 * POST /api/admin/flags
 * Обновить флаги (runtime изменения)
 */
r.post("/", (req, res) => {
  try {
    const patch = req.body || {};
    const updated = {};

    for (const k of Object.keys(patch)) {
      if (k in serverFlags) {
        const newValue = !!patch[k];
        serverFlags[k] = newValue;
        updated[k] = newValue;
      }
    }

    baseLogger.info(
      { adminId: req.admin.id, updated },
      "Feature flags updated",
    );

    res.json({
      ok: true,
      flags: serverFlags,
      updated,
    });
  } catch (err) {
    baseLogger.error({ err }, "Error updating flags");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
