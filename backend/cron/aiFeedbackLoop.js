import cron from "node-cron";
import aiFeedbackLoopService from "../services/aiFeedbackLoopService.js";

/**
 * AI Feedback Loop Cron Job
 * Runs every Sunday at 3am
 */

// Schedule: Every Sunday at 3:00 AM
cron.schedule("0 3 * * 0", async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧠 AI FEEDBACK LOOP: Starting weekly cycle...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const result = await aiFeedbackLoopService.runWeeklyFeedbackLoop();

    if (result.success) {
      console.log("✅ AI Feedback Loop completed successfully");
      console.log(
        `📊 Haori Light Index: ${result.lightIndex.current}/100 (${result.lightIndex.grade})`,
      );
      console.log(
        `⚡ Applied ${result.summary.improvements.applied} improvements`,
      );
      console.log(`📅 Next run: ${result.nextRun.toLocaleString()}`);
    } else {
      console.error("❌ AI Feedback Loop failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Cron job error:", error);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});

// Log cron job registration
console.log("✅ AI Feedback Loop cron job registered (Every Sunday 3am)");

// For testing: Run immediately on startup (comment out in production)
// setTimeout(async () => {
//   console.log('🧪 Test run: AI Feedback Loop');
//   await aiFeedbackLoopService.runWeeklyFeedbackLoop();
// }, 5000);
