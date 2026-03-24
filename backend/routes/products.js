/**
 * PRODUCTS API
 *
 * Endpoints для управления продуктами HaoriVision
 */

import express from "express";
import Product from "../models/Product.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * GET /api/products
 * Список продуктов с фильтрами и пагинацией
 * Query params: collection, status, featured, category, search, page, limit
 */
router.get("/", async (req, res) => {
  try {
    const {
      collection,
      status,
      featured,
      category,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (collection) {
      filter.productCollection = collection;
    }

    if (status) {
      filter.status = status;
    }

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tagline: { $regex: search, $options: "i" } },
        { "description.short": { $regex: search, $options: "i" } },
        { "description.long": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to list products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

/**
 * GET /api/products/:id
 * Получить продукт по id (custom string id) или MongoDB _id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let product = await Product.findOne({ id });

    if (!product) {
      // Попробовать найти по MongoDB _id
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(id);
      }
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Увеличить счётчик просмотров
    product.views += 1;
    await product.save();

    res.json({ product });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to get product");
    res.status(500).json({ error: "Failed to get product" });
  }
});

/**
 * POST /api/products
 * Создать новый продукт (admin)
 */
router.post("/", async (req, res) => {
  try {
    const productData = req.body;

    const existing = await Product.findOne({ id: productData.id });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Product with this id already exists" });
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ product });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to create product");

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * PATCH /api/products/:id
 * Обновить продукт (admin)
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let product = await Product.findOne({ id });

    if (!product) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(id);
      }
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    Object.assign(product, updates);
    await product.save();

    res.json({ product });
  } catch (error) {
    baseLogger.error({ err: error }, "Failed to update product");

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to update product" });
  }
});

export default router;
