import mongoose from "mongoose";

/**
 * HAORI VISION  Metrics Models
 *
 * Track SKU performance, video engagement, and DM response times
 */

// ============================================================
// SKU Performance Metrics
// ============================================================

const skuMetricsSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  period: {
    start: Date,
    end: Date,
  },
  metrics: {
    views: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    buyNowClicks: {
      type: Number,
      default: 0,
    },
    buyNowCTR: {
      type: Number,
      default: 0,
    }, // clicks / views
    orders: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    avgOrderValue: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
    }, // orders / views
    addToCartClicks: {
      type: Number,
      default: 0,
    },
    wishlistAdds: {
      type: Number,
      default: 0,
    },
    timeOnPage: {
      avg: Number,
      median: Number,
      max: Number,
    },
    scrollDepth: {
      avg: Number,
      over50: Number, // % users who scrolled >50%
      over75: Number,
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

skuMetricsSchema.index({ sku: 1, "period.start": -1 });
skuMetricsSchema.index({ "metrics.orders": -1 });
skuMetricsSchema.index({ "metrics.buyNowCTR": -1 });

// ============================================================
// Video Engagement Metrics
// ============================================================

const videoMetricsSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  sku: String,
  videoUrl: String,
  period: {
    start: Date,
    end: Date,
  },
  metrics: {
    plays: {
      type: Number,
      default: 0,
    },
    uniquePlays: {
      type: Number,
      default: 0,
    },
    completions: {
      type: Number,
      default: 0,
    }, // watched to end
    completionRate: {
      type: Number,
      default: 0,
    }, // completions / plays
    avgWatchTime: {
      type: Number,
      default: 0,
    }, // seconds
    avgWatchPercentage: {
      type: Number,
      default: 0,
    }, // 0-100
    wowMomentReached: {
      type: Number,
      default: 0,
    }, // users who reached "wow moment" timestamp
    wowMomentTimestamp: {
      type: Number,
      default: 0,
    }, // seconds into video
    wowMomentReachRate: {
      type: Number,
      default: 0,
    }, // wowMomentReached / plays
    dropOffPoints: [
      {
        timestamp: Number, // seconds
        dropOffCount: Number,
        dropOffRate: Number, // % of viewers
      },
    ],
    engagementBySegment: [
      {
        start: Number, // seconds
        end: Number,
        avgWatchRate: Number, // % of viewers who watched this segment
        replayCount: Number, // how many times this segment was replayed
      },
    ],
    deviceBreakdown: {
      mobile: Number,
      tablet: Number,
      desktop: Number,
    },
    qualityViews: {
      "1080p": Number,
      "720p": Number,
      "480p": Number,
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

videoMetricsSchema.index({ videoId: 1, "period.start": -1 });
videoMetricsSchema.index({ sku: 1 });
videoMetricsSchema.index({ "metrics.wowMomentReachRate": -1 });

// ============================================================
// DM Response Time Metrics
// ============================================================

const dmMetricsSchema = new mongoose.Schema({
  period: {
    start: Date,
    end: Date,
  },
  platform: {
    type: String,
    enum: ["instagram", "tiktok", "discord", "telegram", "whatsapp", "all"],
    default: "all",
  },
  metrics: {
    totalMessages: {
      type: Number,
      default: 0,
    },
    totalConversations: {
      type: Number,
      default: 0,
    },
    responseTime: {
      avg: Number, // minutes
      median: Number,
      min: Number,
      max: Number,
      under1h: Number, // count
      under24h: Number,
      over24h: Number,
    },
    responseRate: {
      type: Number,
      default: 0,
    }, // % of messages that got a response
    conversationLength: {
      avg: Number, // number of messages
      median: Number,
    },
    resolutionRate: {
      type: Number,
      default: 0,
    }, // % of conversations marked as resolved
    satisfactionScore: {
      avg: Number, // 1-5
      total: Number,
      distribution: {
        5: Number,
        4: Number,
        3: Number,
        2: Number,
        1: Number,
      },
    },
    topTopics: [
      {
        topic: String,
        count: Number,
        avgResponseTime: Number,
      },
    ],
    busyHours: [
      {
        hour: Number, // 0-23
        messageCount: Number,
      },
    ],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

dmMetricsSchema.index({ "period.start": -1 });
dmMetricsSchema.index({ platform: 1 });

// ============================================================
// Average Order Value Metrics
// ============================================================

const aovMetricsSchema = new mongoose.Schema({
  period: {
    start: Date,
    end: Date,
  },
  metrics: {
    avgOrderValue: {
      type: Number,
      default: 0,
    },
    medianOrderValue: {
      type: Number,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxOrderValue: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    orderValueDistribution: [
      {
        range: String, // e.g., "0-100", "100-200"
        count: Number,
        percentage: Number,
      },
    ],
    avgItemsPerOrder: {
      type: Number,
      default: 0,
    },
    byCollection: [
      {
        productCollection: String,
        avgOrderValue: Number,
        orders: Number,
      },
    ],
    byCountry: [
      {
        country: String,
        avgOrderValue: Number,
        orders: Number,
      },
    ],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

aovMetricsSchema.index({ "period.start": -1 });

// ============================================================
// Aggregated Dashboard Snapshot
// ============================================================

const dashboardSnapshotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  period: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    default: "daily",
  },
  summary: {
    topSKUs: [
      {
        sku: String,
        views: Number,
        ctr: Number,
        orders: Number,
        revenue: Number,
      },
    ],
    videoPerformance: {
      totalPlays: Number,
      avgWowMomentReach: Number,
      topVideos: [
        {
          videoId: String,
          sku: String,
          plays: Number,
          wowMomentReachRate: Number,
        },
      ],
    },
    avgOrderValue: Number,
    dmResponseTime: {
      avg: Number,
      under1h: Number,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

dashboardSnapshotSchema.index({ date: -1 });
dashboardSnapshotSchema.index({ period: 1, date: -1 });

// ============================================================
// Export Models
// ============================================================

export const SKUMetrics = mongoose.model("SKUMetrics", skuMetricsSchema);
export const VideoMetrics = mongoose.model("VideoMetrics", videoMetricsSchema);
export const DMMetrics = mongoose.model("DMMetrics", dmMetricsSchema);
export const AOVMetrics = mongoose.model("AOVMetrics", aovMetricsSchema);
export const DashboardSnapshot = mongoose.model(
  "DashboardSnapshot",
  dashboardSnapshotSchema,
);
