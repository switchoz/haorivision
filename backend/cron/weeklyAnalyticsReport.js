import cron from "node-cron";
import growthAnalyticsService from "../services/growthAnalyticsService.js";
import pdfReportService from "../services/pdfReportService.js";
import notionService from "../services/notionService.js";
import emailService from "../services/emailService.js";

/**
 * Weekly Analytics Report Cron Job
 * Запускается каждый понедельник в 9:00
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@haorivision.com";

async function generateAndSendWeeklyReport() {
  try {
    console.log("🔄 Starting weekly analytics report generation...");

    // 1. Generate report data
    const reportResult = await growthAnalyticsService.createWeeklyReport();

    if (!reportResult.success) {
      console.error("Failed to generate weekly report:", reportResult.error);
      return;
    }

    const report = reportResult.report;

    console.log(
      `✅ Report data generated for ${report.weekStart.toLocaleDateString()} - ${report.weekEnd.toLocaleDateString()}`,
    );

    // 2. Generate PDF
    const pdfResult = await pdfReportService.generateLightImpactReport(report);

    if (pdfResult.success) {
      // Update report with PDF URL
      report.pdfUrl = pdfResult.url;
      await report.save();

      console.log(`✅ PDF generated: ${pdfResult.fileName}`);
    } else {
      console.error("Failed to generate PDF:", pdfResult.error);
    }

    // 3. Send to Notion (if configured)
    if (process.env.NOTION_API_KEY) {
      try {
        await notionService.createWeeklyReportPage({
          weekStart: report.weekStart,
          weekEnd: report.weekEnd,
          metrics: report.metrics,
          insights: report.insights,
          recommendations: report.recommendations,
        });

        console.log("✅ Report sent to Notion");
      } catch (error) {
        console.error("Failed to send to Notion:", error);
      }
    }

    // 4. Send email to admin
    await sendReportEmail(report, pdfResult);

    console.log("✅ Weekly Analytics Report complete!");
  } catch (error) {
    console.error("Weekly report error:", error);
  }
}

/**
 * Send report email to admin
 */
async function sendReportEmail(report, pdfResult) {
  try {
    const metrics = report.metrics;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 40px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(167, 139, 250, 0.3);
          }
          h1 {
            color: #a78bfa;
            font-size: 32px;
            margin-bottom: 20px;
          }
          .metric-box {
            background: rgba(167, 139, 250, 0.1);
            border-left: 4px solid #a78bfa;
            padding: 15px;
            margin: 15px 0;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
          }
          .metric-label {
            font-size: 14px;
            color: #9ca3af;
            text-transform: uppercase;
          }
          .insights {
            background: rgba(124, 58, 237, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .insight {
            margin: 10px 0;
            padding-left: 20px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✨ Light Impact Report</h1>
          <p style="color: #9ca3af;">
            ${report.weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} —
            ${report.weekEnd.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <h2 style="color: #a78bfa; font-size: 24px; margin-top: 30px;">Ключевые метрики</h2>

          <div class="metric-box">
            <div class="metric-label">Total Sales</div>
            <div class="metric-value">$${(metrics.sales?.total || 0).toLocaleString()}</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Unique Visitors</div>
            <div class="metric-value">${(metrics.traffic?.uniqueVisitors || 0).toLocaleString()}</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Conversions</div>
            <div class="metric-value">${metrics.conversions?.total || 0} (${metrics.conversions?.rate || 0}%)</div>
          </div>

          <div class="metric-box">
            <div class="metric-label">Customer Sentiment</div>
            <div class="metric-value">
              ${((metrics.sentiment?.distribution?.positive / (metrics.sentiment?.totalReviews || 1)) * 100).toFixed(0)}% Positive
            </div>
          </div>

          <h2 style="color: #a78bfa; font-size: 24px; margin-top: 30px;">💡 Insights</h2>
          <div class="insights">
            ${report.insights.map((insight) => `<div class="insight">• ${insight}</div>`).join("")}
          </div>

          <h2 style="color: #a78bfa; font-size: 24px; margin-top: 30px;">🎯 Recommendations</h2>
          <div class="insights">
            ${report.recommendations
              .slice(0, 5)
              .map((rec) => `<div class="insight">• ${rec}</div>`)
              .join("")}
          </div>

          ${
            pdfResult.success
              ? `
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://haorivision.com${pdfResult.url}" class="btn">
                📄 Download Full PDF Report
              </a>
            </p>
          `
              : ""
          }

          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px;">
            HAORI VISION Growth Analytics<br/>
            Automatically generated by Light Impact Report system
          </p>
        </div>
      </body>
      </html>
    `;

    await emailService.sendCustomEmail(
      ADMIN_EMAIL,
      `✨ Light Impact Report — Week of ${report.weekStart.toLocaleDateString()}`,
      html,
    );

    console.log(`✅ Report email sent to ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Send report email error:", error);
  }
}

/**
 * Schedule cron job
 * Runs every Monday at 9:00 AM
 */
export function scheduleWeeklyReport() {
  // Cron format: minute hour day-of-month month day-of-week
  // '0 9 * * 1' = Every Monday at 9:00 AM
  cron.schedule("0 9 * * 1", () => {
    console.log("📊 Weekly Analytics Report cron job triggered");
    generateAndSendWeeklyReport();
  });

  console.log(
    "✅ Weekly Analytics Report cron job scheduled (Every Monday at 9:00 AM)",
  );
}

// Manual trigger for testing
export async function triggerWeeklyReport() {
  console.log("🧪 Manually triggering weekly report...");
  await generateAndSendWeeklyReport();
}

export default { scheduleWeeklyReport, triggerWeeklyReport };
