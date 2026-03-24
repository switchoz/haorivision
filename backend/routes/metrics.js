import express from "express";
import {
  SKUMetrics,
  VideoMetrics,
  DMMetrics,
  AOVMetrics,
  DashboardSnapshot,
} from "../models/Metrics.js";
import { PageView, Interaction } from "../models/Analytics.js";
import { Parser } from "json2csv";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

// ============================================================
// Helper Functions
// ============================================================

/**
 * Parse date range from query params
 */
function parseDateRange(req) {
  const { startDate, endDate, period } = req.query;

  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else if (period) {
    end = new Date();
    start = new Date();

    switch (period) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7); // default to 7 days
    }
  } else {
    // Default: last 7 days
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - 7);
  }

  return { start, end };
}

/**
 * Export data to CSV
 */
function exportToCSV(data, fields) {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (err) {
    baseLogger.error({ err }, "CSV export error");
    throw new Error("Failed to generate CSV");
  }
}

// ============================================================
// GET /api/metrics/sku
// Get SKU performance metrics
// ============================================================

router.get("/sku", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const { sort = "orders", limit = 50 } = req.query;

    // Query SKU metrics
    const metrics = await SKUMetrics.find({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    })
      .populate("productId", "name images price")
      .sort({ [`metrics.${sort}`]: -1 })
      .limit(parseInt(limit));

    // Calculate aggregates
    const totals = {
      views: 0,
      buyNowClicks: 0,
      orders: 0,
      revenue: 0,
    };

    metrics.forEach((m) => {
      totals.views += m.metrics.views || 0;
      totals.buyNowClicks += m.metrics.buyNowClicks || 0;
      totals.orders += m.metrics.orders || 0;
      totals.revenue += m.metrics.revenue || 0;
    });

    totals.avgCTR =
      totals.views > 0 ? (totals.buyNowClicks / totals.views) * 100 : 0;
    totals.avgConversionRate =
      totals.views > 0 ? (totals.orders / totals.views) * 100 : 0;

    res.json({
      success: true,
      period: { start, end },
      metrics,
      totals,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error fetching SKU metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/sku/csv
// Export SKU metrics to CSV
// ============================================================

router.get("/sku/csv", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);

    const metrics = await SKUMetrics.find({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    }).populate("productId", "name price");

    // Flatten data for CSV
    const csvData = metrics.map((m) => ({
      SKU: m.sku,
      "Product Name": m.productId?.name || "N/A",
      Views: m.metrics.views,
      "Buy Now Clicks": m.metrics.buyNowClicks,
      "Buy Now CTR": (m.metrics.buyNowCTR * 100).toFixed(2) + "%",
      Orders: m.metrics.orders,
      Revenue: "�" + (m.metrics.revenue || 0).toFixed(2),
      "Avg Order Value": "�" + (m.metrics.avgOrderValue || 0).toFixed(2),
      "Conversion Rate": (m.metrics.conversionRate * 100).toFixed(2) + "%",
      "Avg Time on Page": m.metrics.timeOnPage?.avg
        ? Math.round(m.metrics.timeOnPage.avg) + "s"
        : "N/A",
    }));

    const fields = [
      "SKU",
      "Product Name",
      "Views",
      "Buy Now Clicks",
      "Buy Now CTR",
      "Orders",
      "Revenue",
      "Avg Order Value",
      "Conversion Rate",
      "Avg Time on Page",
    ];

    const csv = exportToCSV(csvData, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sku-metrics-${start.toISOString().split("T")[0]}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    baseLogger.error({ err: error }, "Error exporting SKU metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/video
// Get video engagement metrics
// ============================================================

router.get("/video", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const { sort = "wowMomentReachRate", limit = 50 } = req.query;

    const metrics = await VideoMetrics.find({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    })
      .populate("productId", "name sku")
      .sort({ [`metrics.${sort}`]: -1 })
      .limit(parseInt(limit));

    // Calculate aggregates
    const totals = {
      plays: 0,
      completions: 0,
      avgWatchTime: 0,
      wowMomentReached: 0,
    };

    metrics.forEach((m) => {
      totals.plays += m.metrics.plays || 0;
      totals.completions += m.metrics.completions || 0;
      totals.avgWatchTime += m.metrics.avgWatchTime || 0;
      totals.wowMomentReached += m.metrics.wowMomentReached || 0;
    });

    if (metrics.length > 0) {
      totals.avgWatchTime /= metrics.length;
    }

    totals.avgCompletionRate =
      totals.plays > 0 ? (totals.completions / totals.plays) * 100 : 0;
    totals.avgWowMomentReachRate =
      totals.plays > 0 ? (totals.wowMomentReached / totals.plays) * 100 : 0;

    res.json({
      success: true,
      period: { start, end },
      metrics,
      totals,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error fetching video metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/video/csv
// Export video metrics to CSV
// ============================================================

router.get("/video/csv", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);

    const metrics = await VideoMetrics.find({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    }).populate("productId", "name sku");

    const csvData = metrics.map((m) => ({
      "Video ID": m.videoId,
      SKU: m.sku || m.productId?.sku || "N/A",
      "Product Name": m.productId?.name || "N/A",
      Plays: m.metrics.plays,
      Completions: m.metrics.completions,
      "Completion Rate": (m.metrics.completionRate * 100).toFixed(2) + "%",
      "Avg Watch Time": Math.round(m.metrics.avgWatchTime) + "s",
      "Avg Watch %": (m.metrics.avgWatchPercentage || 0).toFixed(1) + "%",
      "Wow Moment Reached": m.metrics.wowMomentReached,
      "Wow Moment Reach Rate":
        (m.metrics.wowMomentReachRate * 100).toFixed(2) + "%",
      "Wow Moment Timestamp": m.metrics.wowMomentTimestamp + "s",
    }));

    const fields = [
      "Video ID",
      "SKU",
      "Product Name",
      "Plays",
      "Completions",
      "Completion Rate",
      "Avg Watch Time",
      "Avg Watch %",
      "Wow Moment Reached",
      "Wow Moment Reach Rate",
      "Wow Moment Timestamp",
    ];

    const csv = exportToCSV(csvData, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="video-metrics-${start.toISOString().split("T")[0]}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    baseLogger.error({ err: error }, "Error exporting video metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/aov
// Get average order value metrics
// ============================================================

router.get("/aov", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);

    const metrics = await AOVMetrics.findOne({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    }).sort({ "period.start": -1 });

    if (!metrics) {
      return res.json({
        success: true,
        period: { start, end },
        metrics: {
          avgOrderValue: 0,
          medianOrderValue: 0,
          totalRevenue: 0,
          totalOrders: 0,
        },
      });
    }

    res.json({
      success: true,
      period: { start, end },
      metrics: metrics.metrics,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error fetching AOV metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/dm
// Get DM response time metrics
// ============================================================

router.get("/dm", async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const { platform = "all" } = req.query;

    const metrics = await DMMetrics.findOne({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
      platform,
    }).sort({ "period.start": -1 });

    if (!metrics) {
      return res.json({
        success: true,
        period: { start, end },
        metrics: {
          totalMessages: 0,
          responseTime: { avg: 0 },
          responseRate: 0,
        },
      });
    }

    res.json({
      success: true,
      period: { start, end },
      platform,
      metrics: metrics.metrics,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error fetching DM metrics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/metrics/dashboard
// Get aggregated dashboard snapshot
// ============================================================

router.get("/dashboard", async (req, res) => {
  try {
    const { period = "daily" } = req.query;
    const { start, end } = parseDateRange(req);

    const snapshot = await DashboardSnapshot.findOne({
      period,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    if (!snapshot) {
      return res.json({
        success: true,
        period,
        summary: {
          topSKUs: [],
          videoPerformance: {
            totalPlays: 0,
            avgWowMomentReach: 0,
            topVideos: [],
          },
          avgOrderValue: 0,
          dmResponseTime: { avg: 0, under1h: 0 },
        },
      });
    }

    res.json({
      success: true,
      period,
      date: snapshot.date,
      summary: snapshot.summary,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error fetching dashboard snapshot");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/metrics/track/view
// Track product view
// ============================================================

router.post("/track/view", async (req, res) => {
  try {
    const { sku, sessionId, uniqueView = false } = req.body;

    if (!sku) {
      return res.status(400).json({
        success: false,
        error: "SKU is required",
      });
    }

    // Find or create metrics for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let metrics = await SKUMetrics.findOne({
      sku,
      "period.start": { $gte: today },
      "period.end": { $lt: tomorrow },
    });

    if (!metrics) {
      metrics = new SKUMetrics({
        sku,
        period: { start: today, end: tomorrow },
      });
    }

    metrics.metrics.views += 1;
    if (uniqueView) {
      metrics.metrics.uniqueViews += 1;
    }

    await metrics.save();

    res.json({
      success: true,
      message: "View tracked",
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error tracking view");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/metrics/track/buy-now
// Track Buy Now button click
// ============================================================

router.post("/track/buy-now", async (req, res) => {
  try {
    const { sku } = req.body;

    if (!sku) {
      return res.status(400).json({
        success: false,
        error: "SKU is required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let metrics = await SKUMetrics.findOne({
      sku,
      "period.start": { $gte: today },
      "period.end": { $lt: tomorrow },
    });

    if (!metrics) {
      metrics = new SKUMetrics({
        sku,
        period: { start: today, end: tomorrow },
      });
    }

    metrics.metrics.buyNowClicks += 1;

    // Recalculate CTR
    if (metrics.metrics.views > 0) {
      metrics.metrics.buyNowCTR =
        metrics.metrics.buyNowClicks / metrics.metrics.views;
    }

    await metrics.save();

    res.json({
      success: true,
      message: "Buy Now click tracked",
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error tracking buy now click");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/metrics/track/video
// Track video engagement
// ============================================================

router.post("/track/video", async (req, res) => {
  try {
    const { videoId, sku, event, timestamp, watchPercentage } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "videoId is required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let metrics = await VideoMetrics.findOne({
      videoId,
      "period.start": { $gte: today },
      "period.end": { $lt: tomorrow },
    });

    if (!metrics) {
      metrics = new VideoMetrics({
        videoId,
        sku,
        period: { start: today, end: tomorrow },
      });
    }

    // Track different events
    switch (event) {
      case "play":
        metrics.metrics.plays += 1;
        break;
      case "completion":
        metrics.metrics.completions += 1;
        metrics.metrics.completionRate =
          metrics.metrics.completions / metrics.metrics.plays;
        break;
      case "wow_moment":
        metrics.metrics.wowMomentReached += 1;
        metrics.metrics.wowMomentReachRate =
          metrics.metrics.wowMomentReached / metrics.metrics.plays;
        if (timestamp) {
          metrics.metrics.wowMomentTimestamp = timestamp;
        }
        break;
      case "progress":
        // Update avg watch percentage
        if (watchPercentage !== undefined) {
          const currentAvg = metrics.metrics.avgWatchPercentage || 0;
          const plays = metrics.metrics.plays || 1;
          metrics.metrics.avgWatchPercentage =
            (currentAvg * (plays - 1) + watchPercentage) / plays;
        }
        break;
    }

    await metrics.save();

    res.json({
      success: true,
      message: "Video event tracked",
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Error tracking video event");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
