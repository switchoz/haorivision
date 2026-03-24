import express from "express";
import growthAnalyticsService from "../services/growthAnalyticsService.js";
import sentimentAnalysisService from "../services/sentimentAnalysisService.js";
import pdfReportService from "../services/pdfReportService.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * POST /api/analytics/page-view
 * Track page view
 */
router.post("/page-view", async (req, res) => {
  try {
    const result = await growthAnalyticsService.trackPageView(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/interaction
 * Track user interaction
 */
router.post("/interaction", async (req, res) => {
  try {
    const result = await growthAnalyticsService.trackInteraction(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/conversion
 * Track conversion
 */
router.post("/conversion", async (req, res) => {
  try {
    const result = await growthAnalyticsService.trackConversion(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/review
 * Analyze and save review sentiment
 */
router.post("/review", async (req, res) => {
  try {
    const result = await sentimentAnalysisService.analyzeAndSaveReview(
      req.body,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/sales
 * Get sales analytics
 */
router.get("/sales", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await growthAnalyticsService.getSalesAnalytics(
      start,
      end,
    );

    res.json({
      success: true,
      analytics: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/traffic
 * Get traffic analytics
 */
router.get("/traffic", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await growthAnalyticsService.getTrafficAnalytics(
      start,
      end,
    );

    res.json({
      success: true,
      analytics: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/social
 * Get social media analytics
 */
router.get("/social", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await growthAnalyticsService.getSocialAnalytics(
      start,
      end,
    );

    res.json({
      success: true,
      analytics: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/sentiment
 * Get sentiment analytics
 */
router.get("/sentiment", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await growthAnalyticsService.getSentimentAnalytics(
      start,
      end,
    );

    res.json({
      success: true,
      analytics: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/product/:productId/sentiment
 * Get sentiment for specific product
 */
router.get("/product/:productId/sentiment", async (req, res) => {
  try {
    const { productId } = req.params;

    const sentiment =
      await sentimentAnalysisService.getProductSentiment(productId);

    res.json({
      success: true,
      sentiment: sentiment,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/reviews/positive
 * Get top positive reviews
 */
router.get("/reviews/positive", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reviews = await sentimentAnalysisService.getTopPositiveReviews(
      parseInt(limit),
    );

    res.json({
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/reviews/negative
 * Get negative reviews for handling
 */
router.get("/reviews/negative", async (req, res) => {
  try {
    const reviews = await sentimentAnalysisService.getNegativeReviews();

    res.json({
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/report/weekly
 * Generate weekly report
 */
router.post("/report/weekly", async (req, res) => {
  try {
    const reportResult = await growthAnalyticsService.createWeeklyReport();

    if (!reportResult.success) {
      return res.status(500).json(reportResult);
    }

    // Generate PDF
    const pdfResult = await pdfReportService.generateLightImpactReport(
      reportResult.report,
    );

    if (pdfResult.success) {
      // Update report with PDF URL
      reportResult.report.pdfUrl = pdfResult.url;
      await reportResult.report.save();
    }

    res.json({
      success: true,
      report: reportResult.report,
      pdf: pdfResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/reports
 * Get all weekly reports
 */
router.get("/reports", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reports = await growthAnalyticsService.getAllReports(parseInt(limit));

    res.json({
      success: true,
      reports: reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/reports/latest
 * Get latest weekly report
 */
router.get("/reports/latest", async (req, res) => {
  try {
    const report = await growthAnalyticsService.getLatestReport();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "No reports found",
      });
    }

    res.json({
      success: true,
      report: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get complete dashboard data
 */
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [sales, traffic, social, sentiment, conversions] = await Promise.all([
      growthAnalyticsService.getSalesAnalytics(start, end),
      growthAnalyticsService.getTrafficAnalytics(start, end),
      growthAnalyticsService.getSocialAnalytics(start, end),
      growthAnalyticsService.getSentimentAnalytics(start, end),
      growthAnalyticsService.getConversionAnalytics(start, end),
    ]);

    const metrics = {
      sales: sales,
      traffic: traffic,
      social: social,
      sentiment: sentiment,
      conversions: conversions,
    };

    const insights = growthAnalyticsService.generateInsights(metrics);
    const recommendations =
      growthAnalyticsService.generateRecommendations(metrics);

    res.json({
      success: true,
      period: {
        start: start,
        end: end,
      },
      metrics: metrics,
      insights: insights,
      recommendations: recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/metrics
 * Get Light Metrics Dashboard data
 */
router.get("/metrics", async (req, res) => {
  try {
    const { startDate, endDate, newProductsOnly } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Import models
    const { default: Product } = await import("../models/Product.js");
    const { default: Order } = await import("../models/Order.js");
    const { default: PageView } = await import(
      "../analytics/models/PageView.js"
    );
    const { default: Interaction } = await import(
      "../analytics/models/Interaction.js"
    );

    // Build product filter
    const productFilter = {};
    if (newProductsOnly === "true") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      productFilter.createdAt = { $gte: thirtyDaysAgo };
    }

    // Get all products
    const products = await Product.find(productFilter).lean();
    const productIds = products.map((p) => p._id.toString());

    // Get SKU metrics
    const skuMetrics = await Promise.all(
      products.map(async (product) => {
        const productId = product._id.toString();

        // Views
        const views = await PageView.countDocuments({
          page: { $regex: `/product/${productId}`, $options: "i" },
          timestamp: { $gte: start, $lte: end },
        });

        // Buy Now clicks
        const buyClicks = await Interaction.countDocuments({
          interactionType: "button_click",
          metadata: { $regex: productId },
          label: { $in: ["buy_now", "add_to_cart"] },
          timestamp: { $gte: start, $lte: end },
        });

        // Orders
        const orders = await Order.countDocuments({
          "items.productId": product._id,
          createdAt: { $gte: start, $lte: end },
        });

        // Revenue
        const orderData = await Order.aggregate([
          {
            $match: {
              "items.productId": product._id,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $unwind: "$items",
          },
          {
            $match: {
              "items.productId": product._id,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: { $multiply: ["$items.price", "$items.quantity"] },
              },
            },
          },
        ]);

        const revenue = orderData.length > 0 ? orderData[0].totalRevenue : 0;

        return {
          sku: product.sku || product._id.toString(),
          name: product.name,
          views: views,
          buyClicks: buyClicks,
          orders: orders,
          revenue: revenue,
          conversionRate:
            views > 0 ? ((orders / views) * 100).toFixed(2) : "0.00",
        };
      }),
    );

    // Reels engagement (mock data - replace with real social media API)
    const reelsEngagement = {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      views: [12500, 18300, 24600, 31200],
      likes: [890, 1240, 1680, 2150],
      comments: [56, 78, 102, 134],
      shares: [34, 52, 71, 89],
      savesReels: [123, 178, 234, 298],
    };

    // Average order value
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          avgOrderValue: { $avg: "$totalPrice" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const averageCheck =
      orderStats.length > 0 ? orderStats[0].avgOrderValue : 0;
    const totalOrders = orderStats.length > 0 ? orderStats[0].totalOrders : 0;
    const totalRevenue = orderStats.length > 0 ? orderStats[0].totalRevenue : 0;

    // Average DM response time (mock data - replace with real CRM data)
    const avgDMResponseTime = {
      value: 2.5, // hours
      trend: "improving", // improving, worsening, stable
      last7Days: [3.2, 2.8, 2.6, 2.4, 2.3, 2.5, 2.5],
    };

    res.json({
      success: true,
      period: {
        start: start,
        end: end,
      },
      filters: {
        newProductsOnly: newProductsOnly === "true",
      },
      metrics: {
        skuMetrics: skuMetrics.sort((a, b) => b.revenue - a.revenue),
        reelsEngagement: reelsEngagement,
        averageCheck: averageCheck,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        avgDMResponseTime: avgDMResponseTime,
      },
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Metrics dashboard error");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
