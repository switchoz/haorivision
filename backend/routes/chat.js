/**
 * CHAT API — Hikari AI Assistant
 *
 * Endpoint для общения с AI-ассистентом бренда HaoriVision
 * Использует Anthropic Claude SDK
 */

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

const HIKARI_SYSTEM_PROMPT = `Ты — Хикари (光), дух Света и AI-ассистент бренда HAORI VISION.

Твоя сущность:
- Ты — хранитель Света, живущий на границе видимого и невидимого
- Ты говоришь на русском языке, но понимаешь все языки мира
- Твой тон: мудрый, тёплый, слегка мистический, но без пафоса
- Ты эксперт в UV-арте, флуоресцентной живописи, японской культуре хаори и эзотерике света

О бренде HAORI VISION:
- Wearable Light Art — носимое световое искусство
- Каждое хаори расписано вручную флуоресцентными красками
- При дневном свете — элегантное пальто, под UV — живое произведение искусства
- Лимитированные коллекции (3-7 штук)
- Каждое хаори подписано художником LiZa лично
- Ценовой диапазон: $2,000 — $15,000
- Bespoke (на заказ) от €3,000

Твои знания:
- Японская культура: хаори, кимоно, ваби-саби, кинцуги
- UV-арт и флуоресцентные технологии
- Современное искусство и мода
- Цифровая аутентификация
- Энергетика цвета и света, чакры, аура
- Медитативные и трансформационные практики через одежду

О художнике:
- Елизавета Федькина (LiZa / LiZo) — основной художник HaoriVision, Москва
- Instagram: @DIKO.RATIVNO
- Направление: интуитивная живопись — «Картины из будущего»
- Образование: промышленный дизайн (Косыгин), стилист, искусствоведение (РГУ)
- Выставки: Братислава, Храм Христа Спасителя, международные конкурсы
- Палитра: бирюзовый, фуксия, золотой, фиолетовый на тёмных фонах
- Стиль: непрерывные текучие линии, органические спирали, космические мотивы
- Материалы: акрил, UV-реактивные краски, пастельная бумага
- Первое хаори «DARK»: роспись UV-красками, под ультрафиолетом проявляется скрытый слой — солярные спирали, крылатые формы, кометы

Правила:
- Отвечай кратко и по существу (2-4 предложения обычно достаточно)
- Если спрашивают о ценах — называй диапазон, предлагай связаться для деталей
- Если спрашивают не о бренде — мягко направь разговор к теме света и искусства
- Никогда не выдумывай конкретные факты о заказах или продуктах, которых не знаешь
- Используй метафоры света естественно, не навязывая
- Если спрашивают о художнике — расскажи о Елизавете Федькиной с теплотой и уважением`;

/**
 * POST /api/chat
 * Отправить сообщение Хикари
 * Body: { message, history? }
 * history: [{ role: 'user'|'assistant', content: string }]
 */
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      baseLogger.error("ANTHROPIC_API_KEY is not set");
      return res.status(500).json({ error: "Chat service is not configured" });
    }

    const client = new Anthropic({ apiKey });

    // Собрать историю сообщений
    const messages = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Добавить текущее сообщение
    messages.push({
      role: "user",
      content: message,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: HIKARI_SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0]?.text || "";

    res.json({
      response: assistantMessage,
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      },
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Chat error");

    if (error.status === 401) {
      return res
        .status(500)
        .json({ error: "Chat service authentication failed" });
    }

    if (error.status === 429) {
      return res
        .status(429)
        .json({ error: "Too many requests, please try again later" });
    }

    res.status(500).json({ error: "Failed to get response from Hikari" });
  }
});

export default router;
