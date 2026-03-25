import express from "express";
import PromoCode from "../models/PromoCode.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * POST /api/promo/validate
 * Проверить промокод (public)
 * Body: { code, orderAmount? }
 */
router.post("/validate", async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ error: "Код обязателен" });

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    if (!promo) return res.json({ valid: false, error: "Промокод не найден" });

    // Проверка срока
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.json({ valid: false, error: "Промокод истёк" });
    }

    // Проверка лимита использований
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.json({ valid: false, error: "Промокод исчерпан" });
    }

    // Проверка минимальной суммы
    if (
      promo.minOrderAmount &&
      orderAmount &&
      orderAmount < promo.minOrderAmount
    ) {
      return res.json({
        valid: false,
        error: `Минимальная сумма заказа: ${promo.minOrderAmount} ${promo.currency}`,
      });
    }

    // Рассчитать скидку
    let discount = 0;
    if (promo.type === "percent") {
      discount = orderAmount
        ? Math.round((orderAmount * promo.value) / 100)
        : promo.value;
    } else {
      discount = promo.value;
    }

    res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount,
      currency: promo.currency,
    });
  } catch (err) {
    baseLogger.error({ err }, "Promo validate error");
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
