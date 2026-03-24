import express from "express";
import authAdmin from "../middlewares/authAdmin.js";
import { baseLogger } from "../middlewares/logger.js";
import Product from "../models/Product.js";

const r = express.Router();

r.use(authAdmin);

/**
 * GET /api/admin/products
 * Список всех продуктов с пагинацией
 */
r.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
        { productCollection: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching products");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/products
 * Создать продукт
 */
r.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.price) {
      return res
        .status(400)
        .json({
          ok: false,
          code: "VALIDATION_ERROR",
          message: "name и price обязательны",
        });
    }

    if (data.id) {
      const existing = await Product.findOne({ id: data.id });
      if (existing) {
        return res
          .status(409)
          .json({
            ok: false,
            code: "DUPLICATE",
            message: "Продукт с таким id уже существует",
          });
      }
    }

    const product = new Product(data);
    await product.save();

    baseLogger.info(
      { adminId: req.admin.id, productId: product._id },
      "Product created",
    );

    res.status(201).json({ ok: true, product });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ ok: false, code: "VALIDATION_ERROR", message: err.message });
    }
    baseLogger.error({ err }, "Error creating product");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PUT /api/admin/products/:id
 * Обновить продукт
 */
r.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    let product = await Product.findOne({ id });
    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product) {
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Продукт не найден" });
    }

    // Не позволяем менять _id
    delete data._id;
    Object.assign(product, data);
    await product.save();

    baseLogger.info(
      { adminId: req.admin.id, productId: id },
      "Product updated",
    );

    res.json({ ok: true, product });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ ok: false, code: "VALIDATION_ERROR", message: err.message });
    }
    baseLogger.error({ err }, "Error updating product");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Удалить продукт (мягкое удаление — ставит status: archived)
 */
r.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let product = await Product.findOne({ id });
    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product) {
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Продукт не найден" });
    }

    product.status = "archived";
    await product.save();

    baseLogger.info(
      { adminId: req.admin.id, productId: id },
      "Product archived",
    );

    res.json({ ok: true, message: "Продукт перемещён в архив" });
  } catch (err) {
    baseLogger.error({ err }, "Error deleting product");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
