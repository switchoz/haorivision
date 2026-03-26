import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import ContactMessage from "../models/ContactMessage.js";
import { baseLogger } from "../middlewares/logger.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const r = express.Router();
r.use(authAdmin);

/**
 * GET /api/admin/messages
 * Список сообщений с фильтрацией и пагинацией
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const { search, read, type, from, to, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      const re = new RegExp(escapeRegex(String(search)), "i");
      query.$or = [{ name: re }, { email: re }, { message: re }];
    }

    if (read === "true") query.readByAdmin = true;
    if (read === "false") query.readByAdmin = false;

    if (type) query.type = type;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(String(from));
      if (to) query.createdAt.$lte = new Date(String(to));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total, unreadCount] = await Promise.all([
      ContactMessage.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit)),
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ readByAdmin: false }),
    ]);

    res.json({
      items,
      total,
      unreadCount,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching messages");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/messages/:id/read
 * Отметить как прочитанное / непрочитанное
 */
r.patch("/:id/read", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { read } = req.body;
    const doc = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { readByAdmin: read !== false },
      { new: true },
    );
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    baseLogger.info(
      {
        adminId: req.admin.id,
        messageId: req.params.id,
        read: doc.readByAdmin,
      },
      "Message read status updated",
    );
    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error updating message");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/admin/messages/:id
 */
r.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    baseLogger.info(
      { adminId: req.admin.id, messageId: req.params.id },
      "Message deleted",
    );
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Error deleting message");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
