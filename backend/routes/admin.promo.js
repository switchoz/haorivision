import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import PromoCode from "../models/PromoCode.js";
import { baseLogger } from "../middlewares/logger.js";

const r = express.Router();
r.use(authAdmin);

/**
 * GET /api/admin/promo
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;
    const query = {};
    if (active === "true") query.active = true;
    if (active === "false") query.active = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      PromoCode.find(query).sort("-createdAt").skip(skip).limit(Number(limit)),
      PromoCode.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Admin promo list error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/promo
 */
r.post("/", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { code, type, value, currency, minOrderAmount, maxUses, expiresAt } =
      req.body;
    if (!code || !type || !value) {
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS" });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      type,
      value: Number(value),
      currency,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    baseLogger.info(
      { adminId: req.admin.id, code: promo.code },
      "Promo code created",
    );
    res.status(201).json({ ok: true, item: promo });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ ok: false, code: "CODE_EXISTS" });
    baseLogger.error({ err }, "Admin promo create error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/promo/:id
 */
r.patch("/:id", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { active, maxUses, expiresAt, value } = req.body;
    const update = {};
    if (active !== undefined) update.active = active;
    if (maxUses !== undefined) update.maxUses = maxUses;
    if (expiresAt !== undefined)
      update.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (value !== undefined) update.value = Number(value);

    const doc = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Admin promo update error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/admin/promo/:id
 */
r.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Admin promo delete error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
