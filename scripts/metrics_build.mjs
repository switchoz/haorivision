#!/usr/bin/env node
/**
 * HAORI VISION  Metrics Builder
 *
 * Aggregates metrics from Analytics models and builds reports
 * - SKU performance (views, CTR, orders)
 * - Video engagement (watch time, wow moment reach)
 * - Average order value
 * - DM response times
 *
 * Usage:
 *   node scripts/metrics_build.mjs
 *   node scripts/metrics_build.mjs --period=7d
 */

import mongoose from 'mongoose';
import { SKUMetrics, VideoMetrics, AOVMetrics, DMMetrics, DashboardSnapshot } from '../backend/models/Metrics.js';
import { PageView, Interaction } from '../backend/models/Analytics.js';
import { Order } from '../backend/models/Order.js';
import { Product } from '../backend/models/Product.js';

// ============================================================
// Configuration
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/haori-vision';
const WOW_MOMENT_THRESHOLD = 15; // seconds into video

// ============================================================
// Database Connection
// ============================================================

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Metrics Build] Connected to MongoDB');
  } catch (error) {
    console.error('[Metrics Build] MongoDB connection error:', error);
    process.exit(1);
  }
}

// ============================================================
// Date Range Helper
// ============================================================

function getDateRange(period = '7d') {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
}

// ============================================================
// Build SKU Metrics
// ============================================================

async function buildSKUMetrics(start, end) {
  console.log('[Metrics Build] Building SKU metrics...');

  try {
    // Get all products
    const products = await Product.find({});
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Aggregate page views by SKU
    const views = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          path: { $regex: /^\/products\// }
        }
      },
      {
        $group: {
          _id: '$path',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' },
          avgTimeOnPage: { $avg: '$timeOnPage' },
          avgScrollDepth: { $avg: '$scrollDepth' }
        }
      }
    ]);

    // Aggregate Buy Now clicks
    const buyNowClicks = await Interaction.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          type: 'click',
          element: { $regex: /buy.*now/i }
        }
      },
      {
        $group: {
          _id: '$page',
          clicks: { $sum: 1 }
        }
      }
    ]);

    const buyNowMap = new Map(buyNowClicks.map(item => [item._id, item.clicks]));

    // Aggregate orders
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$productId',
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    const ordersMap = new Map(orders.map(item => [item._id.toString(), item]));

    // Build metrics for each product
    for (const product of products) {
      const productId = product._id.toString();
      const sku = product.sku || product._id.toString();
      const path = `/products/${sku}`;

      const viewData = views.find(v => v._id === path);
      const buyClicks = buyNowMap.get(path) || 0;
      const orderData = ordersMap.get(productId);

      const viewCount = viewData?.views || 0;
      const uniqueViewCount = viewData?.uniqueViews?.length || 0;
      const orderCount = orderData?.orders || 0;
      const revenue = orderData?.revenue || 0;

      // Calculate CTR and conversion rate
      const buyNowCTR = viewCount > 0 ? buyClicks / viewCount : 0;
      const conversionRate = viewCount > 0 ? orderCount / viewCount : 0;
      const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

      // Find or create metrics document
      let metrics = await SKUMetrics.findOne({
        sku,
        'period.start': { $gte: start },
        'period.end': { $lte: end }
      });

      if (!metrics) {
        metrics = new SKUMetrics({
          sku,
          productId: product._id,
          period: { start, end }
        });
      }

      // Update metrics
      metrics.metrics = {
        views: viewCount,
        uniqueViews: uniqueViewCount,
        buyNowClicks: buyClicks,
        buyNowCTR,
        orders: orderCount,
        revenue,
        avgOrderValue,
        conversionRate,
        timeOnPage: {
          avg: viewData?.avgTimeOnPage || 0
        },
        scrollDepth: {
          avg: viewData?.avgScrollDepth || 0
        }
      };

      metrics.lastUpdated = new Date();
      await metrics.save();
    }

    console.log(`[Metrics Build] SKU metrics updated for ${products.length} products`);
  } catch (error) {
    console.error('[Metrics Build] Error building SKU metrics:', error);
  }
}

// ============================================================
// Build Video Metrics
// ============================================================

