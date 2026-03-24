/**
 * HAORI VISION — A/B Testing API Routes (P26)
 *
 * API endpoints для A/B тестирования микрокопии.
 * Логирует события view/click/interaction в JSON файл.
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { baseLogger } from "../middlewares/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ============================================================
// Configuration
// ============================================================

const STATS_DIR = path.resolve(__dirname, "../../data/ab");
const STATS_FILE = path.join(STATS_DIR, "microcopy_stats.json");

// Создаем директорию если не существует
if (!fs.existsSync(STATS_DIR)) {
  fs.mkdirSync(STATS_DIR, { recursive: true });
}

// ============================================================
// Types
// ============================================================

/**
 * @typedef {Object} MicrocopyEvent
 * @property {string} timestamp
 * @property {string} experiment_id
 * @property {string} variant
 * @property {string} event_type
 * @property {string} session_id
 * @property {number} [time_to_event]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} MicrocopyStats
 * @property {string} experiment_id
 * @property {string} last_updated
 * @property {Object} variants
 * @property {MicrocopyEvent[]} events
 */

// ============================================================
// Helper Functions
// ============================================================

/**
 * Загружает статистику из файла
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Failed to load stats");
  }

  // Возвращаем пустую структуру
  return {
    experiment_id: "microcopy_v1",
    last_updated: new Date().toISOString(),
    variants: {
      A: {
        views: 0,
        clicks: 0,
        interactions: 0,
        ctr: 0,
        avg_time_to_click: 0,
        avg_time_to_interaction: 0,
      },
      B: {
        views: 0,
        clicks: 0,
        interactions: 0,
        ctr: 0,
        avg_time_to_click: 0,
        avg_time_to_interaction: 0,
      },
    },
    events: [],
  };
}

/**
 * Сохраняет статистику в файл
 */
function saveStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
    return true;
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Failed to save stats");
    return false;
  }
}

/**
 * Обновляет агрегированную статистику
 */
function updateAggregateStats(stats) {
  // Сбрасываем счетчики
  for (const variant of Object.keys(stats.variants)) {
    stats.variants[variant].views = 0;
    stats.variants[variant].clicks = 0;
    stats.variants[variant].interactions = 0;
    stats.variants[variant].ctr = 0;
    stats.variants[variant].avg_time_to_click = 0;
    stats.variants[variant].avg_time_to_interaction = 0;
  }

  // Подсчитываем события
  const clickTimes = { A: [], B: [] };
  const interactionTimes = { A: [], B: [] };

  for (const event of stats.events) {
    const variant = event.variant;
    if (!stats.variants[variant]) continue;

    switch (event.event_type) {
      case "view":
        stats.variants[variant].views += 1;
        break;
      case "click":
        stats.variants[variant].clicks += 1;
        if (event.time_to_event !== undefined) {
          clickTimes[variant].push(event.time_to_event);
        }
        break;
      case "interaction":
        stats.variants[variant].interactions += 1;
        if (event.time_to_event !== undefined) {
          interactionTimes[variant].push(event.time_to_event);
        }
        break;
    }
  }

  // Считаем CTR и средние времена
  for (const variant of Object.keys(stats.variants)) {
    const variantStats = stats.variants[variant];

    // CTR
    if (variantStats.views > 0) {
      variantStats.ctr = variantStats.clicks / variantStats.views;
    }

    // Среднее время до клика
    if (clickTimes[variant].length > 0) {
      const sum = clickTimes[variant].reduce((a, b) => a + b, 0);
      variantStats.avg_time_to_click = Math.round(
        sum / clickTimes[variant].length,
      );
    }

    // Среднее время до взаимодействия
    if (interactionTimes[variant].length > 0) {
      const sum = interactionTimes[variant].reduce((a, b) => a + b, 0);
      variantStats.avg_time_to_interaction = Math.round(
        sum / interactionTimes[variant].length,
      );
    }
  }

  stats.last_updated = new Date().toISOString();
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/ab/microcopy
 * Логирует событие A/B теста
 */
router.post("/microcopy", (req, res) => {
  try {
    const event = req.body;

    // Валидация
    if (
      !event.experiment_id ||
      !event.variant ||
      !event.event_type ||
      !event.session_id
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: experiment_id, variant, event_type, session_id",
      });
    }

    // Добавляем timestamp если нет
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Загружаем статистику
    const stats = loadStats();

    // Добавляем событие
    stats.events.push(event);

    // Ограничиваем размер лога (последние 10000 событий)
    if (stats.events.length > 10000) {
      stats.events = stats.events.slice(-10000);
    }

    // Обновляем агрегированную статистику
    updateAggregateStats(stats);

    // Сохраняем
    const saved = saveStats(stats);

    if (!saved) {
      return res.status(500).json({ error: "Failed to save stats" });
    }

    baseLogger.info(
      `[AB API] Event logged: ${event.event_type} for variant ${event.variant}`,
    );

    res.json({
      success: true,
      event_id: stats.events.length,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Error logging event");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/ab/microcopy/stats
 * Возвращает агрегированную статистику
 */
router.get("/microcopy/stats", (req, res) => {
  try {
    const stats = loadStats();

    res.json({
      experiment_id: stats.experiment_id,
      last_updated: stats.last_updated,
      variants: stats.variants,
      total_events: stats.events.length,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Error fetching stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/ab/microcopy/events
 * Возвращает сырые события (с пагинацией)
 */
router.get("/microcopy/events", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const stats = loadStats();
    const events = stats.events.slice(offset, offset + limit);

    res.json({
      total: stats.events.length,
      limit,
      offset,
      events,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Error fetching events");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/ab/microcopy/stats
 * Очищает статистику (для тестирования)
 */
router.delete("/microcopy/stats", (req, res) => {
  try {
    const emptyStats = {
      experiment_id: "microcopy_v1",
      last_updated: new Date().toISOString(),
      variants: {
        A: {
          views: 0,
          clicks: 0,
          interactions: 0,
          ctr: 0,
          avg_time_to_click: 0,
          avg_time_to_interaction: 0,
        },
        B: {
          views: 0,
          clicks: 0,
          interactions: 0,
          ctr: 0,
          avg_time_to_click: 0,
          avg_time_to_interaction: 0,
        },
      },
      events: [],
    };

    const saved = saveStats(emptyStats);

    if (!saved) {
      return res.status(500).json({ error: "Failed to clear stats" });
    }

    baseLogger.info("[AB API] Stats cleared");

    res.json({ success: true, message: "Stats cleared" });
  } catch (error) {
    baseLogger.error({ err: error }, "[AB API] Error clearing stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// Export
// ============================================================

export default router;
