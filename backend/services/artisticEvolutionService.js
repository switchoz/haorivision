import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🎨 ARTISTIC EVOLUTION SERVICE
 *
 * Автономная система развития коллекций HAORI VISION
 * Создаёт новые визуальные и концептуальные направления на основе трендов
 */
class ArtisticEvolutionService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.conceptsDir = path.join(__dirname, "../../data/concepts");
    this.reportsDir = path.join(__dirname, "../../data/artistic-evolution");
    this.mediaDir = path.join(__dirname, "../../public/media/concepts");

    // Create directories if they don't exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.conceptsDir, this.reportsDir, this.mediaDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Главный цикл Artistic Evolution - запускается ежемесячно
   */
  async runMonthlyEvolutionCycle() {
    const startTime = Date.now();
    const timestamp = new Date();
    const month = timestamp.toISOString().slice(0, 7); // YYYY-MM

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[◆] ARTISTIC EVOLUTION: Monthly cycle starting...");
    console.log(`[○] Time: ${timestamp.toLocaleString()}`);
    console.log(`[✦] Month: ${month}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    try {
      const evolutionReport = {
        timestamp,
        month,
        iteration: this.getNextIteration(),
        modules: {},
      };

      // Module 1: Trend Analyzer
      console.log("[1/5] Trend Analyzer (analyzing fashion-art trends)...");
      evolutionReport.modules.trendAnalyzer = await this.runTrendAnalyzer();

      // Module 2: DNA Matcher
      console.log("[2/5] DNA Matcher (filtering by brand philosophy)...");
      evolutionReport.modules.dnaMatcher = await this.runDNAMatcher(
        evolutionReport.modules.trendAnalyzer,
      );

      // Module 3: Concept Generator
      console.log("[3/5] Concept Generator (creating new collections)...");
      evolutionReport.modules.conceptGenerator = await this.runConceptGenerator(
        evolutionReport.modules.dnaMatcher,
      );

      // Module 4: Visual Synthesizer
      console.log(
        "[4/5] Visual Synthesizer (generating visual descriptions)...",
      );
      evolutionReport.modules.visualSynthesizer =
        await this.runVisualSynthesizer(
          evolutionReport.modules.conceptGenerator,
        );

      // Module 5: Evaluation & Approval
      console.log("[5/5] Evaluation (scoring new concepts)...");
      evolutionReport.modules.evaluation = await this.runEvaluation(
        evolutionReport.modules.conceptGenerator,
      );

      // Save concept to JSON
      this.saveConcept(evolutionReport, month);

      // Generate PDF Report
      const artisticEvolutionReportService = (
        await import("./artisticEvolutionReportService.js")
      ).default;
      const pdfResult =
        await artisticEvolutionReportService.generatePDFReport(evolutionReport);
      evolutionReport.pdfReport = pdfResult;

      // Save full report
      this.saveReport(evolutionReport);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("[✓] Artistic Evolution cycle completed");
      console.log(`[◇] Duration: ${duration}s`);
      console.log(
        `[◆] Concepts created: ${evolutionReport.modules.conceptGenerator.concepts.length}`,
      );
      console.log(`[✦] PDF Report: ${pdfResult.filename}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      return {
        success: true,
        report: evolutionReport,
        nextRun: this.getNextMonthlyRun(),
      };
    } catch (error) {
      console.error("[✗] Artistic Evolution error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * MODULE 1: TREND ANALYZER
   * Анализирует визуальные и культурные тренды
   */
  async runTrendAnalyzer() {
    const prompt = `
Ты — Trend Analyzer для luxury fashion-art бренда HAORI VISION.

Проанализируй текущие тренды в:
- Fashion (Vogue, Hypebeast, SSENSE, Maison Margiela, Rick Owens)
- Art (TeamLab, Yayoi Kusama, Olafur Eliasson, James Turrell)
- Digital aesthetics (UV light, holograms, AI-art, cyberpunk-luxury)
- Culture (TikTok aesthetics, Gen-Z values, sustainability, spirituality)

Верни JSON:
{
  "visualTrends": [
    {"trend": "название", "description": "описание", "sources": ["источники"], "viralPotential": 1-10}
  ],
  "colorPalettes": [
    {"name": "название", "colors": ["#hex"], "emotion": "эмоция"}
  ],
  "materials": ["список материалов и текстур"],
  "culturalThemes": ["духовность", "технология", "природа", ...],
  "musicInfluences": ["ambient", "techno", "classical", ...],
  "keyInsights": ["главные инсайты"]
}

Фокус на:
- Минимализм + максимальное эмоциональное влияние
- Свет как искусство (UV, holographic, luminescence)
- Утончённость без пафоса
- Духовность через форму
`;

    const response = await this.callClaude(prompt);
    return this.parseJSON(response);
  }

  /**
   * MODULE 2: DNA MATCHER
   * Фильтрует тренды через призму философии HAORI VISION
   */
  async runDNAMatcher(trendData) {
    const brandDNA = this.getBrandDNA();

    const prompt = `
Ты — DNA Matcher для HAORI VISION.

ФИЛОСОФИЯ БРЕНДА:
${brandDNA}

ТРЕНДЫ:
${JSON.stringify(trendData, null, 2)}

Задача:
1. Исключи всё коммерческое, громкое, поверхностное
2. Оставь только то, что резонирует с духом бренда
3. Адаптируй тренды под философию "света и формы"

Верни JSON:
{
  "alignedTrends": [
    {"trend": "название", "alignment": 1-10, "reason": "почему подходит"}
  ],
  "rejectedTrends": [
    {"trend": "название", "reason": "почему не подходит"}
  ],
  "synthesizedPalette": {
    "primary": ["#hex"],
    "accent": ["#hex"],
    "emotion": "описание эмоционального тона"
  },
  "coreThemes": ["2-3 главные темы для коллекции"],
  "philosophicalEssence": "одно предложение — суть новой коллекции"
}
`;

    const response = await this.callClaude(prompt);
    return this.parseJSON(response);
  }

  /**
   * MODULE 3: CONCEPT GENERATOR
   * Создаёт 1-3 концепта новых коллекций
   */
  async runConceptGenerator(dnaMatchData) {
    const prompt = `
Ты — Concept Generator для HAORI VISION.

ОТФИЛЬТРОВАННЫЕ ТРЕНДЫ:
${JSON.stringify(dnaMatchData, null, 2)}

Создай 1-3 концепта коллекций. Каждый концепт — это самостоятельная мини-коллекция с:
- Названием (минималистичное, поэтичное)
- Философией (1-2 предложения)
- Палитрой (3-5 цветов)
- Материалами (ткани, текстуры)
- Формами (силуэты, структуры)
- Вдохновляющей цитатой

Верни JSON:
{
  "concepts": [
    {
      "name": "название",
      "subtitle": "подзаголовок",
      "philosophy": "философия",
      "palette": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "colors": ["#hex", "#hex", "#hex"]
      },
      "materials": ["материал 1", "материал 2"],
      "forms": ["форма 1", "форма 2"],
      "quote": "вдохновляющая цитата",
      "targetEmotion": "целевая эмоция",
      "nftIntegration": "как это будет в NFT",
      "pieces": [
        {"type": "haori", "description": "описание предмета"}
      ]
    }
  ]
}

Стиль: минималистичный, духовный, поэтичный. Никаких клише.
`;

    const response = await this.callClaude(prompt);
    return this.parseJSON(response);
  }

  /**
   * MODULE 4: VISUAL SYNTHESIZER
   * Создаёт описания визуальных элементов для каждой коллекции
   */
  async runVisualSynthesizer(conceptData) {
    const prompt = `
Ты — Visual Synthesizer для HAORI VISION.

КОЛЛЕКЦИИ:
${JSON.stringify(conceptData, null, 2)}

Для каждой коллекции создай детальное визуальное описание:
- Mood board описание
- Световые эффекты (UV, holographic)
- Текстурные слои
- Композиция для фото/видео
- NFT визуализация

Верни JSON:
{
  "visuals": [
    {
      "conceptName": "название коллекции",
      "moodboard": "описание mood board",
      "lightingSetup": "как снимать с UV светом",
      "textures": ["текстура 1", "текстура 2"],
      "composition": "композиция кадра",
      "nftVisualization": "как будет выглядеть NFT",
      "instagramAesthetic": "стиль для Instagram",
      "tiktokHooks": ["идея 1 для TikTok", "идея 2"]
    }
  ]
}
`;

    const response = await this.callClaude(prompt);
    return this.parseJSON(response);
  }

  /**
   * MODULE 5: EVALUATION & APPROVAL
   * Оценивает концепты по 5 критериям
   */
  async runEvaluation(conceptData) {
    const prompt = `
Ты — Evaluation System для HAORI VISION.

КОЛЛЕКЦИИ:
${JSON.stringify(conceptData, null, 2)}

Оцени каждый концепт по критериям (0-100):
1. Философия — соответствие духу бренда
2. Эстетика — визуальная чистота и сила
3. Новизна — уникальность и инновации
4. Эмоциональный резонанс — сила влияния
5. Вирусный потенциал — shareability

Верни JSON:
{
  "evaluations": [
    {
      "conceptName": "название",
      "scores": {
        "philosophy": 85,
        "aesthetics": 90,
        "novelty": 78,
        "emotionalResonance": 88,
        "viralPotential": 82
      },
      "overall": 84.6,
      "strengths": ["сильная сторона 1", "сильная сторона 2"],
      "improvements": ["что улучшить 1", "что улучшить 2"],
      "recommendation": "approve / revise / reject",
      "reasoning": "обоснование рекомендации"
    }
  ],
  "topConcept": "название лучшего концепта",
  "readyForPublication": ["список одобренных концептов"]
}
`;

    const response = await this.callClaude(prompt);
    return this.parseJSON(response);
  }

  /**
   * Вызов Claude API
   */
  async callClaude(prompt) {
    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        temperature: 0.8, // Creative mode
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return message.content[0].text;
    } catch (error) {
      console.error("[✗] Claude API error:", error.message);
      throw error;
    }
  }

  /**
   * Парсинг JSON из ответа Claude
   */
  parseJSON(text) {
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return JSON.parse(cleanText);
    } catch (error) {
      console.error("[✗] JSON parse error:", error.message);
      console.error("[!] Raw text:", text);
      throw new Error("Failed to parse Claude response as JSON");
    }
  }

  /**
   * Получить Brand DNA
   */
  getBrandDNA() {
    return `
HAORI VISION — Where Light Meets Form

ФИЛОСОФИЯ:
- Свет как искусство, форма как медитация
- Минимализм с максимальным эмоциональным влиянием
- Одежда как носимое искусство, а не продукт
- Духовность через эстетику

ЦЕННОСТИ:
- Утончённость без пафоса
- Технология на службе красоты
- Вечное важнее временного
- Тишина громче крика

ЭСТЕТИКА:
- UV-reactive textiles (светящиеся в ультрафиолете)
- Чёрный + неоновые акценты (#FF10F0, #00D4FF, #39FF14)
- Геометрические формы + органичные линии
- Минимализм в крое, максимализм в эмоциях

НЕ HAORI VISION:
- Массовость, коммерциализация
- Громкие логотипы, брендинг ради брендинга
- Fast fashion, трендовая одежда без души
- Поверхностная роскошь
`;
  }

  /**
   * Сохранить концепт в JSON
   */
  saveConcept(report, month) {
    const filename = `concept_${month}.json`;
    const filepath = path.join(this.conceptsDir, filename);

    const conceptData = {
      month,
      timestamp: report.timestamp,
      concepts: report.modules.conceptGenerator.concepts,
      evaluation: report.modules.evaluation,
      trends: report.modules.trendAnalyzer,
      dna: report.modules.dnaMatcher,
    };

    fs.writeFileSync(filepath, JSON.stringify(conceptData, null, 2));
    console.log(`[◇] Concept saved: ${filename}`);
  }

  /**
   * Сохранить полный отчёт
   */
  saveReport(report) {
    const filename = `artistic-evolution-${report.iteration}.json`;
    const filepath = path.join(this.reportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`[◇] Report saved: ${filename}`);
  }

  /**
   * Получить следующую итерацию
   */
  getNextIteration() {
    if (!fs.existsSync(this.reportsDir)) {
      return 1;
    }

    const files = fs.readdirSync(this.reportsDir);
    const reportFiles = files.filter((f) =>
      f.startsWith("artistic-evolution-"),
    );

    if (reportFiles.length === 0) return 1;

    const iterations = reportFiles.map((f) => {
      const match = f.match(/artistic-evolution-(\d+)\.json/);
      return match ? parseInt(match[1]) : 0;
    });

    return Math.max(...iterations) + 1;
  }

  /**
   * Получить последний отчёт
   */
  getLatestReport() {
    if (!fs.existsSync(this.reportsDir)) {
      return null;
    }

    const files = fs.readdirSync(this.reportsDir);
    const reportFiles = files
      .filter((f) => f.startsWith("artistic-evolution-"))
      .sort()
      .reverse();

    if (reportFiles.length === 0) return null;

    const filepath = path.join(this.reportsDir, reportFiles[0]);
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  }

  /**
   * Одобрить концепт для публикации
   */
  async approveConcept(month, conceptName) {
    const conceptPath = path.join(this.conceptsDir, `concept_${month}.json`);

    if (!fs.existsSync(conceptPath)) {
      throw new Error(`Concept for ${month} not found`);
    }

    const conceptData = JSON.parse(fs.readFileSync(conceptPath, "utf8"));
    const concept = conceptData.concepts.find((c) => c.name === conceptName);

    if (!concept) {
      throw new Error(`Concept "${conceptName}" not found`);
    }

    // Add to collections.json
    const collectionsPath = path.join(
      __dirname,
      "../../data/products/collections.json",
    );
    let collections = { collections: [] };

    if (fs.existsSync(collectionsPath)) {
      collections = JSON.parse(fs.readFileSync(collectionsPath, "utf8"));
    }

    collections.collections.push({
      ...concept,
      approved: true,
      approvedDate: new Date().toISOString(),
      status: "active",
    });

    fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2));

    console.log(`[✓] Concept "${conceptName}" approved and published`);

    return {
      success: true,
      concept,
      message: "Concept approved and added to collections",
    };
  }

  /**
   * Получить время следующего запуска (1-е число месяца в 03:33)
   */
  getNextMonthlyRun() {
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      3,
      33,
      0,
      0,
    );
    return next;
  }
}

export default new ArtisticEvolutionService();
