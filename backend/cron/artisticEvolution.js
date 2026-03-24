import cron from "node-cron";
import artisticEvolutionService from "../services/artisticEvolutionService.js";

/**
 * 🎨 ARTISTIC EVOLUTION CRON JOB
 *
 * Schedule: 1st day of each month at 03:33 AM
 * Purpose: Run autonomous creative evolution for new collection concepts
 */

// Schedule: 1st day of month at 3:33 AM
cron.schedule("33 3 1 * *", async () => {
  console.log("\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[◆] ARTISTIC EVOLUTION: Monthly cycle starting...");
  console.log(`[○] Time: ${new Date().toLocaleString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const result = await artisticEvolutionService.runMonthlyEvolutionCycle();

    if (result.success) {
      console.log("\n[✓] Artistic Evolution cycle completed successfully");
      console.log(`[◇] Iteration: ${result.report.iteration}`);
      console.log(`[○] Next run: ${result.nextRun.toLocaleString()}`);

      const concepts = result.report.modules.conceptGenerator.concepts;
      const evaluation = result.report.modules.evaluation;

      console.log(`\n[▸] Concepts generated: ${concepts.length}`);
      console.log(`[!] Top concept: ${evaluation.topConcept}`);
      console.log(
        `[↑] Ready for publication: ${evaluation.readyForPublication.length}`,
      );
    } else {
      console.error("\n[✗] Artistic Evolution cycle failed:", result.error);
    }
  } catch (error) {
    console.error("\n[✗] Cron job error:", error);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});

// Log cron job registration
console.log(
  "[✓] Artistic Evolution cron job registered (1st of month 03:33 AM)",
);
console.log(`    Next run: ${getNextFirstOfMonth().toLocaleString()}`);

function getNextFirstOfMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 3, 33, 0, 0);
  return next;
}

// For testing: Run immediately on startup (comment out in production)
// setTimeout(async () => {
//   console.log('🧪 Test run: Artistic Evolution');
//   await artisticEvolutionService.runMonthlyEvolutionCycle();
// }, 5000);
