import express from "express";
import telegramBotService from "../services/telegramBotService.js";
import TelegramPost from "../models/TelegramPost.js";
import { baseLogger } from "../middlewares/logger.js";
import authAdmin from "../middlewares/authAdmin.js";

const router = express.Router();

/**
 * POST /api/telegram/generate
 * Генерация поста через AI (сохраняет как черновик)
 * Body: { type: 'esoteric'|'haori_work'|'news'|'promo'|'behind_scenes', topic?: string }
 */
router.post("/generate", authAdmin, async (req, res) => {
  try {
    const { type, topic } = req.body;

    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }

    const post = await telegramBotService.generatePost(type, topic);
    res.json({ success: true, post });
  } catch (error) {
    baseLogger.error({ err: error }, "Generate error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/telegram/publish/:id
 * Отправка черновика в канал
 */
router.post("/publish/:id", authAdmin, async (req, res) => {
  try {
    const post = await telegramBotService.publishPost(req.params.id);
    res.json({ success: true, post });
  } catch (error) {
    baseLogger.error({ err: error }, "Publish error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/telegram/generate-and-publish
 * Генерация + немедленная отправка
 * Body: { type, topic?, imageUrl? }
 */
router.post("/generate-and-publish", authAdmin, async (req, res) => {
  try {
    const { type, topic, imageUrl } = req.body;

    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }

    const post = await telegramBotService.generateAndPublish(
      type,
      topic,
      imageUrl,
    );
    res.json({ success: true, post });
  } catch (error) {
    baseLogger.error({ err: error }, "Generate and publish error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/telegram/send-raw
 * Отправка произвольного текста (без AI)
 * Body: { text, imageUrl? }
 */
router.post("/send-raw", authAdmin, async (req, res) => {
  try {
    const { text, imageUrl } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const post = new TelegramPost({
      type: "news",
      text,
      imageUrl: imageUrl || null,
      aiGenerated: false,
    });
    await post.save();

    const published = await telegramBotService.publishPost(post._id);
    res.json({ success: true, post: published });
  } catch (error) {
    baseLogger.error({ err: error }, "Send raw error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/telegram/schedule
 * Запланировать пост
 * Body: { type, topic?, imageUrl?, scheduledAt: ISO date string }
 */
router.post("/schedule", authAdmin, async (req, res) => {
  try {
    const { type, topic, imageUrl, scheduledAt } = req.body;

    if (!type || !scheduledAt) {
      return res
        .status(400)
        .json({ error: "type and scheduledAt are required" });
    }

    const post = await telegramBotService.generatePost(type, topic);
    post.status = "scheduled";
    post.scheduledAt = new Date(scheduledAt);
    if (imageUrl) post.imageUrl = imageUrl;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    baseLogger.error({ err: error }, "Schedule error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/telegram/posts
 * Список всех постов с фильтрацией
 * Query: { status?, type?, limit?, page? }
 */
router.get("/posts", async (req, res) => {
  try {
    const { status, type, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const posts = await TelegramPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await TelegramPost.countDocuments(filter);

    res.json({ success: true, posts, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/telegram/stats
 * Статистика постов
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await telegramBotService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/telegram/posts/:id
 * Удаление черновика
 */
router.delete("/posts/:id", authAdmin, async (req, res) => {
  try {
    const post = await TelegramPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status === "sent") {
      return res.status(400).json({ error: "Cannot delete sent post" });
    }

    await TelegramPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/telegram/posts/:id
 * Редактирование черновика
 * Body: { text?, imageUrl?, scheduledAt?, type? }
 */
router.patch("/posts/:id", authAdmin, async (req, res) => {
  try {
    const post = await TelegramPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status === "sent") {
      return res.status(400).json({ error: "Cannot edit sent post" });
    }

    const { text, imageUrl, scheduledAt, type } = req.body;
    if (text) post.text = text;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    if (type) post.type = type;
    if (scheduledAt) {
      post.scheduledAt = new Date(scheduledAt);
      post.status = "scheduled";
    }
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/telegram/webhook
 * Telegram Bot Webhook — обработка входящих сообщений
 */
router.post("/webhook", async (req, res) => {
  try {
    await telegramBotService.handleUpdate(req.body);
    res.json({ ok: true });
  } catch (error) {
    baseLogger.error({ err: error }, "Webhook error");
    res.json({ ok: true }); // Always return 200 to Telegram
  }
});

/**
 * POST /api/telegram/setup
 * Настройка бота: команды, меню, webhook
 * Body: { webhookUrl?: string }
 */
router.post("/setup", authAdmin, async (req, res) => {
  try {
    await telegramBotService.setCommands();
    await telegramBotService.setMenuButton();

    if (req.body.webhookUrl) {
      await telegramBotService.setWebhook(req.body.webhookUrl);
    }

    res.json({ success: true, message: "Bot configured" });
  } catch (error) {
    baseLogger.error({ err: error }, "Setup error");
    res.status(500).json({ error: error.message });
  }
});

export default router;
