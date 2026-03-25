import express from "express";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import BespokeCommission from "../models/BespokeCommission.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "haori-customer-secret";

/**
 * Middleware: авторизация клиента
 */
function authCustomer(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Необходима авторизация" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.customerId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

/**
 * POST /api/account/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const customer = await Customer.findOne({
      email: email.toLowerCase(),
    }).select("+password");
    if (!customer) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const valid = await customer.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    customer.lastLogin = new Date();
    await customer.save();

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        vipTier: customer.vipTier,
      },
    });
  } catch (err) {
    baseLogger.error({ err }, "Customer login error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * POST /api/account/register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Имя, email и пароль обязательны" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Пароль минимум 6 символов" });
    }

    const exists = await Customer.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ error: "Этот email уже зарегистрирован" });
    }

    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password,
      source: "web",
    });

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.status(201).json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        vipTier: customer.vipTier,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Этот email уже зарегистрирован" });
    }
    baseLogger.error({ err }, "Customer register error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * GET /api/account/me
 */
router.get("/me", authCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select(
      "-password",
    );
    if (!customer) return res.status(404).json({ error: "Не найден" });
    res.json({ customer });
  } catch (err) {
    baseLogger.error({ err }, "Account me error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * GET /api/account/orders
 */
router.get("/orders", authCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId);
    if (!customer) return res.status(404).json({ error: "Не найден" });

    const orders = await Order.find({
      $or: [{ customer: req.customerId }, { email: customer.email }],
    })
      .sort("-createdAt")
      .populate("items.product", "name id images")
      .lean();

    res.json({ orders });
  } catch (err) {
    baseLogger.error({ err }, "Account orders error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * GET /api/account/bespoke
 */
router.get("/bespoke", authCustomer, async (req, res) => {
  try {
    const commissions = await BespokeCommission.find({
      customerId: req.customerId,
    })
      .sort("-createdAt")
      .lean();
    res.json({ commissions });
  } catch (err) {
    baseLogger.error({ err }, "Account bespoke error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * PATCH /api/account/me
 * Обновить профиль
 */
router.patch("/me", authCustomer, async (req, res) => {
  try {
    const { name, phone, shippingAddress } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (shippingAddress) update.shippingAddress = shippingAddress;

    const customer = await Customer.findByIdAndUpdate(
      req.customerId,
      { $set: update },
      { new: true },
    ).select("-password");

    res.json({ customer });
  } catch (err) {
    baseLogger.error({ err }, "Account update error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * GET /api/account/wishlist
 */
router.get("/wishlist", authCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select("wishlist");
    if (!customer) return res.status(404).json({ error: "Не найден" });

    // Подгрузить данные продуктов
    const Product = (await import("../models/Product.js")).default;
    const products = customer.wishlist?.length
      ? await Product.find({ id: { $in: customer.wishlist } })
          .select("id name price images tagline")
          .lean()
      : [];

    res.json({ items: products });
  } catch (err) {
    baseLogger.error({ err }, "Wishlist get error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * POST /api/account/wishlist/:productId
 */
router.post("/wishlist/:productId", authCustomer, async (req, res) => {
  try {
    const { productId } = req.params;
    await Customer.findByIdAndUpdate(req.customerId, {
      $addToSet: { wishlist: productId },
    });
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Wishlist add error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * DELETE /api/account/wishlist/:productId
 */
router.delete("/wishlist/:productId", authCustomer, async (req, res) => {
  try {
    const { productId } = req.params;
    await Customer.findByIdAndUpdate(req.customerId, {
      $pull: { wishlist: productId },
    });
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Wishlist remove error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
