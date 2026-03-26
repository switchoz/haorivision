import express from "express";
import crmService from "../utils/crmStub.js";
import loyaltyService from "../services/loyaltyService.js";
import newsletterService from "../services/newsletterService.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * GET /api/customer/activity/:customerId
 * Панель активности клиента - полный dashboard
 */
router.get("/activity/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Получить данные клиента
    const client = await crmService.db.get(
      "SELECT * FROM clients WHERE id = ?",
      [customerId],
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Получить все данные параллельно
    const [
      interactions,
      interests,
      consultations,
      loyaltyBalance,
      loyaltyHistory,
      availableRewards,
    ] = await Promise.all([
      crmService.getClientInteractions(customerId, 20),
      crmService.getClientInterests(customerId),
      crmService.getClientConsultations(customerId),
      loyaltyService.getBalance(customerId),
      loyaltyService.getTransactionHistory(customerId, 10),
      loyaltyService.getAvailableRewards(customerId),
    ]);

    // Вычислить метрики
    const metrics = {
      totalInteractions: interactions.length,
      totalPoints: loyaltyBalance,
      vipTier: client.vip_tier,
      totalSpent: client.total_spent || 0,
      consultationsBooked: consultations.length,
      lastInteraction: client.last_interaction,
      memberSince: client.created_at,
    };

    // Intent breakdown
    const intentCounts = {};
    interactions.forEach((interaction) => {
      intentCounts[interaction.intent] =
        (intentCounts[interaction.intent] || 0) + 1;
    });

    // Timeline events
    const timeline = [
      ...interactions.map((i) => ({
        type: "interaction",
        intent: i.intent,
        message: i.message,
        timestamp: i.created_at,
      })),
      ...loyaltyHistory.map((t) => ({
        type: "loyalty",
        action: t.action,
        points: t.points,
        timestamp: t.created_at,
      })),
      ...consultations.map((c) => ({
        type: "consultation",
        status: c.status,
        scheduled: c.scheduled_at,
        timestamp: c.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Response
    res.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        vipTier: client.vip_tier,
        createdAt: client.created_at,
      },
      metrics: metrics,
      loyalty: {
        balance: loyaltyBalance,
        history: loyaltyHistory,
        rewards: availableRewards,
      },
      interactions: {
        recent: interactions.slice(0, 10),
        total: interactions.length,
        byIntent: intentCounts,
      },
      interests: interests,
      consultations: consultations,
      timeline: timeline.slice(0, 20),
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Activity dashboard error");
    res.status(500).json({
      error: "Failed to fetch activity",
      message: error.message,
    });
  }
});

/**
 * GET /api/customer/stats/:customerId
 * Краткая статистика клиента
 */
router.get("/stats/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const client = await crmService.db.get(
      "SELECT * FROM clients WHERE id = ?",
      [customerId],
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const balance = await loyaltyService.getBalance(customerId);
    const interactions = await crmService.getClientInteractions(customerId, 1);

    res.json({
      name: client.name,
      vipTier: client.vip_tier,
      loyaltyPoints: balance,
      totalSpent: client.total_spent || 0,
      lastInteraction: interactions[0]?.created_at || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/award-points
 * Начислить points вручную (admin)
 */
router.post("/award-points", async (req, res) => {
  try {
    const { customerId, action, metadata } = req.body;

    const result = await loyaltyService.awardPoints(
      customerId,
      action,
      metadata,
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/redeem-reward
 * Использовать награду
 */
router.post("/redeem-reward", async (req, res) => {
  try {
    const { customerId, rewardPoints } = req.body;

    const result = await loyaltyService.redeemReward(customerId, rewardPoints);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer/rewards/:customerId
 * Доступные награды для клиента
 */
router.get("/rewards/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const rewards = await loyaltyService.getAvailableRewards(customerId);
    const balance = await loyaltyService.getBalance(customerId);

    res.json({
      balance: balance,
      rewards: rewards,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/newsletter/subscribe
 * Подписаться на Circle of Light
 */
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email, name, source } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const result = await newsletterService.subscribe(
      email,
      name,
      source || "website",
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/newsletter/unsubscribe
 * Отписаться от рассылки
 */
router.get("/newsletter/unsubscribe", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const result = await newsletterService.unsubscribe(email);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
