import cron from "node-cron";
import aiDirectorService from "../services/aiDirectorService.js";

/**
 * 🤖 AI DIRECTOR CRON JOB
 *
 * Schedule: Every Sunday at 03:33 AM
 * Purpose: Run autonomous creative director analysis
 */

// Schedule: Every Sunday at 3:33 AM
cron.schedule("33 3 * * 0", async () => {
  console.log("\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[△] AI DIRECTOR: Autonomous cycle starting...");
  console.log(`[○] Time: ${new Date().toLocaleString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const result = await aiDirectorService.runWeeklyDirectorCycle();

    if (result.success) {
      console.log("\n[✓] AI Director cycle completed successfully");
      console.log(`[◇] Report generated: ${result.report.iteration}`);
      console.log(`[○] Next run: ${result.nextRun.toLocaleString()}`);

      const summary = result.report.executiveSummary;
      console.log(
        `\n[▸] Top Opportunity: ${summary.topOpportunities[0]?.opportunity}`,
      );
      console.log(`[!] Top Threat: ${summary.topThreats[0]?.threat}`);
      console.log(
        `[↑] Projected Revenue Growth: ${summary.businessImpact?.projectedRevenueGrowth}`,
      );
    } else {
      console.error("\n[✗] AI Director cycle failed:", result.error);
    }
  } catch (error) {
    console.error("\n[✗] Cron job error:", error);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});

// Log cron job registration
console.log("[✓] AI Director cron job registered (Every Sunday 03:33 AM)");
console.log(`    Next run: ${getNextSunday3am().toLocaleString()}`);

function getNextSunday3am() {
  const next = new Date();
  next.setDate(next.getDate() + ((7 - next.getDay()) % 7 || 7));
  next.setHours(3, 33, 0, 0);
  return next;
}

// For testing: Run immediately on startup (comment out in production)
// setTimeout(async () => {
//   console.log('🧪 Test run: AI Director');
//   await aiDirectorService.runWeeklyDirectorCycle();
// }, 5000);
