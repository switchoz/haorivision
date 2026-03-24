import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ✨ LIGHT INTELLIGENCE REPORT SERVICE
 *
 * Generates "HAORI VISION — LIGHT INTELLIGENCE WEEKLY" PDF reports
 *
 * Tone: "Советник света и формы, хранитель чистоты бренда"
 * - Минималистичный
 * - Уверенный
 * - Эстетичный
 * - Вдохновляющий
 */

class LightIntelligenceReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, "../../data/reports");
    this.ensureDirectory();

    // Color palette (minimalist, UV-inspired)
    this.colors = {
      background: "#000000",
      text: "#F5F5F5",
      accent: "#FF10F0", // UV Pink
      secondary: "#00D4FF", // UV Cyan
      tertiary: "#39FF14", // UV Green
      subtle: "#2A2A2A",
    };
  }

  ensureDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * 📊 Calculate Haori Light Index
   * Показатель эмоционального влияния бренда (0-100)
   *
   * Факторы:
   * - Эмоциональная связь аудитории (30%)
   * - Визуальная чистота и эстетика (25%)
   * - UX и навигация (20%)
   * - Культурная релевантность (15%)
   * - Вирусный потенциал (10%)
   */
  calculateHaoriLightIndex(reportData) {
    const weights = {
      emotional: 0.3,
      visual: 0.25,
      ux: 0.2,
      cultural: 0.15,
      viral: 0.1,
    };

    // Extract scores from modules
    const scores = {
      emotional: this.extractEmotionalScore(
        reportData.modules.customerInsights,
      ),
      visual: this.extractVisualScore(reportData.modules.artisticPulse),
      ux: this.extractUXScore(reportData.modules.uxInspector),
      cultural: this.extractCulturalScore(reportData.modules.brandWatcher),
      viral: this.extractViralScore(reportData.modules.brandWatcher),
    };

    // Calculate weighted average
    const index = Object.keys(scores).reduce((total, key) => {
      return total + scores[key] * weights[key];
    }, 0);

    return {
      overall: Math.round(index),
      breakdown: scores,
      interpretation: this.interpretLightIndex(Math.round(index)),
      trend: this.calculateTrend(Math.round(index)),
    };
  }

  extractEmotionalScore(customerInsights) {
    // Mock - calculate based on sentiment, engagement, loyalty
    return 78; // 0-100
  }

  extractVisualScore(artisticPulse) {
    // Mock - calculate based on aesthetic consistency, visual impact
    return 85;
  }

  extractUXScore(uxInspector) {
    // Mock - calculate based on navigation, speed, accessibility
    return 72;
  }

  extractCulturalScore(brandWatcher) {
    // Mock - calculate based on trend alignment, cultural relevance
    return 81;
  }

  extractViralScore(brandWatcher) {
    // Mock - calculate based on shareability, hype potential
    return 68;
  }

  interpretLightIndex(index) {
    if (index >= 90)
      return "Исключительное эмоциональное влияние. Бренд сияет на максимуме.";
    if (index >= 80)
      return "Сильное эмоциональное влияние. Бренд находится в потоке света.";
    if (index >= 70)
      return "Хорошее эмоциональное влияние. Бренд освещает путь, есть пространство для роста.";
    if (index >= 60)
      return "Умеренное эмоциональное влияние. Бренд мерцает, требуется усиление.";
    return "Слабое эмоциональное влияние. Бренд нуждается в свете и форме.";
  }

  calculateTrend(currentIndex) {
    // Mock - compare with previous week
    const previousIndex = 73; // Load from history
    const change = currentIndex - previousIndex;

    if (change > 5)
      return { direction: "восходящий", symbol: "↑", change: `+${change}` };
    if (change < -5)
      return { direction: "нисходящий", symbol: "↓", change: `${change}` };
    return {
      direction: "стабильный",
      symbol: "→",
      change: change >= 0 ? `+${change}` : `${change}`,
    };
  }

  /**
   * 📄 Generate PDF Report
   */
  async generatePDFReport(reportData) {
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `Light_Intelligence_Weekly_${timestamp}.pdf`;
    const filepath = path.join(this.reportsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          bufferPages: true,
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Calculate Haori Light Index
        const lightIndex = this.calculateHaoriLightIndex(reportData);

        // === PAGE 1: COVER ===
        this.renderCoverPage(doc, reportData, lightIndex);

        // === PAGE 2: HAORI LIGHT INDEX ===
        doc.addPage();
        this.renderLightIndexPage(doc, lightIndex);

        // === PAGE 3: WEEKLY INSIGHTS ===
        doc.addPage();
        this.renderWeeklyInsightsPage(doc, reportData);

        // === PAGE 4: TRENDS & PATTERNS ===
        doc.addPage();
        this.renderTrendsPage(doc, reportData.modules.brandWatcher);

        // === PAGE 5: UX & EXPERIENCE ===
        doc.addPage();
        this.renderUXPage(doc, reportData.modules.uxInspector);

        // === PAGE 6: AUDIENCE EMOTIONS ===
        doc.addPage();
        this.renderEmotionsPage(doc, reportData.modules.customerInsights);

        // === PAGE 7: VISUAL AESTHETICS ===
        doc.addPage();
        this.renderAestheticsPage(doc, reportData.modules.artisticPulse);

        // === PAGE 8: SALES & CONVERSIONS ===
        doc.addPage();
        this.renderSalesPage(doc, reportData.modules.salesOptimizer);

        // === PAGE 9: RECOMMENDATIONS ===
        doc.addPage();
        this.renderRecommendationsPage(doc, reportData.executiveSummary);

        // === PAGE 10: CONTENT CALENDAR ===
        doc.addPage();
        this.renderContentCalendarPage(
          doc,
          reportData.modules.creativeScheduler,
        );

        // Finalize PDF
        doc.end();

        stream.on("finish", () => {
          console.log(`✨ PDF Report generated: ${filepath}`);
          resolve({
            success: true,
            filepath,
            filename,
            lightIndex,
          });
        });

        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  renderCoverPage(doc, reportData, lightIndex) {
    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#000000");

    // Title
    doc
      .fontSize(32)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("HAORI VISION", 60, 150, { align: "center" });

    // Subtitle with gradient effect (simulated)
    doc
      .fontSize(18)
      .fillColor("#FF10F0")
      .text("LIGHT INTELLIGENCE WEEKLY", 60, 200, { align: "center" });

    // Light Index Badge
    doc
      .fontSize(48)
      .fillColor("#00D4FF")
      .text(lightIndex.overall.toString(), 60, 280, { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#F5F5F5")
      .text("Haori Light Index", 60, 340, { align: "center" });

    // Trend indicator
    doc
      .fontSize(16)
      .fillColor(
        lightIndex.trend.direction === "восходящий"
          ? "#39FF14"
          : lightIndex.trend.direction === "нисходящий"
            ? "#FF10F0"
            : "#F5F5F5",
      )
      .text(`${lightIndex.trend.symbol} ${lightIndex.trend.change}`, 60, 370, {
        align: "center",
      });

    // Date
    const date = new Date(reportData.timestamp).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text(date, 60, 450, { align: "center" });

    // Footer quote
    doc
      .fontSize(10)
      .fillColor("#2A2A2A")
      .font("Helvetica-Oblique")
      .text(
        '"Советник света и формы, хранитель чистоты бренда"',
        60,
        doc.page.height - 100,
        {
          align: "center",
          width: doc.page.width - 120,
        },
      );
  }

  renderLightIndexPage(doc, lightIndex) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Haori Light Index", 60, 80);

    doc
      .fontSize(14)
      .fillColor("#2A2A2A")
      .font("Helvetica")
      .text("Показатель эмоционального влияния бренда", 60, 115);

    // Overall score
    doc
      .fontSize(72)
      .fillColor("#FF10F0")
      .text(lightIndex.overall.toString(), 60, 160);

    doc
      .fontSize(16)
      .fillColor("#F5F5F5")
      .text(lightIndex.interpretation, 60, 250, { width: 480 });

    // Breakdown
    doc.fontSize(18).fillColor("#00D4FF").text("Составляющие индекса", 60, 320);

    let yPos = 360;
    const breakdownLabels = {
      emotional: "Эмоциональная связь",
      visual: "Визуальная эстетика",
      ux: "UX & Навигация",
      cultural: "Культурная релевантность",
      viral: "Вирусный потенциал",
    };

    Object.entries(lightIndex.breakdown).forEach(([key, value]) => {
      doc
        .fontSize(12)
        .fillColor("#F5F5F5")
        .text(breakdownLabels[key], 60, yPos);

      doc
        .fontSize(12)
        .fillColor("#FF10F0")
        .text(value.toString(), 500, yPos, { align: "right" });

      // Progress bar
      const barWidth = (value / 100) * 400;
      doc
        .rect(60, yPos + 18, 400, 4)
        .fillColor("#2A2A2A")
        .fill();
      doc
        .rect(60, yPos + 18, barWidth, 4)
        .fillColor("#00D4FF")
        .fill();

      yPos += 50;
    });
  }

  renderWeeklyInsightsPage(doc, reportData) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Еженедельные инсайты", 60, 80);

    const summary = reportData.executiveSummary;

    // Top Opportunities
    doc.fontSize(16).fillColor("#39FF14").text("🎯 Возможности", 60, 140);

    summary.topOpportunities.slice(0, 3).forEach((opp, i) => {
      doc
        .fontSize(11)
        .fillColor("#F5F5F5")
        .text(`${i + 1}. ${opp.opportunity}`, 60, 170 + i * 30, { width: 480 });
    });

    // Top Threats
    doc.fontSize(16).fillColor("#FF10F0").text("⚠️ Угрозы", 60, 280);

    summary.topThreats.slice(0, 3).forEach((threat, i) => {
      doc
        .fontSize(11)
        .fillColor("#F5F5F5")
        .text(`${i + 1}. ${threat.threat}`, 60, 310 + i * 30, { width: 480 });
    });

    // Key Metrics
    doc.fontSize(16).fillColor("#00D4FF").text("📊 Ключевые метрики", 60, 420);

    doc
      .fontSize(11)
      .fillColor("#F5F5F5")
      .text(
        `Прогноз роста выручки: ${summary.businessImpact?.projectedRevenueGrowth || "N/A"}`,
        60,
        450,
      );

    doc.text(
      `Улучшение конверсии: ${summary.businessImpact?.conversionImprovement || "N/A"}`,
      60,
      470,
    );
  }

  renderTrendsPage(doc, brandWatcher) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Тренды и паттерны", 60, 80);

    if (!brandWatcher?.analysis) {
      doc.fontSize(12).fillColor("#2A2A2A").text("Данные не доступны", 60, 140);
      return;
    }

    // Key Trends
    doc.fontSize(16).fillColor("#FF10F0").text("Ключевые тренды", 60, 140);

    brandWatcher.analysis.keyTrends?.slice(0, 5).forEach((trend, i) => {
      doc
        .fontSize(11)
        .fillColor("#F5F5F5")
        .text(`• ${trend}`, 60, 170 + i * 25, { width: 480 });
    });
  }

  renderUXPage(doc, uxInspector) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("UX & Опыт", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("Анализ пользовательского опыта на сайте", 60, 115);

    // Mock UX scores
    doc.fontSize(16).fillColor("#00D4FF").text("Оценки UX", 60, 160);

    const uxScores = [
      { label: "Навигация", score: 85 },
      { label: "Скорость загрузки", score: 72 },
      { label: "Мобильная версия", score: 90 },
      { label: "Доступность", score: 78 },
    ];

    let yPos = 200;
    uxScores.forEach((item) => {
      doc.fontSize(11).fillColor("#F5F5F5").text(item.label, 60, yPos);
      doc
        .fontSize(11)
        .fillColor("#FF10F0")
        .text(item.score, 500, yPos, { align: "right" });

      const barWidth = (item.score / 100) * 400;
      doc
        .rect(60, yPos + 18, 400, 4)
        .fillColor("#2A2A2A")
        .fill();
      doc
        .rect(60, yPos + 18, barWidth, 4)
        .fillColor("#00D4FF")
        .fill();

      yPos += 50;
    });
  }

  renderEmotionsPage(doc, customerInsights) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Эмоции аудитории", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("Анализ эмоционального отклика клиентов", 60, 115);
  }

  renderAestheticsPage(doc, artisticPulse) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Визуальная эстетика", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("Оценка визуального языка бренда", 60, 115);
  }

  renderSalesPage(doc, salesOptimizer) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Продажи и конверсии", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("Анализ воронки продаж", 60, 115);
  }

  renderRecommendationsPage(doc, executiveSummary) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Рекомендации", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("Действия для усиления света бренда", 60, 115);

    if (!executiveSummary?.recommendations) {
      return;
    }

    let yPos = 160;
    executiveSummary.recommendations.slice(0, 6).forEach((rec, i) => {
      doc
        .fontSize(11)
        .fillColor("#FF10F0")
        .text(
          `${i + 1}. ${rec.category?.toUpperCase() || "GENERAL"}`,
          60,
          yPos,
        );

      doc
        .fontSize(10)
        .fillColor("#F5F5F5")
        .text(rec.action || rec, 60, yPos + 15, { width: 480 });

      yPos += 60;
    });
  }

  renderContentCalendarPage(doc, creativeScheduler) {
    doc
      .fontSize(24)
      .fillColor("#F5F5F5")
      .font("Helvetica-Bold")
      .text("Контент-календарь", 60, 80);

    doc
      .fontSize(12)
      .fillColor("#2A2A2A")
      .text("14-дневный план публикаций", 60, 115);

    if (!creativeScheduler?.contentCalendar) {
      return;
    }

    let yPos = 160;
    creativeScheduler.contentCalendar.slice(0, 7).forEach((item, i) => {
      doc
        .fontSize(10)
        .fillColor("#00D4FF")
        .text(`День ${i + 1} • ${item.platform || "Multi-platform"}`, 60, yPos);

      doc
        .fontSize(9)
        .fillColor("#F5F5F5")
        .text(
          item.content || item.description || "No description",
          60,
          yPos + 15,
          { width: 480 },
        );

      yPos += 45;
    });
  }
}

export default new LightIntelligenceReportService();
