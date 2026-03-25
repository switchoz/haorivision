import express from "express";
import BlogPost from "../models/BlogPost.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * GET /api/blog
 * Список опубликованных постов (public)
 */
router.get("/", async (req, res) => {
  try {
    const { tag, page = 1, limit = 12 } = req.query;
    const query = { published: true };
    if (tag) query.tags = tag;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      BlogPost.find(query)
        .select("slug title excerpt coverImage tags author publishedAt")
        .sort("-publishedAt")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    // Собрать все теги для фильтра
    const allTags = await BlogPost.distinct("tags", { published: true });

    res.json({
      items,
      total,
      tags: allTags,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching blog posts");
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/blog/:slug
 * Один пост по slug (public)
 */
router.get("/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      published: true,
    }).lean();

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ post });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching blog post");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
