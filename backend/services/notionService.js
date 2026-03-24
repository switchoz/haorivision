import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

/**
 * Notion Integration Service
 * Экспортирует отчёты "Glow Pulse" в Notion
 */

class NotionService {
  constructor() {
    this.apiToken = process.env.NOTION_API_TOKEN;
    this.databaseId = process.env.NOTION_DATABASE_ID; // Для таблицы отчётов
  }

  /**
   * Создать страницу с еженедельным отчётом "Glow Pulse"
   */
  async createGlowPulseReport(weeklyStats) {
    try {
      console.log("\n📝 Creating Glow Pulse report in Notion...\n");

      const stats = weeklyStats.stats;

      // Форматирование даты для заголовка
      const startDate = new Date(stats.period.start);
      const endDate = new Date(stats.period.end);
      const title = `🌟 Glow Pulse — ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`;

      // Создать страницу в Notion
      const response = await axios.post(
        `${NOTION_API_BASE}/pages`,
        {
          parent: {
            database_id: this.databaseId,
          },
          icon: {
            type: "emoji",
            emoji: "✨",
          },
          properties: {
            Title: {
              title: [
                {
                  text: {
                    content: title,
                  },
                },
              ],
            },
            "Week Start": {
              date: {
                start: stats.period.start.toISOString().split("T")[0],
              },
            },
            "Week End": {
              date: {
                start: stats.period.end.toISOString().split("T")[0],
              },
            },
            "Total Posts": {
              number: stats.totalPosts,
            },
            "TikTok Views": {
              number: stats.byPlatform.tiktok.totalViews,
            },
            "Instagram Reach": {
              number: stats.byPlatform.instagram.totalReach,
            },
            "Total Conversions": {
              number:
                stats.byPlatform.tiktok.totalAddToCart +
                stats.byPlatform.instagram.totalProductClicks,
            },
          },
          children: this.buildReportBlocks(stats),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
        },
      );

      const pageUrl = response.data.url;
      console.log(`✅ Glow Pulse report created: ${pageUrl}\n`);

      return {
        success: true,
        pageId: response.data.id,
        url: pageUrl,
      };
    } catch (error) {
      console.error(
        "❌ Notion report creation error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Построить блоки контента для отчёта
   */
  buildReportBlocks(stats) {
    const blocks = [];

    // Заголовок
    blocks.push({
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [
          {
            text: {
              content: "✨ Weekly Glow Pulse Report",
            },
          },
        ],
      },
    });

    // Период
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            text: {
              content: `📅 ${this.formatDate(stats.period.start)} — ${this.formatDate(stats.period.end)}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });

    // Overview
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            text: {
              content: "📊 Overview",
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Total Posts Published: ${stats.totalPosts}`,
            },
          },
        ],
      },
    });

    // TikTok Stats
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            text: {
              content: "🎵 TikTok Performance",
            },
          },
        ],
      },
    });

    const tiktok = stats.byPlatform.tiktok;

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Posts: ${tiktok.posts}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Total Views: ${this.formatNumber(tiktok.totalViews)}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Total Likes: ${this.formatNumber(tiktok.totalLikes)}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Add to Cart: ${tiktok.totalAddToCart}`,
            },
          },
        ],
      },
    });

    if (tiktok.avgViews) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Avg Views per Post: ${this.formatNumber(tiktok.avgViews)}`,
              },
            },
          ],
        },
      });
    }

    if (tiktok.engagementRate) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Engagement Rate: ${tiktok.engagementRate}%`,
              },
            },
          ],
        },
      });
    }

    // Instagram Stats
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            text: {
              content: "📸 Instagram Performance",
            },
          },
        ],
      },
    });

    const instagram = stats.byPlatform.instagram;

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Posts: ${instagram.posts}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Total Reach: ${this.formatNumber(instagram.totalReach)}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Total Engagement: ${this.formatNumber(instagram.totalEngagement)}`,
            },
          },
        ],
      },
    });

    blocks.push({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: `Product Clicks: ${instagram.totalProductClicks}`,
            },
          },
        ],
      },
    });

    if (instagram.avgReach) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Avg Reach per Post: ${this.formatNumber(instagram.avgReach)}`,
              },
            },
          ],
        },
      });
    }

    if (instagram.engagementRate) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Engagement Rate: ${instagram.engagementRate}%`,
              },
            },
          ],
        },
      });
    }

    // Top Performers
    if (stats.topPerformers.mostViewed) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              text: {
                content: "🏆 Top Performers",
              },
            },
          ],
        },
      });

      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Most Viewed: ${stats.topPerformers.mostViewed.filename} (${this.formatNumber(stats.topPerformers.mostViewed.views)} views)`,
              },
            },
          ],
        },
      });
    }

    if (stats.topPerformers.mostEngaged) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Most Engaged: ${stats.topPerformers.mostEngaged.filename} (${this.formatNumber(stats.topPerformers.mostEngaged.engagement)} interactions)`,
              },
            },
          ],
        },
      });
    }

    if (stats.topPerformers.mostConversions) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Most Conversions: ${stats.topPerformers.mostConversions.filename} (${stats.topPerformers.mostConversions.conversions} clicks)`,
              },
            },
          ],
        },
      });
    }

    // Product Breakdown
    if (Object.keys(stats.byProduct).length > 0) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              text: {
                content: "🎨 By Product",
              },
            },
          ],
        },
      });

      for (const [productId, productStats] of Object.entries(stats.byProduct)) {
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `${productId}: ${productStats.posts} posts, ${this.formatNumber(productStats.views)} views, ${productStats.conversions} conversions`,
                },
              },
            ],
          },
        });
      }
    }

    return blocks;
  }

  /**
   * Форматировать дату
   */
  formatDate(date) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  }

  /**
   * Форматировать число с разделителями
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /**
   * Обновить существующую страницу
   */
  async updateReport(pageId, updates) {
    try {
      const response = await axios.patch(
        `${NOTION_API_BASE}/pages/${pageId}`,
        {
          properties: updates,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить все отчёты из базы данных
   */
  async getAllReports() {
    try {
      const response = await axios.post(
        `${NOTION_API_BASE}/databases/${this.databaseId}/query`,
        {
          sorts: [
            {
              property: "Week Start",
              direction: "descending",
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        reports: response.data.results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new NotionService();
