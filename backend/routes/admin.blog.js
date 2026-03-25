import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import BlogPost from "../models/BlogPost.js";
import { baseLogger } from "../middlewares/logger.js";

const r = express.Router();
r.use(authAdmin);

/**
 * GET /api/admin/blog
 * Список всех постов (включая черновики)
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const { published, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (published === "true") query.published = true;
    if (published === "false") query.published = false;
    if (search) {
      const re = new RegExp(String(search), "i");
      query.$or = [{ title: re }, { excerpt: re }, { tags: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      BlogPost.find(query).sort("-createdAt").skip(skip).limit(Number(limit)),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching admin blog posts");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/blog
 * Создать пост
 */
r.post("/", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, tags, published } =
      req.body;

    if (!title || !content) {
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS" });
    }

    // Автогенерация slug если не указан
    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "-")
        .replace(/^-|-$/g, "");

    const post = await BlogPost.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      coverImage,
      tags: tags || [],
      published: published || false,
      publishedAt: published ? new Date() : null,
      author: req.admin?.name || "LiZa",
    });

    baseLogger.info(
      { adminId: req.admin.id, postId: post._id },
      "Blog post created",
    );
    res.status(201).json({ ok: true, item: post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, code: "SLUG_EXISTS" });
    }
    baseLogger.error({ err }, "Error creating blog post");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/blog/:id
 * Обновить пост
 */
r.patch("/:id", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, tags, published } =
      req.body;
    const update = {};

    if (title !== undefined) update.title = title;
    if (slug !== undefined) update.slug = slug;
    if (excerpt !== undefined) update.excerpt = excerpt;
    if (content !== undefined) update.content = content;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (tags !== undefined) update.tags = tags;
    if (published !== undefined) {
      update.published = published;
      if (published && !update.publishedAt) update.publishedAt = new Date();
    }

    const doc = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );

    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });

    baseLogger.info(
      { adminId: req.admin.id, postId: req.params.id },
      "Blog post updated",
    );
    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error updating blog post");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/admin/blog/:id
 */
r.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const doc = await BlogPost.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, code: "NOT_FOUND" });
    baseLogger.info(
      { adminId: req.admin.id, postId: req.params.id },
      "Blog post deleted",
    );
    res.json({ ok: true });
  } catch (err) {
    baseLogger.error({ err }, "Error deleting blog post");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
