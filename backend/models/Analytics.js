import mongoose from "mongoose";

/**
 * Analytics Models - Growth Analytics для HAORI VISION
 */

// Page View Tracking
const pageViewSchema = new mongoose.Schema({
  sessionId: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  page: String,
  path: String,
  referrer: String,
  userAgent: String,
  country: String,
  city: String,
  device: {
    type: String,
    enum: ["mobile", "tablet", "desktop"],
  },
  timeOnPage: Number, // seconds
  scrollDepth: Number, // percentage
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

pageViewSchema.index({ sessionId: 1 });
pageViewSchema.index({ clientId: 1 });
pageViewSchema.index({ timestamp: -1 });

// Interaction Tracking (clicks, hovers, etc)
const interactionSchema = new mongoose.Schema({
  sessionId: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  type: {
    type: String,
    enum: [
      "click",
      "hover",
      "scroll",
      "form_submit",
      "video_play",
      "product_view",
      "add_to_cart",
    ],
  },
  element: String,
  elementId: String,
  page: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

interactionSchema.index({ sessionId: 1 });
interactionSchema.index({ type: 1 });
interactionSchema.index({ timestamp: -1 });

// Conversion Tracking
const conversionSchema = new mongoose.Schema({
  sessionId: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  type: {
    type: String,
    enum: [
      "purchase",
      "signup",
      "newsletter",
      "event_rsvp",
      "consultation_booked",
      "social_share",
    ],
  },
  source: String,
  medium: String,
  campaign: String,
  value: Number,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

conversionSchema.index({ type: 1 });
conversionSchema.index({ timestamp: -1 });

// Sales Analytics
const salesAnalyticsSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  productCollection: String,
  country: String,
  city: String,
  amount: Number,
  currency: String,
  paymentMethod: String,
  source: String, // website, tiktok, instagram
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

salesAnalyticsSchema.index({ productCollection: 1 });
salesAnalyticsSchema.index({ country: 1 });
salesAnalyticsSchema.index({ timestamp: -1 });

// Review Sentiment
const reviewSentimentSchema = new mongoose.Schema({
  reviewId: String,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  text: String,
  rating: Number,
  sentiment: {
    score: Number, // -1 to 1
    label: {
      type: String,
      enum: ["negative", "neutral", "positive"],
    },
    emotions: {
      joy: Number,
      love: Number,
      surprise: Number,
      sadness: Number,
      anger: Number,
    },
  },
  language: String,
  source: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

reviewSentimentSchema.index({ productId: 1 });
reviewSentimentSchema.index({ "sentiment.label": 1 });
reviewSentimentSchema.index({ timestamp: -1 });

// Weekly Report
const weeklyReportSchema = new mongoose.Schema({
  weekStart: Date,
  weekEnd: Date,
  metrics: {
    sales: {
      total: Number,
      byCollection: mongoose.Schema.Types.Mixed,
      byCountry: mongoose.Schema.Types.Mixed,
      topProducts: Array,
    },
    traffic: {
      totalViews: Number,
      uniqueVisitors: Number,
      avgTimeOnSite: Number,
      bounceRate: Number,
      topPages: Array,
    },
    social: {
      tiktok: {
        views: Number,
        likes: Number,
        shares: Number,
        cartAdds: Number,
      },
      instagram: {
        reach: Number,
        engagement: Number,
        profileVisits: Number,
      },
    },
    sentiment: {
      avgScore: Number,
      totalReviews: Number,
      distribution: {
        positive: Number,
        neutral: Number,
        negative: Number,
      },
    },
    conversions: {
      total: Number,
      rate: Number,
      byType: mongoose.Schema.Types.Mixed,
    },
  },
  insights: [String],
  recommendations: [String],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  pdfUrl: String,
});

weeklyReportSchema.index({ weekStart: -1 });

export const PageView = mongoose.model("PageView", pageViewSchema);
export const Interaction = mongoose.model("Interaction", interactionSchema);
export const Conversion = mongoose.model("Conversion", conversionSchema);
export const SalesAnalytics = mongoose.model(
  "SalesAnalytics",
  salesAnalyticsSchema,
);
export const ReviewSentiment = mongoose.model(
  "ReviewSentiment",
  reviewSentimentSchema,
);
export const WeeklyReport = mongoose.model("WeeklyReport", weeklyReportSchema);
