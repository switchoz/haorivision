import crmService from "../utils/crmStub.js";

/**
 * Loyalty Service - Glow Points System
 * Управление балльной программой HAORI VISION
 */

class LoyaltyService {
  constructor() {
    this.pointsRules = {
      purchase: 100, // За каждую покупку
      referral: 50, // За приведённого друга
      review: 25, // За отзыв с фото
      socialShare: 10, // За шер в соцсетях
      birthday: 100, // День рождения
      firstPurchase: 50, // Бонус за первую покупку
    };

    this.rewards = [
      {
        points: 500,
        discount: 100,
        type: "discount",
        description: "$100 скидка на любую покупку",
      },
      {
        points: 1000,
        discount: 250,
        type: "discount",
        description: "$250 скидка на bespoke заказ",
      },
      {
        points: 1500,
        type: "upgrade",
        description: "Бесплатный Upgrade Ritual (хаори + принт)",
      },
      {
        points: 2000,
        type: "vip",
        description: "Повышение до Silver VIP tier",
      },
      { points: 5000, type: "vip", description: "Повышение до Gold VIP tier" },
      {
        points: 10000,
        type: "vip",
        description: "Повышение до Platinum VIP + консультация с художником",
      },
    ];
  }

  /**
   * Начислить points за действие
   */
  async awardPoints(clientId, action, metadata = {}) {
    try {
      const points = this.pointsRules[action] || 0;

      if (points === 0) {
        return { success: false, error: "Unknown action" };
      }

      // Получить текущий баланс
      const currentBalance = await this.getBalance(clientId);

      // Добавить points
      await crmService.db.run(
        `
        INSERT INTO loyalty_transactions (client_id, action, points, metadata, balance_after)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          clientId,
          action,
          points,
          JSON.stringify(metadata),
          currentBalance + points,
        ],
      );

      // Обновить баланс клиента
      await crmService.db.run(
        `
        UPDATE clients
        SET loyalty_points = loyalty_points + ?
        WHERE id = ?
      `,
        [points, clientId],
      );

      // Проверить достижения
      await this.checkAchievements(clientId, currentBalance + points);

      return {
        success: true,
        points: points,
        newBalance: currentBalance + points,
        action: action,
      };
    } catch (error) {
      console.error("Award points error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Использовать points для награды
   */
  async redeemReward(clientId, rewardPoints) {
    try {
      const balance = await this.getBalance(clientId);

      if (balance < rewardPoints) {
        return {
          success: false,
          error: "Insufficient points",
          balance: balance,
          required: rewardPoints,
        };
      }

      const reward = this.rewards.find((r) => r.points === rewardPoints);

      if (!reward) {
        return { success: false, error: "Reward not found" };
      }

      // Списать points
      await crmService.db.run(
        `
        INSERT INTO loyalty_transactions (client_id, action, points, metadata, balance_after)
        VALUES (?, 'redeem', ?, ?, ?)
      `,
        [
          clientId,
          -rewardPoints,
          JSON.stringify(reward),
          balance - rewardPoints,
        ],
      );

      await crmService.db.run(
        `
        UPDATE clients
        SET loyalty_points = loyalty_points - ?
        WHERE id = ?
      `,
        [rewardPoints, clientId],
      );

      // Если это VIP upgrade
      if (reward.type === "vip") {
        const newTier = this.getTierFromPoints(rewardPoints);
        await crmService.updateVIPTier(clientId, newTier);
      }

      return {
        success: true,
        reward: reward,
        pointsSpent: rewardPoints,
        newBalance: balance - rewardPoints,
      };
    } catch (error) {
      console.error("Redeem reward error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Получить баланс points клиента
   */
  async getBalance(clientId) {
    try {
      const client = await crmService.db.get(
        "SELECT loyalty_points FROM clients WHERE id = ?",
        [clientId],
      );

      return client?.loyalty_points || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Получить историю транзакций
   */
  async getTransactionHistory(clientId, limit = 20) {
    try {
      const transactions = await crmService.db.all(
        `
        SELECT * FROM loyalty_transactions
        WHERE client_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
        [clientId, limit],
      );

      return transactions.map((t) => ({
        ...t,
        metadata: t.metadata ? JSON.parse(t.metadata) : {},
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Получить доступные награды для клиента
   */
  async getAvailableRewards(clientId) {
    const balance = await this.getBalance(clientId);

    return this.rewards.map((reward) => ({
      ...reward,
      available: balance >= reward.points,
      pointsNeeded: Math.max(0, reward.points - balance),
    }));
  }

  /**
   * Проверить достижения (milestones)
   */
  async checkAchievements(clientId, newBalance) {
    const milestones = [500, 1000, 2000, 5000, 10000];

    for (const milestone of milestones) {
      if (newBalance >= milestone) {
        // Отправить уведомление о достижении (todo)
        console.log(`🎉 Client ${clientId} reached ${milestone} points!`);
      }
    }
  }

  /**
   * Определить VIP tier по points
   */
  getTierFromPoints(points) {
    if (points >= 10000) return "platinum";
    if (points >= 5000) return "gold";
    if (points >= 2000) return "silver";
    return "standard";
  }

  /**
   * Начислить points за покупку
   */
  async awardPurchasePoints(clientId, orderTotal) {
    // Base points
    let points = this.pointsRules.purchase;

    // Bonus за крупные покупки
    if (orderTotal >= 2000) {
      points += 50; // Extra 50 points
    }

    // Проверить, первая ли это покупка
    const purchaseCount = await this.getPurchaseCount(clientId);
    if (purchaseCount === 1) {
      points += this.pointsRules.firstPurchase;
    }

    return await this.awardPoints(clientId, "purchase", {
      orderTotal: orderTotal,
      bonusPoints: points - this.pointsRules.purchase,
      firstPurchase: purchaseCount === 1,
    });
  }

  /**
   * Получить количество покупок клиента
   */
  async getPurchaseCount(clientId) {
    try {
      const result = await crmService.db.get(
        `
        SELECT COUNT(*) as count
        FROM loyalty_transactions
        WHERE client_id = ? AND action = 'purchase'
      `,
        [clientId],
      );

      return result?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Создать таблицы loyalty
   */
  async initTables() {
    await crmService.db.exec(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        action TEXT,
        points INTEGER,
        metadata TEXT,
        balance_after INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Добавить loyalty_points колонку в clients
    try {
      await crmService.db.run(`
        ALTER TABLE clients ADD COLUMN loyalty_points INTEGER DEFAULT 0
      `);
    } catch (error) {
      // Column already exists
    }

    console.log("✅ Loyalty tables initialized");
  }

  /**
   * Получить статистику программы
   */
  async getStats() {
    try {
      const totalPoints = await crmService.db.get(`
        SELECT SUM(loyalty_points) as total FROM clients
      `);

      const activeMembers = await crmService.db.get(`
        SELECT COUNT(*) as count FROM clients WHERE loyalty_points > 0
      `);

      const topMembers = await crmService.db.all(`
        SELECT id, name, email, loyalty_points
        FROM clients
        ORDER BY loyalty_points DESC
        LIMIT 10
      `);

      return {
        totalPointsIssued: totalPoints?.total || 0,
        activeMembers: activeMembers?.count || 0,
        topMembers: topMembers,
      };
    } catch (error) {
      return null;
    }
  }
}

export default new LoyaltyService();
