import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Report Service
 * Генерация Light Impact Report в PDF с инфографикой
 */

class PDFReportService {
  /**
   * Генерировать PDF отчёт
   */
  async generateLightImpactReport(report) {
    try {
      const fileName = `light-impact-report-${report.weekStart.toISOString().split("T")[0]}.pdf`;
      const filePath = path.join(__dirname, "../../data/reports", fileName);

      // Ensure reports directory exists
      const reportsDir = path.join(__dirname, "../../data/reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Create PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Build PDF
      this.buildCoverPage(doc, report);
      this.buildExecutiveSummary(doc, report);
      this.buildSalesSection(doc, report);
      this.buildTrafficSection(doc, report);
      this.buildSocialSection(doc, report);
      this.buildSentimentSection(doc, report);
      this.buildInsightsSection(doc, report);
      this.buildRecommendationsSection(doc, report);

      // Finalize
      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      console.log(`✅ PDF report generated: ${fileName}`);

      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        url: `/reports/${fileName}`,
      };
    } catch (error) {
      console.error("Generate PDF error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cover Page
   */
  buildCoverPage(doc, report) {
    // Purple gradient background (simulated with rectangles)
    doc.rect(0, 0, 595, 842).fill("#0a0a0a");

    // Title
    doc
      .fontSize(48)
      .fillColor("#a78bfa")
      .font("Helvetica-Bold")
      .text("✨ Light Impact Report", 50, 250, { align: "center" });

    // Subtitle
    doc
      .fontSize(20)
      .fillColor("#c4b5fd")
      .font("Helvetica")
      .text("HAORI VISION Weekly Analytics", 50, 320, { align: "center" });

    // Date range
    const startDate = report.weekStart.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const endDate = report.weekEnd.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(16)
      .fillColor("#9ca3af")
      .text(`${startDate} — ${endDate}`, 50, 380, { align: "center" });

    // Decorative element
    doc
      .fontSize(80)
      .fillColor("#7c3aed")
      .text("◆", 50, 450, { align: "center" });

    doc.addPage();
  }

  /**
   * Executive Summary
   */
  buildExecutiveSummary(doc, report) {
    this.addSectionHeader(doc, "Executive Summary");

    const metrics = report.metrics;

    // Key metrics boxes
    const y = doc.y + 20;
    const boxWidth = 120;
    const boxHeight = 80;
    const gap = 15;

    // Sales
    this.drawMetricBox(
      doc,
      50,
      y,
      boxWidth,
      boxHeight,
      "$" + (metrics.sales?.total || 0).toLocaleString(),
      "Total Sales",
      "#a78bfa",
    );

    // Traffic
    this.drawMetricBox(
      doc,
      50 + boxWidth + gap,
      y,
      boxWidth,
      boxHeight,
      (metrics.traffic?.uniqueVisitors || 0).toLocaleString(),
      "Unique Visitors",
      "#7c3aed",
    );

    // Conversions
    this.drawMetricBox(
      doc,
      50 + (boxWidth + gap) * 2,
      y,
      boxWidth,
      boxHeight,
      metrics.conversions?.total || 0,
      "Conversions",
      "#6d28d9",
    );

    // Sentiment
    this.drawMetricBox(
      doc,
      50 + (boxWidth + gap) * 3,
      y,
      boxWidth,
      boxHeight,
      (
        (metrics.sentiment?.distribution?.positive /
          (metrics.sentiment?.totalReviews || 1)) *
        100
      ).toFixed(0) + "%",
      "Positive Reviews",
      "#5b21b6",
    );

    doc.moveDown(8);
  }

  /**
   * Sales Section
   */
  buildSalesSection(doc, report) {
    this.addSectionHeader(doc, "💰 Sales Analytics");

    const sales = report.metrics.sales;

    if (sales) {
      doc
        .fontSize(12)
        .fillColor("#ffffff")
        .text(
          `Total Revenue: $${sales.total.toLocaleString()}`,
          70,
          doc.y + 10,
        );

      doc.text(`Total Orders: ${sales.count}`, 70, doc.y + 5);

      // By Collection
      if (sales.byCollection && Object.keys(sales.byCollection).length > 0) {
        doc.moveDown(1);
        doc.fontSize(14).fillColor("#a78bfa").text("By Collection:", 70);

        Object.entries(sales.byCollection).forEach(([collection, amount]) => {
          const percentage = ((amount / sales.total) * 100).toFixed(0);
          doc
            .fontSize(11)
            .fillColor("#ffffff")
            .text(
              `  ${collection}: $${amount.toLocaleString()} (${percentage}%)`,
              70,
              doc.y + 5,
            );
        });
      }

      // By Country
      if (sales.byCountry && Object.keys(sales.byCountry).length > 0) {
        doc.moveDown(1);
        doc.fontSize(14).fillColor("#a78bfa").text("By Country:", 70);

        Object.entries(sales.byCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([country, amount]) => {
            const percentage = ((amount / sales.total) * 100).toFixed(0);
            doc
              .fontSize(11)
              .fillColor("#ffffff")
              .text(
                `  ${country}: $${amount.toLocaleString()} (${percentage}%)`,
                70,
                doc.y + 5,
              );
          });
      }
    }

    doc.moveDown(2);
  }

  /**
   * Traffic Section
   */
  buildTrafficSection(doc, report) {
    this.addSectionHeader(doc, "📊 Website Traffic");

    const traffic = report.metrics.traffic;

    if (traffic) {
      doc.fontSize(12).fillColor("#ffffff");

      const metrics = [
        `Total Page Views: ${traffic.totalViews.toLocaleString()}`,
        `Unique Visitors: ${traffic.uniqueVisitors.toLocaleString()}`,
        `Avg Time on Site: ${Math.round(traffic.avgTimeOnSite / 60)} min ${traffic.avgTimeOnSite % 60} sec`,
        `Bounce Rate: ${traffic.bounceRate}%`,
      ];

      metrics.forEach((metric) => {
        doc.text(`  ${metric}`, 70, doc.y + 5);
      });

      // Top pages
      if (traffic.topPages && traffic.topPages.length > 0) {
        doc.moveDown(1);
        doc.fontSize(14).fillColor("#a78bfa").text("Top Pages:", 70);

        traffic.topPages.slice(0, 5).forEach((page, i) => {
          doc
            .fontSize(11)
            .fillColor("#ffffff")
            .text(
              `  ${i + 1}. ${page.page} (${page.views} views)`,
              70,
              doc.y + 5,
            );
        });
      }
    }

    doc.moveDown(2);
  }

  /**
   * Social Media Section
   */
  buildSocialSection(doc, report) {
    this.addSectionHeader(doc, "📱 Social Media Performance");

    const social = report.metrics.social;

    if (social) {
      // TikTok
      doc.fontSize(14).fillColor("#a78bfa").text("TikTok:", 70);
      doc.fontSize(11).fillColor("#ffffff");
      doc.text(
        `  Views: ${social.tiktok.views.toLocaleString()}`,
        70,
        doc.y + 5,
      );
      doc.text(
        `  Likes: ${social.tiktok.likes.toLocaleString()}`,
        70,
        doc.y + 5,
      );
      doc.text(
        `  Shares: ${social.tiktok.shares.toLocaleString()}`,
        70,
        doc.y + 5,
      );
      doc.text(
        `  Cart Adds: ${social.tiktok.cartAdds.toLocaleString()}`,
        70,
        doc.y + 5,
      );

      doc.moveDown(1);

      // Instagram
      doc.fontSize(14).fillColor("#a78bfa").text("Instagram:", 70);
      doc.fontSize(11).fillColor("#ffffff");
      doc.text(
        `  Reach: ${social.instagram.reach.toLocaleString()}`,
        70,
        doc.y + 5,
      );
      doc.text(
        `  Engagement: ${social.instagram.engagement.toLocaleString()}`,
        70,
        doc.y + 5,
      );
      doc.text(
        `  Profile Visits: ${social.instagram.profileVisits.toLocaleString()}`,
        70,
        doc.y + 5,
      );
    }

    doc.moveDown(2);
  }

  /**
   * Sentiment Section
   */
  buildSentimentSection(doc, report) {
    this.addSectionHeader(doc, "💬 Customer Sentiment");

    const sentiment = report.metrics.sentiment;

    if (sentiment) {
      doc.fontSize(12).fillColor("#ffffff");

      doc.text(`Total Reviews: ${sentiment.totalReviews}`, 70, doc.y + 5);
      doc.text(`Average Score: ${sentiment.avgScore}`, 70, doc.y + 5);

      doc.moveDown(1);

      // Distribution
      const total = sentiment.totalReviews;
      if (total > 0) {
        const positive = (
          (sentiment.distribution.positive / total) *
          100
        ).toFixed(0);
        const neutral = (
          (sentiment.distribution.neutral / total) *
          100
        ).toFixed(0);
        const negative = (
          (sentiment.distribution.negative / total) *
          100
        ).toFixed(0);

        doc.fontSize(11);
        doc
          .fillColor("#10b981")
          .text(
            `  Positive: ${sentiment.distribution.positive} (${positive}%)`,
            70,
            doc.y + 5,
          );
        doc
          .fillColor("#6b7280")
          .text(
            `  Neutral: ${sentiment.distribution.neutral} (${neutral}%)`,
            70,
            doc.y + 5,
          );
        doc
          .fillColor("#ef4444")
          .text(
            `  Negative: ${sentiment.distribution.negative} (${negative}%)`,
            70,
            doc.y + 5,
          );
      }
    }

    doc.moveDown(2);
  }

  /**
   * Insights Section
   */
  buildInsightsSection(doc, report) {
    this.addSectionHeader(doc, "💡 Key Insights");

    if (report.insights && report.insights.length > 0) {
      doc.fontSize(11).fillColor("#ffffff");

      report.insights.forEach((insight) => {
        doc.text(`  • ${insight}`, 70, doc.y + 8);
      });
    } else {
      doc
        .fontSize(11)
        .fillColor("#6b7280")
        .text("No significant insights this week.", 70, doc.y + 5);
    }

    doc.moveDown(2);
  }

  /**
   * Recommendations Section
   */
  buildRecommendationsSection(doc, report) {
    this.addSectionHeader(doc, "🎯 Recommendations");

    if (report.recommendations && report.recommendations.length > 0) {
      doc.fontSize(11).fillColor("#ffffff");

      report.recommendations.forEach((rec) => {
        doc.text(`  • ${rec}`, 70, doc.y + 8);
      });
    } else {
      doc
        .fontSize(11)
        .fillColor("#6b7280")
        .text("Keep up the great work!", 70, doc.y + 5);
    }

    doc.moveDown(2);
  }

  /**
   * Helper: Add section header
   */
  addSectionHeader(doc, title) {
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .fontSize(18)
      .fillColor("#a78bfa")
      .font("Helvetica-Bold")
      .text(title, 50, doc.y + 10);

    doc.moveDown(0.5);
    doc.font("Helvetica");
  }

  /**
   * Helper: Draw metric box
   */
  drawMetricBox(doc, x, y, width, height, value, label, color) {
    // Box background
    doc
      .rect(x, y, width, height)
      .fillAndStroke(color, color)
      .opacity(0.2)
      .fillOpacity(1);

    // Value
    doc
      .fontSize(24)
      .fillColor("#ffffff")
      .text(value, x, y + 20, { width: width, align: "center" });

    // Label
    doc
      .fontSize(10)
      .fillColor("#9ca3af")
      .text(label, x, y + 55, { width: width, align: "center" });
  }
}

export default new PDFReportService();
