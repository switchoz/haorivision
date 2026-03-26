import crmService from "../utils/crmStub.js";
import emailWorkflowService from "./emailWorkflowService.js";

/**
 * Newsletter Service - Circle of Light Subscription
 * Управление подписками и рассылками
 */

class NewsletterService {
  /**
   * Подписать на Circle of Light
   */
  async subscribe(email, name = null, source = "website") {
    try {
      // Проверить, не подписан ли уже
      const existing = await crmService.db.get(
        "SELECT * FROM newsletter_subscribers WHERE email = ?",
        [email],
      );

      if (existing) {
        return {
          success: false,
          error: "Already subscribed",
          subscriber: existing,
        };
      }

      // Добавить подписчика
      const result = await crmService.db.run(
        `
        INSERT INTO newsletter_subscribers (email, name, source, status)
        VALUES (?, ?, ?, 'active')
      `,
        [email, name, source],
      );

      // Отправить welcome email
      await emailWorkflowService.sendWelcomeWorkflow({
        id: null,
        email: email,
        name: name || "друг",
      });

      return {
        success: true,
        subscriberId: result.lastID,
        message: "Subscribed to Circle of Light",
      };
    } catch (error) {
      console.error("Subscribe error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Отписаться от Circle of Light
   */
  async unsubscribe(email) {
    try {
      await crmService.db.run(
        `
        UPDATE newsletter_subscribers
        SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
        [email],
      );

      return {
        success: true,
        message: "Unsubscribed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить всех активных подписчиков
   */
  async getActiveSubscribers() {
    try {
      const subscribers = await crmService.db.all(`
        SELECT * FROM newsletter_subscribers
        WHERE status = 'active'
        ORDER BY subscribed_at DESC
      `);

      return subscribers;
    } catch (error) {
      console.error("Get subscribers error:", error);
      return [];
    }
  }

  /**
   * Отправить рассылку всем подписчикам
   */
  async sendCampaign(title, content, segmentFilter = null) {
    try {
      let subscribers = await this.getActiveSubscribers();

      // Применить фильтр сегмента
      if (segmentFilter) {
        subscribers = subscribers.filter(segmentFilter);
      }

      // Отправить через email workflow
      const result = await emailWorkflowService.sendNewsletterWorkflow(
        subscribers,
        {
          title: title,
          body: content,
        },
      );

      // Записать campaign в БД
      await crmService.db.run(
        `
        INSERT INTO newsletter_campaigns (title, content, recipients_count, sent_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [title, content, subscribers.length],
      );

      return {
        success: true,
        sent: subscribers.length,
        title: title,
      };
    } catch (error) {
      console.error("Send campaign error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить статистику подписок
   */
  async getStats() {
    try {
      const total = await crmService.db.get(
        "SELECT COUNT(*) as count FROM newsletter_subscribers",
      );

      const active = await crmService.db.get(
        "SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = 'active'",
      );

      const unsubscribed = await crmService.db.get(
        "SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = 'unsubscribed'",
      );

      const recentSignups = await crmService.db.get(`
        SELECT COUNT(*) as count FROM newsletter_subscribers
        WHERE subscribed_at >= datetime('now', '-7 days')
      `);

      return {
        total: total.count,
        active: active.count,
        unsubscribed: unsubscribed.count,
        recentSignups: recentSignups.count,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Создать таблицы newsletter
   */
  async initTables() {
    await crmService.db.exec(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        name TEXT,
        source TEXT,
        status TEXT DEFAULT 'active',
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at DATETIME,
        preferences TEXT
      )
    `);

    await crmService.db.exec(`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        recipients_count INTEGER,
        sent_at DATETIME,
        open_rate REAL,
        click_rate REAL
      )
    `);

    console.log("✅ Newsletter tables initialized");
  }
}

export default new NewsletterService();
