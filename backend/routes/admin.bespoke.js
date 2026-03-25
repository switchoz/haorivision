import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import BespokeCommission from "../models/BespokeCommission.js";
import { baseLogger } from "../middlewares/logger.js";

const r = express.Router();
r.use(authAdmin);

const statusLabels = {
  submitted: "Заявка подана",
  moodboard_created: "Moodboard создан",
  consultation_scheduled: "Консультация назначена",
  consultation_completed: "Консультация прошла",
  approved: "Дизайн утверждён",
  in_progress: "В работе",
  completed: "Завершено",
  delivered: "Доставлено",
  cancelled: "Отменено",
};

const validStatuses = Object.keys(statusLabels);

/**
 * GET /api/admin/bespoke
 * Список bespoke комиссий с фильтрацией и пагинацией
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const { status, search, from, to, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) query.status = status;

    if (search) {
      const re = new RegExp(String(search), "i");
      query.$or = [
        { commissionNumber: re },
        { "brief.energy": re },
        { "brief.story": re },
      ];
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(String(from));
      if (to) query.createdAt.$lte = new Date(String(to));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total, statusCounts] = await Promise.all([
      BespokeCommission.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("customerId", "name email"),
      BespokeCommission.countDocuments(query),
      BespokeCommission.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      items,
      total,
      statusCounts: Object.fromEntries(
        statusCounts.map((s) => [s._id, s.count]),
      ),
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching bespoke commissions");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * GET /api/admin/bespoke/:id
 * Детали одной комиссии
 */
r.get("/:id", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const doc = await BespokeCommission.findById(req.params.id).populate(
      "customerId",
      "name email phone",
    );
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });
    res.json({ item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching bespoke commission");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/bespoke/:id
 * Обновить статус, заметки художника, цену
 */
r.patch("/:id", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { status, artistNotes, pricing } = req.body || {};
    const update = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ ok: false, code: "BAD_STATUS" });
      }
      update.status = status;
    }

    if (artistNotes) {
      if (artistNotes.designNotes !== undefined)
        update["artistNotes.designNotes"] = artistNotes.designNotes;
      if (artistNotes.technicalNotes !== undefined)
        update["artistNotes.technicalNotes"] = artistNotes.technicalNotes;
    }

    if (pricing) {
      if (pricing.totalPrice !== undefined)
        update["pricing.totalPrice"] = pricing.totalPrice;
      if (pricing.depositPaid !== undefined)
        update["pricing.depositPaid"] = pricing.depositPaid;
    }

    const doc = await BespokeCommission.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );

    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    baseLogger.info(
      { adminId: req.admin.id, commissionId: req.params.id, update },
      "Bespoke commission updated",
    );

    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error updating bespoke commission");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
