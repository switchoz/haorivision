import cron from "node-cron";
import telegramBotService from "../services/telegramBotService.js";

/**
 * Telegram Auto-Post Cron Jobs
 *
 * 1. Автопост — 2 раза в день (10:00 и 19:00 МСК)
 * 2. Публикация запланированных постов — каждые 5 минут
 */

// Автопост утром в 10:00 (МСК = UTC+3, значит 7:00 UTC)
cron.schedule("0 7 * * *", async () => {
  console.log("[Telegram] Morning auto-post...");

  try {
    const post = await telegramBotService.autoPost();
    console.log(
      `[Telegram] Morning post sent: [${post.type}] ${post.text.substring(0, 60)}...`,
    );
  } catch (error) {
    console.error("[Telegram] Morning auto-post failed:", error.message);
  }
});

// Автопост вечером в 19:00 (16:00 UTC)
cron.schedule("0 16 * * *", async () => {
  console.log("[Telegram] Evening auto-post...");

  try {
    const post = await telegramBotService.autoPost();
    console.log(
      `[Telegram] Evening post sent: [${post.type}] ${post.text.substring(0, 60)}...`,
    );
  } catch (error) {
    console.error("[Telegram] Evening auto-post failed:", error.message);
  }
});

// Публикация запланированных постов — каждые 5 минут
cron.schedule("*/5 * * * *", async () => {
  try {
    const results = await telegramBotService.publishScheduled();
    if (results.length > 0) {
      console.log(`[Telegram] Published ${results.length} scheduled post(s)`);
    }
  } catch (error) {
    console.error("[Telegram] Scheduled publish failed:", error.message);
  }
});

console.log("[Telegram] Auto-post cron jobs initialized");
console.log("   Morning post: 10:00 MSK daily");
console.log("   Evening post: 19:00 MSK daily");
console.log("   Scheduled check: every 5 minutes");
