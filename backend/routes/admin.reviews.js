import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import Review from "../models/Review.js";
import { baseLogger } from "../middlewares/logger.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const r = express.Router();
r.use(authAdmin);

/**
 * GET /api/admin/reviews
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const { approved, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approved === "true") query.approved = true;
    if (approved === "false") query.approved = false;
    if (search) {
      const re = new RegExp(escapeRegex(String(search)), "i");
      query.$or = [{ name: re }, { text: re }, { productName: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total, pendingCount] = await Promise.all([
      Review.find(query).sort("-createdAt").skip(skip).limit(Number(limit)),
      Review.countDocuments(query),
      Review.countDocuments({ approved: false }),
    ]);

    res.json({
      items,
      total,
      pendingCount,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching admin reviews");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/reviews/:id
 */
r.patch("/:id", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { approved, featured } = req.body;
    const update = {};
    if (approved !== undefined) update.approved = approved;
    if (featured !== undefined) update.featured = featured;

    const doc = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    baseLogger.info(
      { adminId: req.admin.id, reviewId: req.params.id, update },
      "Review updated",
    );
    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error updating review");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 */
r.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const doc = await Review.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });
    baseLogger.info(
      { adminId: req.admin.id, reviewId: req.params.id },
      "Review deleted",
    );
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Error deleting review");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