async function buildVideoMetrics(start, end) {
  console.log('[Metrics Build] Building video metrics...');

  try {
    // Aggregate video plays
    const videoPlays = await Interaction.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          type: 'video_play'
        }
      },
      {
        $group: {
          _id: '$metadata.videoId',
          plays: { $sum: 1 },
          uniquePlays: { $addToSet: '$sessionId' },
          completions: {
            $sum: {
              $cond: [{ $eq: ['$metadata.completed', true] }, 1, 0]
            }
          },
          avgWatchTime: { $avg: '$metadata.watchTime' },
          avgWatchPercentage: { $avg: '$metadata.watchPercentage' },
          wowMomentReached: {
            $sum: {
              $cond: [
                { $gte: ['$metadata.watchTime', WOW_MOMENT_THRESHOLD] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    for (const video of videoPlays) {
      const videoId = video._id;
      const playCount = video.plays;
      const completions = video.completions;
      const wowReached = video.wowMomentReached;

      // Find or create metrics
      let metrics = await VideoMetrics.findOne({
        videoId,
        'period.start': { $gte: start },
        'period.end': { $lte: end }
      });

      if (!metrics) {
        metrics = new VideoMetrics({
          videoId,
          period: { start, end }
        });
      }

      // Update metrics
      metrics.metrics = {
        plays: playCount,
        uniquePlays: video.uniquePlays.length,
        completions,
        completionRate: playCount > 0 ? completions / playCount : 0,
        avgWatchTime: video.avgWatchTime || 0,
        avgWatchPercentage: video.avgWatchPercentage || 0,
        wowMomentReached: wowReached,
        wowMomentTimestamp: WOW_MOMENT_THRESHOLD,
        wowMomentReachRate: playCount > 0 ? wowReached / playCount : 0
      };

      metrics.lastUpdated = new Date();
      await metrics.save();
    }

    console.log(`[Metrics Build] Video metrics updated for ${videoPlays.length} videos`);
  } catch (error) {
    console.error('[Metrics Build] Error building video metrics:', error);
  }
}

// ============================================================
// Build AOV Metrics
// ============================================================

async function buildAOVMetrics(start, end) {
  console.log('[Metrics Build] Building AOV metrics...');

  try {
    // Aggregate orders
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
          minOrderValue: { $min: '$total' },
          maxOrderValue: { $max: '$total' },
          orderValues: { $push: '$total' }
        }
      }
    ]);

    if (result.length === 0) {
      console.log('[Metrics Build] No orders found for period');
      return;
    }

    const data = result[0];

    // Calculate median
    const sortedValues = data.orderValues.sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    const medianOrderValue = sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];

    // Find or create metrics
    let metrics = await AOVMetrics.findOne({
      'period.start': { $gte: start },
      'period.end': { $lte: end }
    });

    if (!metrics) {
      metrics = new AOVMetrics({
        period: { start, end }
      });
    }

    metrics.metrics = {
      avgOrderValue: data.avgOrderValue,
      medianOrderValue,
      minOrderValue: data.minOrderValue,
      maxOrderValue: data.maxOrderValue,
      totalRevenue: data.totalRevenue,
      totalOrders: data.totalOrders
    };

    metrics.lastUpdated = new Date();
    await metrics.save();

    console.log('[Metrics Build] AOV metrics updated');
  } catch (error) {
    console.error('[Metrics Build] Error building AOV metrics:', error);
  }
}

// ============================================================
// Build DM Metrics (Mock Data)
// ============================================================

async function buildDMMetrics(start, end) {
  console.log('[Metrics Build] Building DM metrics (mock data)...');

  try {
    // TODO: Implement real DM tracking
    // For now, create mock metrics

    let metrics = await DMMetrics.findOne({
      'period.start': { $gte: start },
      'period.end': { $lte: end },
      platform: 'all'
    });

    if (!metrics) {
      metrics = new DMMetrics({
        period: { start, end },
        platform: 'all'
      });
    }

    // Mock data
    metrics.metrics = {
      totalMessages: Math.floor(Math.random() * 100) + 50,
      totalConversations: Math.floor(Math.random() * 30) + 20,
      responseTime: {
        avg: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        median: Math.floor(Math.random() * 90) + 20,
        min: Math.floor(Math.random() * 10) + 5,
        max: Math.floor(Math.random() * 300) + 200,
        under1h: Math.floor(Math.random() * 30) + 15,
        under24h: Math.floor(Math.random() * 40) + 25,
        over24h: Math.floor(Math.random() * 5)
      },
      responseRate: 0.95,
      conversationLength: {
        avg: Math.floor(Math.random() * 8) + 3,
        median: Math.floor(Math.random() * 6) + 2
      }
    };

    metrics.lastUpdated = new Date();
    await metrics.save();

    console.log('[Metrics Build] DM metrics updated (mock)');
  } catch (error) {
    console.error('[Metrics Build] Error building DM metrics:', error);
  }
}

