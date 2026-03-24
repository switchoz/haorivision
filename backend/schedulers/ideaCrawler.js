#!/usr/bin/env node
/**
 * HAORI VISION — Idea Crawler Scheduler
 *
 * Ежедневный re-crawl идей для обновления статусов:
 * - Проверка изменений уровней (Evidence Level, Certainty)
 * - Обновление описаний и изображений
 * - Отправка уведомлений при значимых изменениях
 * - Соблюдение robots.txt и rate-limiting
 *
 * Запуск:
 *   node backend/schedulers/ideaCrawler.js
 *
 * Cron (ежедневно в 3:00 AM):
 *   0 3 * * * node /path/to/ideaCrawler.js
 */

import cron from "node-cron";
import mongoose from "mongoose";
import axios from "axios";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const AUDIT_LOG_PATH = path.join(
  __dirname,
  "../../data/logs/crawler-audit.log",
);

// Ensure logs directory exists
const logsDir = path.dirname(AUDIT_LOG_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================================================
// MODELS (Simplified - adjust to match your actual schema)
// ============================================================================

const IdeaSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  title: String,
  description: String,
  evidenceLevel: Number,
  certaintyLevel: Number,
  images: [String],
  status: String,
  lastCrawled: Date,
  crawlHistory: [
    {
      date: Date,
      changes: mongoose.Schema.Types.Mixed,
    },
  ],
  addedBy: String,
  createdAt: Date,
  updatedAt: Date,
});

const Idea = mongoose.model("Idea", IdeaSchema);

// ============================================================================
// ROBOTS.TXT CHECKER
// ============================================================================

const robotsCache = new Map();

async function checkRobotsTxt(url) {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    // Check cache
    if (robotsCache.has(urlObj.host)) {
      const robots = robotsCache.get(urlObj.host);
      return robots.isAllowed(url, "HaoriVisionBot");
    }

    // Fetch robots.txt
    const response = await axios.get(robotsUrl, { timeout: 5000 });
    const robots = robotsParser(robotsUrl, response.data);

    robotsCache.set(urlObj.host, robots);

    return robots.isAllowed(url, "HaoriVisionBot");
  } catch (error) {
    // If robots.txt not found or error, assume allowed
    auditLog(`[WARN] robots.txt check failed for ${url}: ${error.message}`);
    return true;
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

function auditLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(AUDIT_LOG_PATH, logEntry);
  console.log(logEntry.trim());
}

// ============================================================================
// CRAWLING LOGIC
// ============================================================================

async function crawlIdea(idea) {
  try {
    // 1. Check robots.txt
    const isAllowed = await checkRobotsTxt(idea.url);
    if (!isAllowed) {
      auditLog(`[SKIP] robots.txt disallows crawling: ${idea.url}`);
      return null;
    }

    // 2. Fetch page (with retries)
    let response;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        response = await axios.get(idea.url, {
          timeout: 10000,
          headers: {
            "User-Agent":
              "HaoriVisionBot/1.0 (Research crawler; +https://haorivision.com/bot)",
          },
        });
        break;
      } catch (error) {
        retries++;
        if (retries >= MAX_RETRIES) throw error;
        await sleep(RATE_LIMIT_DELAY * retries);
      }
    }

    // 3. Parse HTML (XSS-safe)
    const $ = cheerio.load(response.data);

    // Remove dangerous elements
    $("script, iframe, object, embed").remove();

    // 4. Extract data (adjust selectors based on your needs)
    const newData = {
      title: sanitizeText($("title").text() || $("h1").first().text()),
      description: sanitizeText(
        $('meta[name="description"]').attr("content") || $("p").first().text(),
      ),
      images: $("img")
        .map((i, el) => sanitizeUrl($(el).attr("src")))
        .get()
        .slice(0, 5),
      // Add your custom selectors for evidenceLevel, certaintyLevel, etc.
    };

    // 5. Detect changes
    const changes = detectChanges(idea, newData);

    auditLog(
      `[CRAWL] ${idea.url} - ${changes.length > 0 ? "Changes detected" : "No changes"}`,
    );

    return {
      newData,
      changes,
      crawledAt: new Date(),
    };
  } catch (error) {
    auditLog(`[ERROR] Failed to crawl ${idea.url}: ${error.message}`);
    return null;
  }
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

