import tiktokService from "../social/tiktokService.js";
import instagramService from "../social/instagramService.js";
import SocialPost from "../../models/SocialPost.js";

/**
 * Analytics Service
 * Собирает и агрегирует статистику с TikTok и Instagram
 */

class AnalyticsService {
  /**
   * Синхронизация статистики для всех опубликованных постов
   */
  async syncAllPostsAnalytics() {
    try {
      console.log("\n📊 Starting analytics sync...\n");

      const posts = await SocialPost.find({
        publishedAt: { $ne: null },
      });

      let syncedCount = 0;

      for (const post of posts) {
        try {
          await this.syncPostAnalytics(post._id);
          syncedCount++;
          console.log(`✓ Synced: ${post.filename}`);
        } catch (error) {
          console.error(`✗ Failed: ${post.filename} - ${error.message}`);
        }

        // Rate limiting - не более 1 запроса в секунду
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(
        `\n✅ Analytics synced for ${syncedCount}/${posts.length} posts\n`,
      );

      return {
        success: true,
        synced: syncedCount,
        total: posts.length,
      };
    } catch (error) {
      console.error("❌ Analytics sync error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Синхронизация статистики для конкретного поста
   */
  async syncPostAnalytics(postId) {
    try {
      const post = await SocialPost.findById(postId);

      if (!post) {
        throw new Error("Post not found");
      }

      const updates = {};

      // Получить статистику TikTok
      if (
        post.platforms.tiktok?.published &&
        post.platforms.tiktok?.publishId
      ) {
        const tiktokStats = await tiktokService.getVideoAnalytics(
          post.platforms.tiktok.publishId,
        );

        if (tiktokStats.success) {
          updates["platforms.tiktok.views"] =
            tiktokStats.analytics.view_count || 0;
          updates["platforms.tiktok.likes"] =
            tiktokStats.analytics.like_count || 0;
          updates["platforms.tiktok.comments"] =
            tiktokStats.analytics.comment_count || 0;
          updates["platforms.tiktok.shares"] =
            tiktokStats.analytics.share_count || 0;
          updates["platforms.tiktok.url"] = tiktokStats.analytics.share_url;
        }
      }

      // Получить статистику Instagram
      if (
        post.platforms.instagram?.published &&
        post.platforms.instagram?.mediaId
      ) {
        const igStats = await instagramService.getMediaInsights(
          post.platforms.instagram.mediaId,
        );

        if (igStats.success) {
          updates["platforms.instagram.impressions"] =
            igStats.insights.impressions || 0;
          updates["platforms.instagram.reach"] = igStats.insights.reach || 0;
          updates["platforms.instagram.engagement"] =
            igStats.insights.engagement || 0;
          updates["platforms.instagram.saved"] = igStats.insights.saved || 0;
        }
      }

      // Обновить запись в БД
      updates.lastSyncedAt = new Date();

      await SocialPost.findByIdAndUpdate(postId, { $set: updates });

      return {
        success: true,
        updates: updates,
      };
    } catch (error) {
      console.error("❌ Post analytics sync error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить агрегированную статистику за период
   */
  async getAggregatedStats(startDate, endDate) {
    try {
      const posts = await SocialPost.find({
        publishedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const stats = {
        period: {
          start: startDate,
          end: endDate,
        },
        totalPosts: posts.length,
        byPlatform: {
          tiktok: {
            posts: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalAddToCart: 0,
          },
          instagram: {
            posts: 0,
            totalImpressions: 0,
            totalReach: 0,
            totalEngagement: 0,
            totalSaved: 0,
            totalProductClicks: 0,
          },
        },
        byProduct: {},
        topPerformers: {
          mostViewed: null,
          mostEngaged: null,
          mostConversions: null,
        },
      };

      // Агрегация статистики
      for (const post of posts) {
        // TikTok stats
        if (post.platforms.tiktok?.published) {
          stats.byPlatform.tiktok.posts++;
          stats.byPlatform.tiktok.totalViews +=
            post.platforms.tiktok.views || 0;
          stats.byPlatform.tiktok.totalLikes +=
            post.platforms.tiktok.likes || 0;
          stats.byPlatform.tiktok.totalComments +=
            post.platforms.tiktok.comments || 0;
          stats.byPlatform.tiktok.totalShares +=
            post.platforms.tiktok.shares || 0;
          stats.byPlatform.tiktok.totalAddToCart +=
            post.platforms.tiktok.addToCart || 0;
        }

        // Instagram stats
        if (post.platforms.instagram?.published) {
          stats.byPlatform.instagram.posts++;
          stats.byPlatform.instagram.totalImpressions +=
            post.platforms.instagram.impressions || 0;
          stats.byPlatform.instagram.totalReach +=
            post.platforms.instagram.reach || 0;
          stats.byPlatform.instagram.totalEngagement +=
            post.platforms.instagram.engagement || 0;
          stats.byPlatform.instagram.totalSaved +=
            post.platforms.instagram.saved || 0;
          stats.byPlatform.instagram.totalProductClicks +=
            post.platforms.instagram.productClicks || 0;
        }

        // By product
        if (post.productId) {
          if (!stats.byProduct[post.productId]) {
            stats.byProduct[post.productId] = {
              posts: 0,
              views: 0,
              engagement: 0,
              conversions: 0,
            };
          }

          stats.byProduct[post.productId].posts++;
          stats.byProduct[post.productId].views +=
            (post.platforms.tiktok?.views || 0) +
            (post.platforms.instagram?.reach || 0);
          stats.byProduct[post.productId].engagement +=
            (post.platforms.tiktok?.likes || 0) +
            (post.platforms.instagram?.engagement || 0);
          stats.byProduct[post.productId].conversions +=
            (post.platforms.tiktok?.addToCart || 0) +
            (post.platforms.instagram?.productClicks || 0);
        }
      }

      // Вычислить средние показатели
      if (stats.byPlatform.tiktok.posts > 0) {
        stats.byPlatform.tiktok.avgViews = Math.round(
          stats.byPlatform.tiktok.totalViews / stats.byPlatform.tiktok.posts,
        );
        stats.byPlatform.tiktok.avgLikes = Math.round(
          stats.byPlatform.tiktok.totalLikes / stats.byPlatform.tiktok.posts,
        );
        stats.byPlatform.tiktok.engagementRate = (
          ((stats.byPlatform.tiktok.totalLikes +
            stats.byPlatform.tiktok.totalComments +
            stats.byPlatform.tiktok.totalShares) /
            stats.byPlatform.tiktok.totalViews) *
          100
        ).toFixed(2);
      }

      if (stats.byPlatform.instagram.posts > 0) {
        stats.byPlatform.instagram.avgReach = Math.round(
          stats.byPlatform.instagram.totalReach /
            stats.byPlatform.instagram.posts,
        );
        stats.byPlatform.instagram.avgEngagement = Math.round(
          stats.byPlatform.instagram.totalEngagement /
            stats.byPlatform.instagram.posts,
        );
        stats.byPlatform.instagram.engagementRate = (
          (stats.byPlatform.instagram.totalEngagement /
            stats.byPlatform.instagram.totalReach) *
          100
        ).toFixed(2);
      }

      // Top performers
      const sortedByViews = posts.sort((a, b) => {
        const viewsA =
          (a.platforms.tiktok?.views || 0) +
          (a.platforms.instagram?.reach || 0);
        const viewsB =
          (b.platforms.tiktok?.views || 0) +
          (b.platforms.instagram?.reach || 0);
        return viewsB - viewsA;
      });

      const sortedByEngagement = posts.sort((a, b) => {
        const engA =
          (a.platforms.tiktok?.likes || 0) +
          (a.platforms.instagram?.engagement || 0);
        const engB =
          (b.platforms.tiktok?.likes || 0) +
          (b.platforms.instagram?.engagement || 0);
        return engB - engA;
      });

      const sortedByConversions = posts.sort((a, b) => {
        const convA =
          (a.platforms.tiktok?.addToCart || 0) +
          (a.platforms.instagram?.productClicks || 0);
        const convB =
          (b.platforms.tiktok?.addToCart || 0) +
          (b.platforms.instagram?.productClicks || 0);
        return convB - convA;
      });

      if (sortedByViews.length > 0) {
        stats.topPerformers.mostViewed = {
          filename: sortedByViews[0].filename,
          productId: sortedByViews[0].productId,
          views:
            (sortedByViews[0].platforms.tiktok?.views || 0) +
            (sortedByViews[0].platforms.instagram?.reach || 0),
        };
      }

      if (sortedByEngagement.length > 0) {
        stats.topPerformers.mostEngaged = {
          filename: sortedByEngagement[0].filename,
          productId: sortedByEngagement[0].productId,
          engagement:
            (sortedByEngagement[0].platforms.tiktok?.likes || 0) +
            (sortedByEngagement[0].platforms.instagram?.engagement || 0),
        };
      }

      if (sortedByConversions.length > 0) {
        stats.topPerformers.mostConversions = {
          filename: sortedByConversions[0].filename,
          productId: sortedByConversions[0].productId,
          conversions:
            (sortedByConversions[0].platforms.tiktok?.addToCart || 0) +
            (sortedByConversions[0].platforms.instagram?.productClicks || 0),
        };
      }

      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      console.error("❌ Aggregated stats error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить недельную статистику (для "Glow Pulse" отчёта)
   */
  async getWeeklyStats() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await this.getAggregatedStats(startDate, endDate);
  }

  /**
   * Получить статистику по конкретному продукту
   */
  async getProductStats(productId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const posts = await SocialPost.find({
        productId: productId,
        publishedAt: { $gte: startDate },
      });

      const stats = {
        productId: productId,
        period: `Last ${days} days`,
        totalPosts: posts.length,
        totalViews: 0,
        totalEngagement: 0,
        totalConversions: 0,
        platforms: {
          tiktok: { posts: 0, views: 0, engagement: 0 },
          instagram: { posts: 0, views: 0, engagement: 0 },
        },
      };

      for (const post of posts) {
        if (post.platforms.tiktok?.published) {
          stats.platforms.tiktok.posts++;
          stats.platforms.tiktok.views += post.platforms.tiktok.views || 0;
          stats.platforms.tiktok.engagement +=
            (post.platforms.tiktok.likes || 0) +
            (post.platforms.tiktok.comments || 0);
          stats.totalConversions += post.platforms.tiktok.addToCart || 0;
        }

        if (post.platforms.instagram?.published) {
          stats.platforms.instagram.posts++;
          stats.platforms.instagram.views +=
            post.platforms.instagram.reach || 0;
          stats.platforms.instagram.engagement +=
            post.platforms.instagram.engagement || 0;
          stats.totalConversions += post.platforms.instagram.productClicks || 0;
        }
      }

      stats.totalViews =
        stats.platforms.tiktok.views + stats.platforms.instagram.views;
      stats.totalEngagement =
        stats.platforms.tiktok.engagement +
        stats.platforms.instagram.engagement;

      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new AnalyticsService();
