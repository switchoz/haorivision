import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🎨 ARTISTIC EVOLUTION REPORT SERVICE
 *
 * Генерирует PDF-отчёты "Artistic Evolution Report"
 */
class ArtisticEvolutionReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, "../../data/reports");
    this.fontsDir = path.join(__dirname, "../../assets/fonts");

    // HAORI VISION Colors
    this.colors = {
      background: "#000000",
      text: "#F5F5F5",
      primary: "#FF10F0", // UV Pink
      secondary: "#00D4FF", // UV Cyan
      tertiary: "#39FF14", // UV Green
      subtle: "#2A2A2A",
      gray: "#888888",
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Главный метод генерации PDF
   */
  async generatePDFReport(evolutionData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `Artistic_Evolution_Report_${timestamp}.pdf`;
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

        // Generate pages
        this.renderCoverPage(doc, evolutionData);
        this.renderExecutiveSummary(doc, evolutionData);
        this.renderTrendAnalysis(doc, evolutionData);
        this.renderConceptsOverview(doc, evolutionData);

        // Individual concept pages
        evolutionData.modules.conceptGenerator.concepts.forEach(
          (concept, index) => {
            this.renderConceptDetail(
              doc,
              concept,
              evolutionData.modules.evaluation.evaluations[index],
              index + 1,
            );
          },
        );

        this.renderVisualExamples(doc, evolutionData);
        this.renderDemandForecast(doc, evolutionData);
        this.renderVisualDirections(doc, evolutionData);
        this.renderEvaluationScores(doc, evolutionData);
        this.renderStyleAndTone(doc, evolutionData);
        this.renderRecommendations(doc, evolutionData);
        this.renderNextSteps(doc, evolutionData);

        doc.end();

        stream.on("finish", () => {
          console.log(`[✓] PDF Report generated: ${filename}`);
          resolve({
            success: true,
            filename,
            filepath,
            size: fs.statSync(filepath).size,
          });
        });

        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * PAGE 1: Cover
   */
  renderCoverPage(doc, data) {
    const { background, text, primary, secondary } = this.colors;

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(background);

    // Top accent line
    doc.rect(0, 0, doc.page.width, 3).fill(primary);

    // Title
    doc
      .fontSize(42)
      .fillColor(text)
      .font("Helvetica-Bold")
      .text("ARTISTIC EVOLUTION", 60, 180, { align: "left" });

    doc
      .fontSize(24)
      .fillColor(primary)
      .text("Monthly Report", 60, 240, { align: "left" });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor(secondary)
      .font("Helvetica")
      .text("New Visual & Conceptual Directions", 60, 290, { align: "left" });

    // Month & Iteration
    const month = new Date(data.timestamp).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
    });

    doc.fontSize(16).fillColor(text).text(`${month}`, 60, 350);

    doc
      .fontSize(12)
      .fillColor(this.colors.gray)
      .text(`Iteration #${data.iteration}`, 60, 380);

    // Concepts count
    const conceptsCount = data.modules.conceptGenerator.concepts.length;
    doc
      .fontSize(48)
      .fillColor(primary)
      .font("Helvetica-Bold")
      .text(`${conceptsCount}`, 60, 450);

    doc
      .fontSize(14)
      .fillColor(text)
      .font("Helvetica")
      .text("New Collection Concepts", 60, 510);

    // Brand mark
    doc
      .fontSize(10)
      .fillColor(this.colors.gray)
      .text(
        "HAORI VISION — Where Light Meets Form",
        60,
        doc.page.height - 100,
        {
          align: "center",
          width: doc.page.width - 120,
        },
      );

    // Bottom accent line
    doc.rect(0, doc.page.height - 3, doc.page.width, 3).fill(secondary);

    doc.addPage();
  }

  /**
   * PAGE 2: Executive Summary
   */
  renderExecutiveSummary(doc, data) {
    this.renderPageHeader(doc, "Executive Summary", 2);

    let y = 140;

    // Overview
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Overview", 60, y);

    y += 25;

    const topConcept = data.modules.evaluation.topConcept;
    const readyCount = data.modules.evaluation.readyForPublication.length;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.colors.gray)
      .text(
        `This month's Artistic Evolution cycle analyzed current trends in fashion, art, and digital aesthetics, ` +
          `filtering them through HAORI VISION's philosophy of "light and form". ${data.modules.conceptGenerator.concepts.length} ` +
          `concepts were generated, with ${readyCount} ready for publication.`,
        60,
        y,
        { width: 475, align: "left", lineGap: 4 },
      );

    y += 90;

    // Top Concept
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Top Concept", 60, y);

    y += 25;

    doc
      .fontSize(14)
      .fillColor(this.colors.primary)
      .text(`"${topConcept}"`, 60, y);

    y += 35;

    // Key Themes
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Core Themes", 60, y);

    y += 25;

    data.modules.dnaMatcher.coreThemes.forEach((theme, index) => {
      doc
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .font("Helvetica")
        .text(`${index + 1}. ${theme}`, 70, y);
      y += 20;
    });

    y += 20;

    // Philosophical Essence
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Philosophical Essence", 60, y);

    y += 25;

    doc
      .fontSize(10)
      .fillColor(this.colors.tertiary)
      .font("Helvetica-Oblique")
      .text(`"${data.modules.dnaMatcher.philosophicalEssence}"`, 60, y, {
        width: 475,
        align: "left",
        lineGap: 4,
      });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE 3: Trend Analysis
   */
  renderTrendAnalysis(doc, data) {
    this.renderPageHeader(doc, "Trend Analysis", 3);

    let y = 140;

    // Visual Trends
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Visual Trends", 60, y);

    y += 25;

    data.modules.trendAnalyzer.visualTrends.slice(0, 5).forEach((trend) => {
      doc
        .fontSize(10)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(trend.trend, 60, y);

      y += 15;

      doc
        .fontSize(9)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text(trend.description, 70, y, { width: 465 });

      y += 35;

      if (y > 700) {
        doc.addPage();
        this.renderPageHeader(doc, "Trend Analysis (continued)", 3);
        y = 140;
      }
    });

    // Cultural Themes
    y += 10;
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Cultural Themes", 60, y);

    y += 25;

    data.modules.trendAnalyzer.culturalThemes.forEach((theme) => {
      doc
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .text(`• ${theme}`, 70, y);
      y += 18;
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE 4: Concepts Overview
   */
  renderConceptsOverview(doc, data) {
    this.renderPageHeader(doc, "Collection Concepts", 4);

    let y = 140;

    data.modules.conceptGenerator.concepts.forEach((concept, index) => {
      const evaluation = data.modules.evaluation.evaluations[index];

      // Concept box
      doc
        .rect(60, y, 475, 120)
        .lineWidth(1)
        .strokeColor(this.colors.subtle)
        .stroke();

      // Concept name
      doc
        .fontSize(14)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(concept.name, 75, y + 15);

      // Subtitle
      doc
        .fontSize(10)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text(concept.subtitle, 75, y + 35);

      // Score
      doc
        .fontSize(24)
        .fillColor(this.colors.secondary)
        .font("Helvetica-Bold")
        .text(evaluation.overall.toFixed(1), 460, y + 15);

      doc
        .fontSize(8)
        .fillColor(this.colors.gray)
        .text("Score", 467, y + 45);

      // Philosophy snippet
      doc
        .fontSize(9)
        .fillColor(this.colors.text)
        .font("Helvetica")
        .text(concept.philosophy.substring(0, 150) + "...", 75, y + 60, {
          width: 370,
        });

      // Recommendation
      const recColor =
        evaluation.recommendation === "approve"
          ? this.colors.tertiary
          : evaluation.recommendation === "revise"
            ? this.colors.secondary
            : this.colors.primary;

      doc
        .fontSize(9)
        .fillColor(recColor)
        .font("Helvetica-Bold")
        .text(evaluation.recommendation.toUpperCase(), 75, y + 100);

      y += 140;

      if (y > 650) {
        doc.addPage();
        this.renderPageHeader(doc, "Collection Concepts (continued)", 4);
        y = 140;
      }
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE 5+: Individual Concept Detail
   */
  renderConceptDetail(doc, concept, evaluation, number) {
    this.renderPageHeader(
      doc,
      `Concept ${number}: ${concept.name}`,
      4 + number,
    );

    let y = 140;

    // Name & Subtitle
    doc
      .fontSize(18)
      .fillColor(this.colors.primary)
      .font("Helvetica-Bold")
      .text(concept.name, 60, y);

    y += 30;

    doc
      .fontSize(12)
      .fillColor(this.colors.gray)
      .font("Helvetica")
      .text(concept.subtitle, 60, y);

    y += 40;

    // Philosophy
    doc
      .fontSize(11)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Philosophy", 60, y);

    y += 20;

    doc
      .fontSize(10)
      .fillColor(this.colors.gray)
      .font("Helvetica")
      .text(concept.philosophy, 60, y, {
        width: 475,
        align: "left",
        lineGap: 3,
      });

    y += 60;

    // Color Palette
    doc
      .fontSize(11)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Color Palette", 60, y);

    y += 25;

    let x = 60;
    concept.palette.colors.forEach((color) => {
      doc.rect(x, y, 40, 40).fillColor(color).fill();

      doc
        .fontSize(8)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text(color, x, y + 45, { width: 40, align: "center" });

      x += 50;
    });

    y += 70;

    // Materials
    doc
      .fontSize(11)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Materials", 60, y);

    y += 20;

    doc
      .fontSize(10)
      .fillColor(this.colors.secondary)
      .font("Helvetica")
      .text(concept.materials.join(", "), 60, y);

    y += 40;

    // Quote
    doc
      .fontSize(11)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Inspiring Quote", 60, y);

    y += 20;

    doc
      .fontSize(10)
      .fillColor(this.colors.tertiary)
      .font("Helvetica-Oblique")
      .text(`"${concept.quote}"`, 60, y, { width: 475, align: "left" });

    y += 50;

    // Evaluation Scores
    doc
      .fontSize(11)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Evaluation", 60, y);

    y += 25;

    const scores = evaluation.scores;
    Object.keys(scores).forEach((key) => {
      const score = scores[key];
      const barWidth = (score / 100) * 300;

      // Label
      doc
        .fontSize(9)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text(this.capitalizeFirst(key), 60, y);

      // Bar background
      doc.rect(200, y, 300, 12).fillColor(this.colors.subtle).fill();

      // Bar fill
      doc.rect(200, y, barWidth, 12).fillColor(this.colors.primary).fill();

      // Score text
      doc.fontSize(9).fillColor(this.colors.text).text(score, 510, y);

      y += 20;
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N-4: Visual Examples
   */
  renderVisualExamples(doc, data) {
    const pageNum = 5 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Visual Examples", pageNum);

    let y = 140;

    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Visualization Concepts", 60, y);

    y += 30;

    data.modules.conceptGenerator.concepts.forEach((concept) => {
      // Concept name
      doc
        .fontSize(11)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(concept.name, 60, y);

      y += 20;

      // Visual description box
      doc
        .rect(60, y, 475, 100)
        .lineWidth(1)
        .strokeColor(this.colors.subtle)
        .stroke();

      // Key pieces visualization
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Key Pieces:", 75, y + 15);

      y += 35;

      concept.pieces.slice(0, 2).forEach((piece) => {
        doc
          .fontSize(9)
          .fillColor(this.colors.secondary)
          .font("Helvetica")
          .text(`• ${piece.type.toUpperCase()}: ${piece.description}`, 85, y, {
            width: 440,
          });
        y += 25;
      });

      y += 20;

      // Color palette visual
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Palette:", 75, y);

      y += 20;

      let x = 85;
      concept.palette.colors.slice(0, 4).forEach((color) => {
        doc.rect(x, y, 30, 30).fillColor(color).fill();
        x += 35;
      });

      y += 50;

      if (y > 650) {
        doc.addPage();
        this.renderPageHeader(doc, "Visual Examples (continued)", pageNum);
        y = 140;
      }
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N-3: Demand Forecast
   */
  renderDemandForecast(doc, data) {
    const pageNum = 6 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Demand Forecast", pageNum);

    let y = 140;

    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Market Potential Analysis", 60, y);

    y += 30;

    data.modules.conceptGenerator.concepts.forEach((concept, index) => {
      const evaluation = data.modules.evaluation.evaluations[index];

      // Concept box
      doc
        .rect(60, y, 475, 140)
        .lineWidth(1)
        .strokeColor(this.colors.subtle)
        .stroke();

      // Concept name
      doc
        .fontSize(11)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(concept.name, 75, y + 15);

      y += 40;

      // Viral potential
      const viralScore = evaluation.scores.viralPotential;
      const viralWidth = (viralScore / 100) * 200;

      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Viral Potential", 75, y);

      doc.rect(200, y, 200, 15).fillColor(this.colors.subtle).fill();

      doc.rect(200, y, viralWidth, 15).fillColor(this.colors.tertiary).fill();

      doc
        .fontSize(9)
        .fillColor(this.colors.text)
        .text(viralScore, 410, y + 3);

      y += 30;

      // Target audience
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Target Audience:", 75, y);

      y += 18;

      doc
        .fontSize(9)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text("• Gen-Z art collectors (23-28)", 85, y);

      y += 15;

      doc.text("• Fashion-forward professionals (28-35)", 85, y);

      y += 15;

      doc.text("• Digital art enthusiasts", 85, y);

      y += 30;

      // Estimated demand
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Estimated Monthly Demand:", 75, y);

      const demandRange =
        viralScore > 85
          ? "15-25 pieces"
          : viralScore > 75
            ? "10-18 pieces"
            : "5-12 pieces";

      doc
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .font("Helvetica")
        .text(demandRange, 270, y);

      y += 160;

      if (y > 650) {
        doc.addPage();
        this.renderPageHeader(doc, "Demand Forecast (continued)", pageNum);
        y = 140;
      }
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N-2: Visual Directions
   */
  renderVisualDirections(doc, data) {
    const pageNum = 7 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Visual Directions", pageNum);

    let y = 140;

    data.modules.visualSynthesizer.visuals.forEach((visual) => {
      doc
        .fontSize(12)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(visual.conceptName, 60, y);

      y += 25;

      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Lighting Setup:", 60, y);

      y += 15;

      doc
        .fontSize(9)
        .fillColor(this.colors.gray)
        .font("Helvetica")
        .text(visual.lightingSetup, 70, y, { width: 465 });

      y += 40;

      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("TikTok Hooks:", 60, y);

      y += 15;

      visual.tiktokHooks.forEach((hook) => {
        doc
          .fontSize(9)
          .fillColor(this.colors.secondary)
          .text(`• ${hook}`, 70, y);
        y += 15;
      });

      y += 30;

      if (y > 650) {
        doc.addPage();
        this.renderPageHeader(doc, "Visual Directions (continued)", pageNum);
        y = 140;
      }
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N-1: Evaluation Scores
   */
  renderEvaluationScores(doc, data) {
    const pageNum = 8 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Evaluation & Scores", pageNum);

    let y = 140;

    // Summary table
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Concept Comparison", 60, y);

    y += 30;

    // Table header
    doc
      .fontSize(9)
      .fillColor(this.colors.gray)
      .text("Concept", 60, y)
      .text("Philosophy", 200, y)
      .text("Aesthetics", 280, y)
      .text("Novelty", 360, y)
      .text("Emotion", 430, y)
      .text("Viral", 490, y);

    y += 20;

    // Divider
    doc.moveTo(60, y).lineTo(535, y).strokeColor(this.colors.subtle).stroke();

    y += 15;

    // Table rows
    data.modules.evaluation.evaluations.forEach((evaluation) => {
      doc
        .fontSize(9)
        .fillColor(this.colors.text)
        .font("Helvetica")
        .text(evaluation.conceptName.substring(0, 20), 60, y, { width: 130 });

      doc
        .fillColor(this.colors.primary)
        .text(evaluation.scores.philosophy, 210, y)
        .text(evaluation.scores.aesthetics, 290, y)
        .text(evaluation.scores.novelty, 370, y)
        .text(evaluation.scores.emotionalResonance, 440, y)
        .text(evaluation.scores.viralPotential, 500, y);

      y += 25;
    });

    y += 30;

    // Ready for publication
    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Ready for Publication", 60, y);

    y += 25;

    data.modules.evaluation.readyForPublication.forEach((conceptName) => {
      doc
        .fontSize(10)
        .fillColor(this.colors.tertiary)
        .font("Helvetica")
        .text(`✓ ${conceptName}`, 70, y);
      y += 20;
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N-1: Style & Tone Recommendations
   */
  renderStyleAndTone(doc, data) {
    const pageNum = 9 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Style & Tone Recommendations", pageNum);

    let y = 140;

    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Communication Guidelines", 60, y);

    y += 30;

    data.modules.conceptGenerator.concepts.forEach((concept) => {
      // Concept name
      doc
        .fontSize(11)
        .fillColor(this.colors.primary)
        .font("Helvetica-Bold")
        .text(concept.name, 60, y);

      y += 25;

      // Target emotion
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Target Emotion:", 60, y);

      doc
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .font("Helvetica")
        .text(concept.targetEmotion, 180, y);

      y += 25;

      // Tone recommendations
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Tone:", 60, y);

      y += 18;

      const tones = this.generateToneRecommendations(concept);
      tones.forEach((tone) => {
        doc
          .fontSize(9)
          .fillColor(this.colors.gray)
          .font("Helvetica")
          .text(`• ${tone}`, 70, y);
        y += 15;
      });

      y += 10;

      // Messaging style
      doc
        .fontSize(10)
        .fillColor(this.colors.text)
        .font("Helvetica-Bold")
        .text("Messaging Style:", 60, y);

      y += 18;

      const messagingStyle = this.generateMessagingStyle(concept);
      doc
        .fontSize(9)
        .fillColor(this.colors.tertiary)
        .font("Helvetica-Oblique")
        .text(`"${messagingStyle}"`, 70, y, { width: 465 });

      y += 50;

      if (y > 650) {
        doc.addPage();
        this.renderPageHeader(doc, "Style & Tone (continued)", pageNum);
        y = 140;
      }
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * PAGE N: Recommendations & Next Steps
   */
  renderRecommendations(doc, data) {
    const pageNum = 10 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Recommendations", pageNum);

    let y = 140;

    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Action Items", 60, y);

    y += 30;

    data.modules.evaluation.evaluations.forEach((evaluation, index) => {
      if (evaluation.recommendation === "approve") {
        doc
          .fontSize(10)
          .fillColor(this.colors.tertiary)
          .font("Helvetica-Bold")
          .text(`${index + 1}. ${evaluation.conceptName}`, 60, y);

        y += 18;

        doc
          .fontSize(9)
          .fillColor(this.colors.gray)
          .font("Helvetica")
          .text("→ Approve for production and integration", 70, y);

        y += 30;
      }
    });

    y += 20;

    doc
      .fontSize(12)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Next Steps", 60, y);

    y += 25;

    const steps = [
      "Review and approve recommended concepts",
      "Integrate approved concepts into collections.json",
      "Update website and NFT gallery",
      "Schedule content for social media",
      "Monitor audience response and engagement",
    ];

    steps.forEach((step, index) => {
      doc
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .font("Helvetica")
        .text(`${index + 1}. ${step}`, 70, y);
      y += 22;
    });

    this.renderPageFooter(doc);
    doc.addPage();
  }

  /**
   * FINAL PAGE: Next Cycle
   */
  renderNextSteps(doc, data) {
    const pageNum = 11 + data.modules.conceptGenerator.concepts.length;
    this.renderPageHeader(doc, "Next Cycle", pageNum);

    const nextRun = new Date();
    nextRun.setMonth(nextRun.getMonth() + 1);
    nextRun.setDate(1);
    nextRun.setHours(3, 33, 0);

    doc
      .fontSize(16)
      .fillColor(this.colors.text)
      .font("Helvetica-Bold")
      .text("Next Artistic Evolution", 60, 200);

    doc
      .fontSize(12)
      .fillColor(this.colors.gray)
      .font("Helvetica")
      .text(
        `Scheduled for ${nextRun.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })} at 03:33 AM`,
        60,
        240,
      );

    doc
      .fontSize(10)
      .fillColor(this.colors.primary)
      .text(
        "The system will autonomously analyze new trends and generate fresh concepts.",
        60,
        280,
      );

    // Brand mark
    doc
      .fontSize(14)
      .fillColor(this.colors.secondary)
      .font("Helvetica-Bold")
      .text("HAORI VISION", 60, 400);

    doc
      .fontSize(10)
      .fillColor(this.colors.gray)
      .font("Helvetica-Oblique")
      .text("Where Light Meets Form", 60, 425);

    this.renderPageFooter(doc);
  }

  /**
   * Utilities
   */
  renderPageHeader(doc, title, pageNum) {
    doc
      .fontSize(10)
      .fillColor(this.colors.gray)
      .font("Helvetica")
      .text(`ARTISTIC EVOLUTION REPORT`, 60, 40);

    doc
      .fontSize(14)
      .fillColor(this.colors.primary)
      .font("Helvetica-Bold")
      .text(title, 60, 80);

    doc
      .fontSize(9)
      .fillColor(this.colors.gray)
      .text(`Page ${pageNum}`, 500, 40);

    // Divider
    doc
      .moveTo(60, 120)
      .lineTo(535, 120)
      .strokeColor(this.colors.subtle)
      .stroke();
  }

  renderPageFooter(doc) {
    doc
      .fontSize(8)
      .fillColor(this.colors.gray)
      .font("Helvetica")
      .text(
        "HAORI VISION — Artistic Evolution System",
        60,
        doc.page.height - 50,
        { align: "center", width: doc.page.width - 120 },
      );
  }

  capitalizeFirst(str) {
    return (
      str.charAt(0).toUpperCase() +
      str
        .slice(1)
        .replace(/([A-Z])/g, " $1")
        .trim()
    );
  }

  generateToneRecommendations(concept) {
    // Base recommendations for HAORI VISION brand
    const baseTones = [
      "Minimalist and refined",
      "Poetic without pretension",
      "Confident yet understated",
    ];

    // Add concept-specific tones based on target emotion
    const emotion = concept.targetEmotion.toLowerCase();

    if (emotion.includes("calm") || emotion.includes("serene")) {
      baseTones.push("Tranquil and meditative");
    }

    if (emotion.includes("power") || emotion.includes("strength")) {
      baseTones.push("Authoritative yet elegant");
    }

    if (emotion.includes("ethereal") || emotion.includes("luminous")) {
      baseTones.push("Mystical and light-focused");
    }

    return baseTones;
  }

  generateMessagingStyle(concept) {
    // Generate messaging style based on concept philosophy
    const philosophy = concept.philosophy.toLowerCase();

    if (philosophy.includes("light") && philosophy.includes("silent")) {
      return "Speak softly, let the light do the talking. Silence is the canvas, luminescence is the art.";
    }

    if (philosophy.includes("transform") || philosophy.includes("uv")) {
      return "Transformation is not shouted—it is revealed. Day to night, shadow to light.";
    }

    if (philosophy.includes("minimal") || philosophy.includes("form")) {
      return "Less is the language. Form is the statement. Every line carries meaning.";
    }

    // Default
    return "Clarity over complexity. Essence over excess. Let each word illuminate.";
  }
}

export default new ArtisticEvolutionReportService();
