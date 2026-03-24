import express from "express";
import AdminUser from "../models/AdminUser.js";
import { hash } from "../utils/hash.js";
import authAdmin, { signAdmin, requireRole } from "../middlewares/authAdmin.js";
import { baseLogger } from "../middlewares/logger.js";

const r = express.Router();

/**
 * POST /api/admin/auth/login
 * Аутентификация админа
 */
r.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS" });
    }

    const user = await AdminUser.findOne({ email: email.toLowerCase() });

    if (!user || user.passwordHash !== hash(password)) {
      return res.status(401).json({ ok: false, code: "INVALID_CREDENTIALS" });
    }

    // Обновляем lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = signAdmin({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({ ok: true, token });
  } catch (err) {
    baseLogger.error({ err }, "Login error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/auth/seed
 * Временный эндпоинт для создания первого админа
 * В продакшене рекомендуется удалить или защитить
 */
r.post("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Seed is disabled in production" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS" });
    }

    const exist = await AdminUser.findOne({ email: email.toLowerCase() });

    if (exist) {
      return res.json({
        ok: true,
        created: false,
        message: "Admin already exists",
      });
    }

    await AdminUser.create({
      email: email.toLowerCase(),
      passwordHash: hash(password),
      role: "admin",
    });

    res.json({
      ok: true,
      created: true,
      message: "Admin created successfully",
    });
  } catch (err) {
    baseLogger.error({ err }, "Seed error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/auth/role
 * Изменить роль пользователя (только для admin)
 */
r.post("/role", authAdmin, requireRole("admin"), async (req, res) => {
  try {
    const { email, role } = req.body || {};

    if (!email || !role) {
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS" });
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return res.status(400).json({ ok: false, code: "INVALID_ROLE" });
    }

    const user = await AdminUser.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ ok: false, code: "USER_NOT_FOUND" });
    }

    res.json({ ok: true, email: user.email, role: user.role });
  } catch (err) {
    baseLogger.error({ err }, "Role update error");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
