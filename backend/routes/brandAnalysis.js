import express from "express";
import brandAnalysisService from "../services/brandAnalysisService.js";
import globalOptimizationService from "../services/globalOptimizationService.js";
import premiumExperienceTestService from "../services/premiumExperienceTestService.js";
import aiFeedbackLoopService from "../services/aiFeedbackLoopService.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * POST /api/brand-analysis/analyze
 * Run comprehensive brand analysis
 */
router.post("/analyze", async (req, res) => {
  try {
    const { metrics } = req.body;

    const result = await brandAnalysisService.analyzeBrand(metrics || {});

    if (result.success) {
      // Save analysis to database for tracking over time
      // TODO: Store in BrandAnalysis model
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/optimize
 * Run deep system optimization
 */
router.post("/optimize", async (req, res) => {
  try {
    const result = await globalOptimizationService.optimizeAllSystems();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/report/generate
 * Generate executive summary PDF
 */
router.post("/report/generate", async (req, res) => {
  try {
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({
        success: false,
        error: "Analysis data required",
      });
    }

    const result =
      await globalOptimizationService.generateExecutiveReport(analysis);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/haori-light-index
 * Get current Haori Light Index (brand emotional perception score)
 */
router.get("/haori-light-index", async (req, res) => {
  try {
    const index = await globalOptimizationService.getHaoriLightIndex();

    res.json({
      success: true,
      index,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/history
 * Get historical analysis data
 */
router.get("/history", async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    // TODO: Fetch from BrandAnalysis model
    const history = [];

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/premium-test
 * Run premium experience test for 3 personas
 */
router.post("/premium-test", async (req, res) => {
  try {
    const { testConfig } = req.body;

    const result = await premiumExperienceTestService.runPremiumTest(
      testConfig || {},
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/premium-test/report
 * Generate premium test PDF report
 */
router.post("/premium-test/report", async (req, res) => {
  try {
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({
        success: false,
        error: "Test results required",
      });
    }

    const result =
      await premiumExperienceTestService.generatePremiumTestReport(results);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/ai-feedback-loop/run
 * Manually trigger AI feedback loop (for testing)
 */
router.post("/ai-feedback-loop/run", async (req, res) => {
  try {
    const result = await aiFeedbackLoopService.runWeeklyFeedbackLoop();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/ai-feedback-loop/status
 * Get current learning state and Haori Light Index
 */
router.get("/ai-feedback-loop/status", async (req, res) => {
  try {
    const lightIndex = aiFeedbackLoopService.getHaoriLightIndex();
    const learningState = aiFeedbackLoopService.getLearningState();

    res.json({
      success: true,
      haoriLightIndex: lightIndex,
      learningState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/ai-director/run
 * Manually trigger AI Director cycle (for testing)
 */
router.post("/ai-director/run", async (req, res) => {
  try {
    const aiDirectorService = (await import("../services/aiDirectorService.js"))
      .default;
    const result = await aiDirectorService.runWeeklyDirectorCycle();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/ai-director/status
 * Get AI Director status and latest report
 */
router.get("/ai-director/status", async (req, res) => {
  try {
    const aiDirectorService = (await import("../services/aiDirectorService.js"))
      .default;
    const status = aiDirectorService.getStatus();

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/ai-director/report/:iteration
 * Get specific AI Director report
 */
router.get("/ai-director/report/:iteration", async (req, res) => {
  try {
    const aiDirectorService = (await import("../services/aiDirectorService.js"))
      .default;
    const report = aiDirectorService.getLatestReport();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "No reports found",
      });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/haori-light-index/current
 * Get current Haori Light Index (emotional impact score)
 */
router.get("/haori-light-index/current", async (req, res) => {
  try {
    const aiDirectorService = (await import("../services/aiDirectorService.js"))
      .default;
    const report = aiDirectorService.getLatestReport();

    if (!report || !report.haoriLightIndex) {
      return res.json({
        success: true,
        haoriLightIndex: null,
        message: "No index calculated yet. Run AI Director first.",
      });
    }

    res.json({
      success: true,
      haoriLightIndex: report.haoriLightIndex,
      timestamp: report.timestamp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/ai-director/pdf/latest
 * Download latest PDF report
 */
router.get("/ai-director/pdf/latest", async (req, res) => {
  try {
    const aiDirectorService = (await import("../services/aiDirectorService.js"))
      .default;
    const report = aiDirectorService.getLatestReport();

    if (!report || !report.pdfReport) {
      return res.status(404).json({
        success: false,
        error: "No PDF reports available yet",
      });
    }

    const { filepath, filename } = report.pdfReport;

    res.download(filepath, filename, (err) => {
      if (err) {
        baseLogger.error({ err }, "Error downloading PDF");
        res.status(500).json({
          success: false,
          error: "Failed to download PDF",
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 🎨 ARTISTIC EVOLUTION ENDPOINTS
 */

/**
 * POST /api/brand-analysis/artistic-evolution/run
 * Manually trigger Artistic Evolution cycle
 */
router.post("/artistic-evolution/run", async (req, res) => {
  try {
    const artisticEvolutionService = (
      await import("../services/artisticEvolutionService.js")
    ).default;
    const result = await artisticEvolutionService.runMonthlyEvolutionCycle();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/artistic-evolution/status
 * Get Artistic Evolution status and latest concepts
 */
router.get("/artistic-evolution/status", async (req, res) => {
  try {
    const artisticEvolutionService = (
      await import("../services/artisticEvolutionService.js")
    ).default;
    const report = artisticEvolutionService.getLatestReport();

    if (!report) {
      return res.json({
        success: true,
        report: null,
        message: "No evolution cycles run yet",
      });
    }

    res.json({
      success: true,
      iteration: report.iteration,
      month: report.month,
      timestamp: report.timestamp,
      conceptsCount: report.modules.conceptGenerator.concepts.length,
      topConcept: report.modules.evaluation.topConcept,
      readyForPublication: report.modules.evaluation.readyForPublication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/artistic-evolution/concepts/:month
 * Get concepts for specific month (YYYY-MM format)
 */
router.get("/artistic-evolution/concepts/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const conceptPath = path.join(
      __dirname,
      `../../data/concepts/concept_${month}.json`,
    );

    if (!fs.existsSync(conceptPath)) {
      return res.status(404).json({
        success: false,
        error: `No concepts found for ${month}`,
      });
    }

    const conceptData = JSON.parse(fs.readFileSync(conceptPath, "utf8"));

    res.json({
      success: true,
      ...conceptData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brand-analysis/artistic-evolution/approve
 * Approve concept for publication
 */
router.post("/artistic-evolution/approve", async (req, res) => {
  try {
    const { month, conceptName } = req.body;

    if (!month || !conceptName) {
      return res.status(400).json({
        success: false,
        error: "Month and conceptName are required",
      });
    }

    const artisticEvolutionService = (
      await import("../services/artisticEvolutionService.js")
    ).default;
    const result = await artisticEvolutionService.approveConcept(
      month,
      conceptName,
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brand-analysis/artistic-evolution/pdf/latest
 * Download latest Artistic Evolution PDF report
 */
router.get("/artistic-evolution/pdf/latest", async (req, res) => {
  try {
    const artisticEvolutionService = (
      await import("../services/artisticEvolutionService.js")
    ).default;
    const report = artisticEvolutionService.getLatestReport();

    if (!report || !report.pdfReport) {
      return res.status(404).json({
        success: false,
        error: "No Artistic Evolution PDF reports available yet",
      });
    }

    const { filepath, filename } = report.pdfReport;

    res.download(filepath, filename, (err) => {
      if (err) {
        baseLogger.error({ err }, "Error downloading PDF");
        res.status(500).json({
          success: false,
          error: "Failed to download PDF",
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