function detectChanges(oldIdea, newData) {
  const changes = [];

  // Check title
  if (newData.title && oldIdea.title !== newData.title) {
    changes.push({
      field: "title",
      oldValue: oldIdea.title,
      newValue: newData.title,
      severity: "low",
    });
  }

  // Check description
  if (newData.description && oldIdea.description !== newData.description) {
    changes.push({
      field: "description",
      oldValue: oldIdea.description,
      newValue: newData.description,
      severity: "medium",
    });
  }

  // Check evidence level
  if (
    newData.evidenceLevel &&
    oldIdea.evidenceLevel !== newData.evidenceLevel
  ) {
    changes.push({
      field: "evidenceLevel",
      oldValue: oldIdea.evidenceLevel,
      newValue: newData.evidenceLevel,
      severity: "high",
    });
  }

  // Check certainty level
  if (
    newData.certaintyLevel &&
    oldIdea.certaintyLevel !== newData.certaintyLevel
  ) {
    changes.push({
      field: "certaintyLevel",
      oldValue: oldIdea.certaintyLevel,
      newValue: newData.certaintyLevel,
      severity: "high",
    });
  }

  // Check images (simplified)
  const oldImages = new Set(oldIdea.images || []);
  const newImages = new Set(newData.images || []);
  const addedImages = [...newImages].filter((img) => !oldImages.has(img));
  const removedImages = [...oldImages].filter((img) => !newImages.has(img));

  if (addedImages.length > 0 || removedImages.length > 0) {
    changes.push({
      field: "images",
      addedImages,
      removedImages,
      severity: "low",
    });
  }

  return changes;
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

async function sendChangeNotification(idea, changes) {
  try {
    // Filter high-severity changes
    const highSeverityChanges = changes.filter((c) => c.severity === "high");

    if (highSeverityChanges.length === 0) {
      return; // No critical changes
    }

    // Build notification message
    const changesList = highSeverityChanges
      .map((change) => {
        return `- ${change.field}: ${change.oldValue} → ${change.newValue}`;
      })
      .join("\n");

    const notification = {
      title: `⚠️ Idea Updated: ${idea.title}`,
      message: `Significant changes detected:\n\n${changesList}\n\nURL: ${idea.url}`,
      ideaId: idea._id,
      timestamp: new Date(),
    };

    auditLog(`[NOTIFICATION] High-severity changes for ${idea.url}`);

    // Отправка email уведомления
    try {
      const { sendCustomEmail } = await import("../services/emailService.js");
      await sendCustomEmail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: notification.title,
        text: notification.message,
        html: `<h3>${notification.title}</h3><pre>${notification.message}</pre>`,
      });
      auditLog(`[EMAIL] Notification sent for ${idea.url}`);
    } catch (emailErr) {
      auditLog(`[EMAIL_ERROR] Failed to send email: ${emailErr.message}`);
    }

    console.log("📬 NOTIFICATION:", notification);

    return notification;
  } catch (error) {
    auditLog(
      `[ERROR] Failed to send notification for ${idea.url}: ${error.message}`,
    );
  }
}

// ============================================================================
// MAIN CRAWLER TASK
// ============================================================================

async function runCrawlerTask() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔄 HAORI VISION — Idea Crawler Started");
    console.log("=".repeat(70));

    auditLog("[START] Crawler task initiated");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/haorivision",
    );
    console.log("✅ Connected to MongoDB");

    // Find all ideas (or filter by status, date, etc.)
    const ideas = await Idea.find({
      status: { $in: ["active", "monitoring"] },
    }).sort({ lastCrawled: 1 }); // Oldest first

    console.log(`📊 Found ${ideas.length} ideas to crawl`);

    let updated = 0;
    let failed = 0;
    let unchanged = 0;

    for (const idea of ideas) {
      console.log(`\n🔍 Crawling: ${idea.url}`);

      // Rate limiting
      await sleep(RATE_LIMIT_DELAY);

      const result = await crawlIdea(idea);

      if (!result) {
        failed++;
        continue;
      }

      const { newData, changes, crawledAt } = result;

      if (changes.length > 0) {
        // Update idea
        idea.title = newData.title || idea.title;
        idea.description = newData.description || idea.description;
        idea.evidenceLevel = newData.evidenceLevel || idea.evidenceLevel;
        idea.certaintyLevel = newData.certaintyLevel || idea.certaintyLevel;
        idea.images = newData.images || idea.images;
        idea.lastCrawled = crawledAt;

        // Add to history
        idea.crawlHistory = idea.crawlHistory || [];
        idea.crawlHistory.push({
          date: crawledAt,
          changes: changes,
        });

        await idea.save();

        // Send notification for significant changes
        await sendChangeNotification(idea, changes);

        updated++;
        console.log(`✅ Updated (${changes.length} changes)`);
      } else {
        // No changes, just update lastCrawled
        idea.lastCrawled = crawledAt;
        await idea.save();

        unchanged++;
        console.log(`✓ No changes`);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ CRAWLER TASK COMPLETED");
    console.log("=".repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   Total ideas: ${ideas.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Failed: ${failed}`);
    console.log("=".repeat(70));

    auditLog(
      `[COMPLETE] Crawler task finished - Updated: ${updated}, Unchanged: ${unchanged}, Failed: ${failed}`,
    );
  } catch (error) {
    console.error("❌ Crawler task failed:", error);
    auditLog(`[FATAL] Crawler task failed: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed\n");
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(text) {
  if (!text) return "";

  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[^;]+;/g, "") // Remove HTML entities
    .trim()
    .substring(0, 1000); // Limit length
}

function sanitizeUrl(url) {
  if (!url) return "";

  try {
    // Make absolute URL if relative
    if (url.startsWith("//")) {
      url = "https:" + url;
    } else if (url.startsWith("/")) {
      // Need base URL - skip for now
      return "";
    }

    const urlObj = new URL(url);

    // Only allow http/https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return "";
    }

    return urlObj.href;
  } catch {
    return "";
  }
}

// ============================================================================
// SCHEDULER SETUP
// ============================================================================

// Schedule for 3:00 AM daily (0 3 * * *)
const CRON_SCHEDULE = "0 3 * * *";

console.log("🤖 HAORI VISION — Idea Crawler Scheduler");
console.log(`📅 Schedule: ${CRON_SCHEDULE} (3:00 AM daily)`);
console.log("📝 Audit log: " + AUDIT_LOG_PATH);
console.log("");

// For immediate testing, run once on startup
if (process.argv.includes("--run-now")) {
  console.log("🚀 Running crawler immediately (--run-now flag detected)\n");
  runCrawlerTask().then(() => {
    console.log("✅ Manual run completed. Exiting.");
    process.exit(0);
  });
} else {
  // Schedule cron job
  cron.schedule(CRON_SCHEDULE, () => {
    console.log("\n⏰ Scheduled task triggered at", new Date().toISOString());
    runCrawlerTask();
  });

  console.log("✅ Scheduler started. Waiting for next run...");
  console.log("💡 Use --run-now flag to run immediately for testing\n");
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down scheduler...");
  process.exit(0);
});

export default runCrawlerTask;