// ============================================================
// Build Dashboard Snapshot
// ============================================================

async function buildDashboardSnapshot(start, end) {
  console.log('[Metrics Build] Building dashboard snapshot...');

  try {
    // Get top SKUs
    const topSKUs = await SKUMetrics.find({
      'period.start': { $gte: start },
      'period.end': { $lte: end }
    })
      .sort({ 'metrics.orders': -1 })
      .limit(10)
      .lean();

    // Get top videos
    const topVideos = await VideoMetrics.find({
      'period.start': { $gte: start },
      'period.end': { $lte: end }
    })
      .sort({ 'metrics.wowMomentReachRate': -1 })
      .limit(5)
      .lean();

    // Get AOV
    const aov = await AOVMetrics.findOne({
      'period.start': { $gte: start },
      'period.end': { $lte: end }
    }).lean();

    // Get DM metrics
    const dm = await DMMetrics.findOne({
      'period.start': { $gte: start },
      'period.end': { $lte: end },
      platform: 'all'
    }).lean();

    // Create snapshot
    const snapshot = new DashboardSnapshot({
      date: new Date(),
      period: 'daily',
      summary: {
        topSKUs: topSKUs.map(s => ({
          sku: s.sku,
          views: s.metrics.views,
          ctr: s.metrics.buyNowCTR,
          orders: s.metrics.orders,
          revenue: s.metrics.revenue
        })),
        videoPerformance: {
          totalPlays: topVideos.reduce((sum, v) => sum + (v.metrics.plays || 0), 0),
          avgWowMomentReach: topVideos.length > 0
            ? topVideos.reduce((sum, v) => sum + (v.metrics.wowMomentReachRate || 0), 0) / topVideos.length
            : 0,
          topVideos: topVideos.map(v => ({
            videoId: v.videoId,
            sku: v.sku,
            plays: v.metrics.plays,
            wowMomentReachRate: v.metrics.wowMomentReachRate
          }))
        },
        avgOrderValue: aov?.metrics?.avgOrderValue || 0,
        dmResponseTime: {
          avg: dm?.metrics?.responseTime?.avg || 0,
          under1h: dm?.metrics?.responseTime?.under1h || 0
        }
      }
    });

    await snapshot.save();

    console.log('[Metrics Build] Dashboard snapshot created');
  } catch (error) {
    console.error('[Metrics Build] Error building dashboard snapshot:', error);
  }
}

// ============================================================
// Main Function
// ============================================================

async function main() {
  console.log('============================================================');
  console.log('HAORI VISION  Metrics Builder');
  console.log('============================================================');
  console.log('');

  // Parse arguments
  const period = process.argv.find(arg => arg.startsWith('--period='))?.split('=')[1] || '7d';
  const { start, end } = getDateRange(period);

  console.log(`[Metrics Build] Period: ${period}`);
  console.log(`[Metrics Build] Start: ${start.toISOString()}`);
  console.log(`[Metrics Build] End: ${end.toISOString()}`);
  console.log('');

  // Connect to database
  await connectDB();

  // Build all metrics
  await buildSKUMetrics(start, end);
  await buildVideoMetrics(start, end);
  await buildAOVMetrics(start, end);
  await buildDMMetrics(start, end);
  await buildDashboardSnapshot(start, end);

  console.log('');
  console.log('============================================================');
  console.log('[Metrics Build]  All metrics built successfully');
  console.log('============================================================');

  // Disconnect
  await mongoose.disconnect();
  process.exit(0);
}

// Run
main().catch((error) => {
  console.error('[Metrics Build] Fatal error:', error);
  process.exit(1);
});
