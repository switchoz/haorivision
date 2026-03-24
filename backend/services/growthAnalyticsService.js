import {
  PageView,
  Interaction,
  Conversion,
  SalesAnalytics,
  ReviewSentiment,
  WeeklyReport,
} from "../models/Analytics.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { SocialPost } from "../models/SocialPost.js";

/**
 * Growth Analytics Service
 * Полная система аналитики для HAORI VISION
 */

class GrowthAnalyticsService {
  /**
   * Track page view
   */
  async trackPageView(data) {
    try {
      const pageView = new PageView({
        sessionId: data.sessionId,
        clientId: data.clientId,
        page: data.page,
        path: data.path,
        referrer: data.referrer,
        userAgent: data.userAgent,
        country: data.country,
        city: data.city,
        device: this.detectDevice(data.userAgent),
        timeOnPage: data.timeOnPage,
        scrollDepth: data.scrollDepth,
      });

      await pageView.save();

      return { success: true, id: pageView._id };
    } catch (error) {
      console.error("Track page view error:", error);
      return { success: false };
    }
  }

  /**
   * Track interaction
   */
  async trackInteraction(data) {
    try {
      const interaction = new Interaction({
        sessionId: data.sessionId,
        clientId: data.clientId,
        type: data.type,
        element: data.element,
        elementId: data.elementId,
        page: data.page,
        metadata: data.metadata,
      });

      await interaction.save();

      return { success: true };
    } catch (error) {
      console.error("Track interaction error:", error);
      return { success: false };
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(data) {
    try {
      const conversion = new Conversion({
        sessionId: data.sessionId,
        clientId: data.clientId,
        type: data.type,
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        value: data.value,
        metadata: data.metadata,
      });

      await conversion.save();

      return { success: true };
    } catch (error) {
      console.error("Track conversion error:", error);
      return { success: false };
    }
  }

  /**
   * Track sale
   */
  async trackSale(order, product) {
    try {
      const salesRecord = new SalesAnalytics({
        orderId: order._id,
        productId: product._id,
        collection: product.collection,
        country: order.shipping?.country,
        city: order.shipping?.city,
        amount: order.totals?.total,
        currency: "USD",
        paymentMethod: order.payment?.method,
        source: order.metadata?.source || "website",
      });

      await salesRecord.save();

      return { success: true };
    } catch (error) {
      console.error("Track sale error:", error);
      return { success: false };
    }
  }

  /**
   * Detect device type from user agent
   */
  detectDevice(userAgent) {
    if (!userAgent) return "desktop";

    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua,
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  /**
   * Получить статистику продаж
   */
  async getSalesAnalytics(startDate, endDate) {
    try {
      const sales = await SalesAnalytics.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Total sales
      const total = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

      // By collection
      const byCollection = {};
      sales.forEach((sale) => {
        if (sale.collection) {
          byCollection[sale.collection] =
            (byCollection[sale.collection] || 0) + sale.amount;
        }
      });

      // By country
      const byCountry = {};
      sales.forEach((sale) => {
        if (sale.country) {
          byCountry[sale.country] =
            (byCountry[sale.country] || 0) + sale.amount;
        }
      });

      // Top products
      const productSales = {};
      sales.forEach((sale) => {
        if (sale.productId) {
          const id = sale.productId.toString();
          productSales[id] = (productSales[id] || 0) + sale.amount;
        }
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, amount]) => ({ productId, amount }));

      return {
        total: total,
        count: sales.length,
        byCollection: byCollection,
        byCountry: byCountry,
        topProducts: topProducts,
      };
    } catch (error) {
      console.error("Get sales analytics error:", error);
      return null;
    }
  }

  /**
   * Получить статистику трафика
   */
  async getTrafficAnalytics(startDate, endDate) {
    try {
      const pageViews = await PageView.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Unique visitors (by sessionId)
      const uniqueSessions = new Set(pageViews.map((pv) => pv.sessionId)).size;

      // Average time on site
      const avgTimeOnPage =
        pageViews.reduce((sum, pv) => sum + (pv.timeOnPage || 0), 0) /
          pageViews.length || 0;

      // Bounce rate (sessions with only 1 page view)
      const sessionPageCounts = {};
      pageViews.forEach((pv) => {
        sessionPageCounts[pv.sessionId] =
          (sessionPageCounts[pv.sessionId] || 0) + 1;
      });
      const bouncedSessions = Object.values(sessionPageCounts).filter(
        (count) => count === 1,
      ).length;
      const bounceRate =
        uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : 0;

      // Top pages
      const pageCounts = {};
      pageViews.forEach((pv) => {
        pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({ page, views: count }));

      return {
        totalViews: pageViews.length,
        uniqueVisitors: uniqueSessions,
        avgTimeOnSite: Math.round(avgTimeOnPage),
        bounceRate: bounceRate.toFixed(1),
        topPages: topPages,
      };
    } catch (error) {
      console.error("Get traffic analytics error:", error);
      return null;
    }
  }

  /**
   * Получить статистику социальных сетей
   */
  async getSocialAnalytics(startDate, endDate) {
    try {
      const posts = await SocialPost.find({
        publishedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // TikTok stats
      const tiktokPosts = posts.filter((p) => p.platform === "tiktok");
      const tiktokStats = {
        views: tiktokPosts.reduce(
          (sum, p) => sum + (p.analytics?.views || 0),
          0,
        ),
        likes: tiktokPosts.reduce(
          (sum, p) => sum + (p.analytics?.likes || 0),
          0,
        ),
        shares: tiktokPosts.reduce(
          (sum, p) => sum + (p.analytics?.shares || 0),
          0,
        ),
        cartAdds: tiktokPosts.reduce(
          (sum, p) => sum + (p.analytics?.cartAdds || 0),
          0,
        ),
      };

      // Instagram stats
      const instagramPosts = posts.filter((p) => p.platform === "instagram");
      const instagramStats = {
        reach: instagramPosts.reduce(
          (sum, p) => sum + (p.analytics?.reach || 0),
          0,
        ),
        engagement: instagramPosts.reduce(
          (sum, p) => sum + (p.analytics?.engagement || 0),
          0,
        ),
        profileVisits: instagramPosts.reduce(
          (sum, p) => sum + (p.analytics?.profileVisits || 0),
          0,
        ),
      };

      return {
        tiktok: tiktokStats,
        instagram: instagramStats,
      };
    } catch (error) {
      console.error("Get social analytics error:", error);
      return {
        tiktok: { views: 0, likes: 0, shares: 0, cartAdds: 0 },
        instagram: { reach: 0, engagement: 0, profileVisits: 0 },
      };
    }
  }

  /**
   * Получить sentiment analysis
   */
  async getSentimentAnalytics(startDate, endDate) {
    try {
      const reviews = await ReviewSentiment.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      if (reviews.length === 0) {
        return {
          avgScore: 0,
          totalReviews: 0,
          distribution: { positive: 0, neutral: 0, negative: 0 },
        };
      }

      // Average score
      const avgScore =
        reviews.reduce((sum, r) => sum + (r.sentiment?.score || 0), 0) /
        reviews.length;

      // Distribution
      const distribution = {
        positive: reviews.filter((r) => r.sentiment?.label === "positive")
          .length,
        neutral: reviews.filter((r) => r.sentiment?.label === "neutral").length,
        negative: reviews.filter((r) => r.sentiment?.label === "negative")
          .length,
      };

      return {
        avgScore: avgScore.toFixed(2),
        totalReviews: reviews.length,
        distribution: distribution,
      };
    } catch (error) {
      console.error("Get sentiment analytics error:", error);
      return null;
    }
  }

  /**
   * Получить статистику конверсий
   */
  async getConversionAnalytics(startDate, endDate) {
    try {
      const conversions = await Conversion.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const pageViews = await PageView.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const uniqueVisitors = new Set(pageViews.map((pv) => pv.sessionId)).size;
      const conversionRate =
        uniqueVisitors > 0 ? (conversions.length / uniqueVisitors) * 100 : 0;

      // By type
      const byType = {};
      conversions.forEach((c) => {
        byType[c.type] = (byType[c.type] || 0) + 1;
      });

      return {
        total: conversions.length,
        rate: conversionRate.toFixed(2),
        byType: byType,
      };
    } catch (error) {
      console.error("Get conversion analytics error:", error);
      return null;
    }
  }

  /**
   * Генерировать инсайты на основе данных
   */
  generateInsights(metrics) {
    const insights = [];

    // Sales insights
    if (metrics.sales?.total > 0) {
      const topCollection = Object.entries(
        metrics.sales.byCollection || {},
      ).sort((a, b) => b[1] - a[1])[0];

      if (topCollection) {
        insights.push(
          `🔥 Коллекция "${topCollection[0]}" лидирует с продажами $${topCollection[1].toFixed(0)}`,
        );
      }

      const topCountry = Object.entries(metrics.sales.byCountry || {}).sort(
        (a, b) => b[1] - a[1],
      )[0];

      if (topCountry) {
        insights.push(
          `🌍 Основной рынок: ${topCountry[0]} (${((topCountry[1] / metrics.sales.total) * 100).toFixed(0)}% от продаж)`,
        );
      }
    }

    // Traffic insights
    if (metrics.traffic) {
      if (metrics.traffic.bounceRate < 40) {
        insights.push(
          `✅ Отличный bounce rate: ${metrics.traffic.bounceRate}% (пользователи вовлечены)`,
        );
      } else if (metrics.traffic.bounceRate > 60) {
        insights.push(
          `⚠️ Высокий bounce rate: ${metrics.traffic.bounceRate}% (нужно улучшить UX)`,
        );
      }

      if (metrics.traffic.avgTimeOnSite > 120) {
        insights.push(
          `📖 Среднее время на сайте ${Math.round(metrics.traffic.avgTimeOnSite / 60)} минут (контент захватывает)`,
        );
      }
    }

    // Social insights
    if (metrics.social?.tiktok?.views > 10000) {
      insights.push(
        `🎵 TikTok набирает обороты: ${(metrics.social.tiktok.views / 1000).toFixed(0)}K просмотров`,
      );
    }

    if (metrics.social?.tiktok?.cartAdds > 0) {
      const ctr =
        (metrics.social.tiktok.cartAdds / metrics.social.tiktok.views) * 100;
      insights.push(
        `🛒 TikTok Shop CTR: ${ctr.toFixed(2)}% (добавления в корзину)`,
      );
    }

    // Sentiment insights
    if (metrics.sentiment) {
      const positiveRate =
        (metrics.sentiment.distribution.positive /
          metrics.sentiment.totalReviews) *
        100;

      if (positiveRate > 80) {
        insights.push(
          `💜 ${positiveRate.toFixed(0)}% позитивных отзывов — клиенты любят продукт!`,
        );
      } else if (positiveRate < 60) {
        insights.push(
          `⚠️ Только ${positiveRate.toFixed(0)}% позитивных отзывов — требуется внимание к качеству`,
        );
      }
    }

    // Conversion insights
    if (metrics.conversions) {
      if (parseFloat(metrics.conversions.rate) > 3) {
        insights.push(
          `🎯 Конверсия ${metrics.conversions.rate}% — выше среднего по индустрии!`,
        );
      } else if (parseFloat(metrics.conversions.rate) < 1) {
        insights.push(
          `⚠️ Низкая конверсия ${metrics.conversions.rate}% — нужно оптимизировать воронку`,
        );
      }
    }

    return insights;
  }

  /**
   * Генерировать рекомендации
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    // Sales recommendations
    if (metrics.sales?.byCollection) {
      const collections = Object.keys(metrics.sales.byCollection);
      if (collections.length > 0) {
        const weakestCollection = Object.entries(
          metrics.sales.byCollection,
        ).sort((a, b) => a[1] - b[1])[0];

        if (weakestCollection[1] < metrics.sales.total * 0.1) {
          recommendations.push(
            `📈 Продвигай коллекцию "${weakestCollection[0]}" через TikTok/Instagram — потенциал не раскрыт`,
          );
        }
      }
    }

    // Traffic recommendations
    if (metrics.traffic?.bounceRate > 50) {
      recommendations.push(
        `🎨 Улучши первый экран главной страницы — bounce rate ${metrics.traffic.bounceRate}% слишком высокий`,
      );
    }

    // Social recommendations
    if (
      metrics.social?.tiktok?.views > 5000 &&
      metrics.social?.tiktok?.cartAdds < 10
    ) {
      recommendations.push(
        `🛍️ Добавь более явные CTA в TikTok видео — много просмотров, но мало добавлений в корзину`,
      );
    }

    if (
      metrics.social?.instagram?.engagement <
      metrics.social?.instagram?.reach * 0.03
    ) {
      recommendations.push(
        `📱 Повысь engagement в Instagram через Stories, Reels и интерактивные посты`,
      );
    }

    // Sentiment recommendations
    if (metrics.sentiment?.distribution.negative > 5) {
      recommendations.push(
        `💬 Обработай ${metrics.sentiment.distribution.negative} негативных отзыва — персональный ответ усилит бренд`,
      );
    }

    // Conversion recommendations
    if (parseFloat(metrics.conversions?.rate) < 2) {
      recommendations.push(
        `🎯 A/B тестируй checkout flow — конверсия ниже потенциала`,
      );
      recommendations.push(
        `✨ Добавь social proof (отзывы, UGC фото) на Product pages`,
      );
    }

    // General recommendations
    recommendations.push(
      `🎁 Запусти лимитированную коллекцию для VIP клиентов — создай FOMO`,
    );
    recommendations.push(
      `📧 Настрой abandoned cart email sequence — возвращай потерянные продажи`,
    );

    return recommendations;
  }

  /**
   * Создать недельный отчёт
   */
  async createWeeklyReport() {
    try {
      const now = new Date();
      const weekEnd = now;
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      console.log(
        `📊 Generating Light Impact Report for ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
      );

      // Собрать все метрики
      const [sales, traffic, social, sentiment, conversions] =
        await Promise.all([
          this.getSalesAnalytics(weekStart, weekEnd),
          this.getTrafficAnalytics(weekStart, weekEnd),
          this.getSocialAnalytics(weekStart, weekEnd),
          this.getSentimentAnalytics(weekStart, weekEnd),
          this.getConversionAnalytics(weekStart, weekEnd),
        ]);

      const metrics = {
        sales: sales,
        traffic: traffic,
        social: social,
        sentiment: sentiment,
        conversions: conversions,
      };

      // Генерировать инсайты и рекомендации
      const insights = this.generateInsights(metrics);
      const recommendations = this.generateRecommendations(metrics);

      // Создать отчёт
      const report = new WeeklyReport({
        weekStart: weekStart,
        weekEnd: weekEnd,
        metrics: metrics,
        insights: insights,
        recommendations: recommendations,
      });

      await report.save();

      console.log(`✅ Weekly report created: ${report._id}`);

      return {
        success: true,
        report: report,
      };
    } catch (error) {
      console.error("Create weekly report error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить последний отчёт
   */
  async getLatestReport() {
    try {
      const report = await WeeklyReport.findOne().sort({ weekStart: -1 });

      return report;
    } catch (error) {
      console.error("Get latest report error:", error);
      return null;
    }
  }

  /**
   * Получить все отчёты
   */
  async getAllReports(limit = 10) {
    try {
      const reports = await WeeklyReport.find()
        .sort({ weekStart: -1 })
        .limit(limit);

      return reports;
    } catch (error) {
      console.error("Get all reports error:", error);
      return [];
    }
  }
}

export default new GrowthAnalyticsService();
