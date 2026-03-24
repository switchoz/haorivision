import cron from "node-cron";
import analyticsService from "../services/analytics/analyticsService.js";
import notionService from "../services/notionService.js";
import emailService from "../services/emailService.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Weekly "Glow Pulse" Report Automation
 * Запускается каждый понедельник в 09:00
 */

class WeeklyReportScheduler {
  constructor() {
    this.cronExpression = "0 9 * * 1"; // Every Monday at 9:00 AM
    this.isRunning = false;
  }

  /**
   * Запустить планировщик
   */
  start() {
    console.log('\n📅 Weekly "Glow Pulse" report scheduler started');
    console.log(`⏰ Schedule: Every Monday at 9:00 AM\n`);

    // Запланировать автоматический отчёт
    cron.schedule(this.cronExpression, async () => {
      await this.generateAndSendReport();
    });

    // Также можно запустить вручную через endpoint
    this.setupManualTrigger();
  }

  /**
   * Генерация и отправка отчёта
   */
  async generateAndSendReport() {
    if (this.isRunning) {
      console.log("⏳ Report generation already in progress...");
      return;
    }

    this.isRunning = true;

    try {
      console.log("\n" + "=".repeat(60));
      console.log("✨ GLOW PULSE — WEEKLY REPORT GENERATION");
      console.log("=".repeat(60) + "\n");

      // Step 1: Синхронизировать статистику со всех платформ
      console.log("Step 1/4: Syncing analytics from TikTok & Instagram...");
      const syncResult = await analyticsService.syncAllPostsAnalytics();

      if (!syncResult.success) {
        throw new Error("Analytics sync failed");
      }

      console.log(`✓ Synced ${syncResult.synced}/${syncResult.total} posts\n`);

      // Step 2: Получить недельную статистику
      console.log("Step 2/4: Calculating weekly stats...");
      const weeklyStats = await analyticsService.getWeeklyStats();

      if (!weeklyStats.success) {
        throw new Error("Stats calculation failed");
      }

      console.log(`✓ Analyzed ${weeklyStats.stats.totalPosts} posts\n`);

      // Step 3: Экспортировать в Notion
      console.log("Step 3/4: Exporting to Notion...");
      const notionResult =
        await notionService.createGlowPulseReport(weeklyStats);

      if (!notionResult.success) {
        console.log("⚠️  Notion export failed, continuing...");
      } else {
        console.log(`✓ Notion page created: ${notionResult.url}\n`);
      }

      // Step 4: Отправить email summary администраторам
      console.log("Step 4/4: Sending email summary...");
      const emailResult = await this.sendEmailSummary(
        weeklyStats,
        notionResult.url,
      );

      if (emailResult.success) {
        console.log("✓ Email sent successfully\n");
      }

      console.log("=".repeat(60));
      console.log("✅ GLOW PULSE REPORT COMPLETED");
      console.log("=".repeat(60) + "\n");

      this.isRunning = false;

      return {
        success: true,
        stats: weeklyStats.stats,
        notionUrl: notionResult.url,
      };
    } catch (error) {
      console.error("\n❌ Report generation error:", error.message);
      this.isRunning = false;

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Отправить email с кратким резюме
   */
  async sendEmailSummary(weeklyStats, notionUrl) {
    try {
      const stats = weeklyStats.stats;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #ffffff;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 40px;
      border: 1px solid rgba(167, 139, 250, 0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: rgba(167, 139, 250, 0.1);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .platform-section {
      margin: 30px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
    }
    .platform-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-label {
      color: #d1d5db;
    }
    .metric-value {
      font-weight: 600;
      color: #a78bfa;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
      color: white;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 10px;
      font-weight: 600;
      margin-top: 30px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">✨ Glow Pulse</div>
      <div class="subtitle">Weekly Social Media Report — ${this.formatDateRange(stats.period.start, stats.period.end)}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalPosts}</div>
        <div class="stat-label">Posts Published</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.formatNumber(stats.byPlatform.tiktok.totalViews + stats.byPlatform.instagram.totalReach)}</div>
        <div class="stat-label">Total Reach</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.formatNumber(stats.byPlatform.tiktok.totalLikes + stats.byPlatform.instagram.totalEngagement)}</div>
        <div class="stat-label">Total Engagement</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.byPlatform.tiktok.totalAddToCart + stats.byPlatform.instagram.totalProductClicks}</div>
        <div class="stat-label">Conversions</div>
      </div>
    </div>

    <div class="platform-section">
      <div class="platform-title">🎵 TikTok</div>
      <div class="metric">
        <span class="metric-label">Total Views</span>
        <span class="metric-value">${this.formatNumber(stats.byPlatform.tiktok.totalViews)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Total Likes</span>
        <span class="metric-value">${this.formatNumber(stats.byPlatform.tiktok.totalLikes)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Add to Cart</span>
        <span class="metric-value">${stats.byPlatform.tiktok.totalAddToCart}</span>
      </div>
      ${
        stats.byPlatform.tiktok.engagementRate
          ? `
      <div class="metric">
        <span class="metric-label">Engagement Rate</span>
        <span class="metric-value">${stats.byPlatform.tiktok.engagementRate}%</span>
      </div>
      `
          : ""
      }
    </div>

    <div class="platform-section">
      <div class="platform-title">📸 Instagram</div>
      <div class="metric">
        <span class="metric-label">Total Reach</span>
        <span class="metric-value">${this.formatNumber(stats.byPlatform.instagram.totalReach)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Total Engagement</span>
        <span class="metric-value">${this.formatNumber(stats.byPlatform.instagram.totalEngagement)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Product Clicks</span>
        <span class="metric-value">${stats.byPlatform.instagram.totalProductClicks}</span>
      </div>
      ${
        stats.byPlatform.instagram.engagementRate
          ? `
      <div class="metric">
        <span class="metric-label">Engagement Rate</span>
        <span class="metric-value">${stats.byPlatform.instagram.engagementRate}%</span>
      </div>
      `
          : ""
      }
    </div>

    ${
      notionUrl
        ? `
    <div style="text-align: center;">
      <a href="${notionUrl}" class="button">📊 View Full Report in Notion</a>
    </div>
    `
        : ""
    }

    <div class="footer">
      HAORI VISION — Automated Social Media Analytics<br>
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
      `.trim();

      // Отправить email администраторам
      const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

      if (adminEmails.length === 0) {
        console.log("⚠️  No admin emails configured");
        return { success: false };
      }

      for (const email of adminEmails) {
        await emailService.sendCustomEmail(
          email.trim(),
          "✨ Glow Pulse — Weekly Social Media Report",
          emailHtml,
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Email send error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Настроить ручной триггер через API endpoint
   */
  setupManualTrigger() {
    // Будет добавлен endpoint в server.js:
    // GET /api/admin/trigger-weekly-report
  }

  /**
   * Форматировать диапазон дат
   */
  formatDateRange(start, end) {
    const options = { month: "short", day: "numeric" };
    const startStr = new Date(start).toLocaleDateString("en-US", options);
    const endStr = new Date(end).toLocaleDateString("en-US", options);
    return `${startStr} — ${endStr}`;
  }

  /**
   * Форматировать число
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

const scheduler = new WeeklyReportScheduler();

// Если запущен напрямую, сгенерировать отчёт сразу
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 Running report generation manually...\n");
  scheduler.generateAndSendReport().then((result) => {
    if (result.success) {
      console.log("Report generation completed successfully");
      process.exit(0);
    } else {
      console.error("Report generation failed");
      process.exit(1);
    }
  });
}

export default scheduler;
