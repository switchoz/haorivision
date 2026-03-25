import express from "express";
import Review from "../models/Review.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * GET /api/reviews
 * Одобренные отзывы (public)
 */
router.get("/", async (req, res) => {
  try {
    const { featured, limit = 20, page = 1 } = req.query;
    const query = { approved: true };
    if (featured === "true") query.featured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Review.find(query)
        .sort("-featured -createdAt")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching reviews");
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/reviews
 * Отправить отзыв (public, требует модерации)
 */
router.post("/", async (req, res) => {
  try {
    const { name, city, rating, text, productName, photo } = req.body;
    if (!name || !rating || !text) {
      return res.status(400).json({ error: "name, rating и text обязательны" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating от 1 до 5" });
    }

    const review = await Review.create({
      name,
      city,
      rating: Number(rating),
      text,
      productName,
      photo,
      approved: false,
    });

    res
      .status(201)
      .json({ success: true, message: "Отзыв отправлен на модерацию" });
  } catch (err) {
    baseLogger.error({ err }, "Error creating review");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
