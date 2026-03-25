import Anthropic from "@anthropic-ai/sdk";
import TelegramPost from "../models/TelegramPost.js";
import { baseLogger } from "../middlewares/logger.js";

const TELEGRAM_API = "https://api.telegram.org/bot";

class TelegramBotService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
    this.anthropic = null;
  }

  /**
   * Инициализация Anthropic клиента
   */
  getAnthropicClient() {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * Отправка текстового сообщения в канал
   */
  async sendMessage(text, parseMode = "HTML") {
    if (!this.botToken || !this.channelId) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not configured",
      );
    }

    const url = `${TELEGRAM_API}${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.channelId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }

  /**
   * Отправка фото с подписью в канал
   */
  async sendPhoto(photoUrl, caption, parseMode = "HTML") {
    if (!this.botToken || !this.channelId) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not configured",
      );
    }

    const url = `${TELEGRAM_API}${this.botToken}/sendPhoto`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.channelId,
        photo: photoUrl,
        caption,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }

  /**
   * Check if Anthropic API is configured
   */
  isAIConfigured() {
    const key = process.env.ANTHROPIC_API_KEY;
    return key && key !== "sk-ant-replace" && !key.startsWith("sk-ant-replace");
  }

  /**
   * Fallback post templates when AI is unavailable
   */
  getFallbackPost(type) {
    const templates = {
      esoteric:
        "✨ <b>Цвет — это язык вселенной</b>\n\nКаждый оттенок несёт свою вибрацию. Бирюзовый — связь с высшим. Фуксия — пробуждение интуиции. Золотой — мудрость предков.\n\nНаши хаори говорят на этом языке. Под UV-светом они раскрывают то, что скрыто днём.\n\n#HaoriVision #эзотерика #энергияцвета",
      haori_work:
        "🎨 <b>Новая работа в мастерской</b>\n\nКаждое хаори рождается из потокового состояния — когда рука художника следует за интуицией, а не за разумом. UV-пигменты ложатся слой за слоем, создавая скрытый мир, который оживает только под ультрафиолетом.\n\nЕдинственный экземпляр. Подпись LiZa.\n\n#HaoriVision #хаори #wearableart",
      news: "📢 <b>HAORI VISION</b>\n\nМы продолжаем создавать уникальные произведения носимого света. Каждая работа — единственный экземпляр, расписанный вручную UV-реактивными красками.\n\nСледите за обновлениями!\n\n#HaoriVision #новости",
      promo:
        "💜 <b>Bespoke заказ — хаори по вашей энергии</b>\n\nHaori Vision создаёт индивидуальные хаори от €3,000. Художник LiZa создаст moodboard по вашей энергии и предложит эскиз в течение 72 часов.\n\nСрок: 2-4 недели. Результат: единственное в мире произведение.\n\n#HaoriVision #bespoke",
      behind_scenes:
        "🔮 <b>За кулисами мастерской</b>\n\nСегодня в работе — новый слой UV-пигментов. Каждый слой сохнет 24 часа. На одном хаори — от 4 до 12 слоёв. Терпение и поток.\n\nLiZa работает только под музыку и при свечах.\n\n#HaoriVision #процесс #behindthescenes",
    };
    return templates[type] || templates.news;
  }

  /**
   * AI-генерация поста по теме
   */
  async generatePost(type, topic = null) {
    // Fallback if AI not configured
    if (!this.isAIConfigured()) {
      const text = this.getFallbackPost(type);
      const post = new TelegramPost({
        type,
        text,
        status: "draft",
        aiGenerated: false,
      });
      await post.save();
      return post;
    }

    const client = this.getAnthropicClient();

    const prompts = {
      esoteric: `Ты — голос бренда HAORI VISION. Напиши пост для Telegram-канала на тему эзотерики.
${topic ? `Тема: ${topic}` : "Выбери интересную тему: энергия цвета, сакральная геометрия, чакры и одежда, аура, нумерология в моде, кристаллы и ткани."}

Стиль: мистический, но современный. Без банальностей. Короткий пост 3-5 предложений.
Добавь 2-3 подходящих эмодзи. В конце добавь хэштеги: #HaoriVision #эзотерика и 1-2 тематических.
Формат: HTML (используй <b> для выделения).`,

      haori_work: `Ты — голос бренда HAORI VISION. Напиши пост-презентацию расписного хаори для Telegram-канала.
${topic ? `Описание работы: ${topic}` : "Придумай описание уникального расписного хаори — его энергетику, вдохновение, технику."}

Художник бренда — Елизавета Федькина (LiZa), мастер интуитивной живописи из Москвы. Её стиль: текучие органические линии, космические мотивы, палитра бирюзового и фуксии на тёмном фоне. Каждое хаори расписано вручную UV-реактивными красками — днём элегантное, под ультрафиолетом — живое искусство.

Стиль: художественный, чувственный. Как будто описываешь произведение искусства.
3-5 предложений. 2-3 эмодзи. Хэштеги: #HaoriVision #хаори #wearableart и 1-2 тематических.
Формат: HTML (используй <b> для выделения).`,

      news: `Ты — голос бренда HAORI VISION. Напиши новостной пост для Telegram-канала.
${topic ? `Тема: ${topic}` : "Тема: новости из мира моды, искусства или эзотерики, связанные с Haori Vision."}

Стиль: информативный, но с характером бренда. 3-5 предложений. 2-3 эмодзи.
Хэштеги: #HaoriVision и 2 тематических. Формат: HTML.`,

      promo: `Ты — голос бренда HAORI VISION. Напиши промо-пост для Telegram-канала.
${topic ? `Акция/предложение: ${topic}` : "Придумай интересное предложение или анонс для подписчиков."}

Стиль: вдохновляющий, не навязчивый. 3-5 предложений. 2-3 эмодзи.
Упомяни bespoke (от €3,000) или коллекции. Хэштеги: #HaoriVision #bespoke.
Формат: HTML.`,

      behind_scenes: `Ты — голос бренда HAORI VISION. Напиши закулисный пост для Telegram-канала.
${topic ? `Что показать: ${topic}` : "Покажи процесс создания хаори — от эскиза до готовой работы."}

Стиль: тёплый, личный, как дневник художника. 3-5 предложений. 2-3 эмодзи.
Хэштеги: #HaoriVision #процесс #behindthescenes. Формат: HTML.`,
    };

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompts[type] || prompts.news,
        },
      ],
    });

    const text = message.content[0].text;

    // Сохраняем в БД
    const post = new TelegramPost({
      type,
      text,
      status: "draft",
      aiGenerated: true,
    });
    await post.save();

    return post;
  }

  /**
   * Отправка поста из БД
   */
  async publishPost(postId) {
    const post = await TelegramPost.findById(postId);
    if (!post) throw new Error("Post not found");

    try {
      let result;
      if (post.imageUrl || post.imagePath) {
        const photo = post.imageUrl || post.imagePath;
        result = await this.sendPhoto(photo, post.text);
      } else {
        result = await this.sendMessage(post.text);
      }

      post.status = "sent";
      post.sentAt = new Date();
      post.telegramMessageId = result.message_id;
      await post.save();

      return post;
    } catch (error) {
      post.status = "failed";
      post.error = error.message;
      await post.save();
      throw error;
    }
  }

  /**
   * Генерация и немедленная отправка
   */
  async generateAndPublish(type, topic = null, imageUrl = null) {
    const post = await this.generatePost(type, topic);

    if (imageUrl) {
      post.imageUrl = imageUrl;
      await post.save();
    }

    return await this.publishPost(post._id);
  }

  /**
   * Автопостинг — выбирает случайный тип и публикует
   */
  async autoPost() {
    const types = ["esoteric", "haori_work", "news", "behind_scenes"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    baseLogger.info(`[Telegram] Auto-Post: generating ${randomType} post...`);
    return await this.generateAndPublish(randomType);
  }

  /**
   * Отправка запланированных постов
   */
  async publishScheduled() {
    const now = new Date();
    const posts = await TelegramPost.find({
      status: "scheduled",
      scheduledAt: { $lte: now },
    });

    const results = [];
    for (const post of posts) {
      try {
        await this.publishPost(post._id);
        results.push({ id: post._id, status: "sent" });
      } catch (error) {
        results.push({ id: post._id, status: "failed", error: error.message });
      }
    }

    return results;
  }

  /**
   * Получение статистики
   */
  async getStats() {
    const total = await TelegramPost.countDocuments();
    const sent = await TelegramPost.countDocuments({ status: "sent" });
    const scheduled = await TelegramPost.countDocuments({
      status: "scheduled",
    });
    const drafts = await TelegramPost.countDocuments({ status: "draft" });
    const failed = await TelegramPost.countDocuments({ status: "failed" });

    const byType = await TelegramPost.aggregate([
      { $match: { status: "sent" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    return { total, sent, scheduled, drafts, failed, byType };
  }

  /**
   * Настройка команд бота
   */
  async setCommands() {
    if (!this.botToken) return;

    const url = `${TELEGRAM_API}${this.botToken}/setMyCommands`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "Открыть HaoriVision" },
          { command: "catalog", description: "Каталог изделий" },
          { command: "order", description: "Индивидуальный заказ" },
          { command: "portfolio", description: "Портфолио работ" },
          { command: "help", description: "Помощь" },
        ],
      }),
    });
  }

  /**
   * Настройка кнопки меню Mini App
   */
  async setMenuButton() {
    if (!this.botToken) return;

    const miniAppUrl =
      process.env.MINIAPP_URL ||
      `${process.env.CLIENT_URL || "https://haorivision.com"}/miniapp`;
    const url = `${TELEGRAM_API}${this.botToken}/setChatMenuButton`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "HaoriVision",
          web_app: { url: miniAppUrl },
        },
      }),
    });
  }

  /**
   * Обработка входящих сообщений (webhook)
   */
  async handleUpdate(update) {
    if (!update.message) return;

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    // Команда /start
    if (text.startsWith("/start")) {
      const param = text.split(" ")[1] || "";
      let reply = `<b>Добро пожаловать в HaoriVision!</b>\n\n`;
      reply += `Носимое искусство — ручная роспись UV-пигментами.\n\n`;
      reply += `Команды:\n`;
      reply += `/catalog — Каталог изделий\n`;
      reply += `/order — Индивидуальный заказ\n`;
      reply += `/portfolio — Портфолио работ\n`;
      reply += `/help — Помощь\n\n`;
      reply += `Или нажмите кнопку <b>Menu</b> для открытия приложения.`;

      if (param.startsWith("order_") || param.startsWith("custom_")) {
        reply += `\n\nВаш заказ <code>${param}</code> получен! Мы свяжемся с вами в ближайшее время.`;
      }

      await this.sendDirectMessage(chatId, reply);
      return;
    }

    // Команды каталог/заказ/портфолио
    const miniAppUrl =
      process.env.MINIAPP_URL ||
      `${process.env.CLIENT_URL || "https://haorivision.com"}/miniapp`;
    const commands = {
      "/catalog": { text: "Откройте каталог:", screen: "catalog" },
      "/order": { text: "Создайте индивидуальный заказ:", screen: "order" },
      "/portfolio": { text: "Посмотрите портфолио:", screen: "portfolio" },
    };

    if (commands[text]) {
      const cmd = commands[text];
      await this.sendDirectMessage(chatId, `${cmd.text}`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Открыть",
                web_app: { url: `${miniAppUrl}#${cmd.screen}` },
              },
            ],
          ],
        },
      });
      return;
    }

    if (text === "/help") {
      await this.sendDirectMessage(
        chatId,
        `<b>Помощь HaoriVision</b>\n\n` +
          `Мы создаём уникальные расписные хаори, джинсы, куртки и арт-объекты.\n\n` +
          `Каждое изделие — единственный экземпляр\n` +
          `UV-реактивные пигменты\n` +
          `Доставка по всему миру\n\n` +
          `Вопросы? Просто напишите нам здесь!`,
      );
      return;
    }

    // Ответ на произвольное сообщение
    await this.sendDirectMessage(
      chatId,
      `Спасибо за сообщение! Наша команда ответит вам в ближайшее время.`,
    );
  }

  /**
   * Отправка сообщения конкретному пользователю
   */
  async sendDirectMessage(chatId, text, extra = {}) {
    if (!this.botToken) return;

    const url = `${TELEGRAM_API}${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...extra,
      }),
    });
    return await response.json();
  }

  /**
   * Установка webhook
   */
  async setWebhook(webhookUrl) {
    if (!this.botToken) return;

    const url = `${TELEGRAM_API}${this.botToken}/setWebhook`;
    const body = { url: webhookUrl };
    // Передаём secret_token для верификации входящих webhook-запросов
    if (this.webhookSecret) {
      body.secret_token = this.webhookSecret;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await response.json();
  }

  /**
   * Проверка подписи webhook-запроса от Telegram
   */
  verifyWebhook(req) {
    if (!this.webhookSecret) return true; // Если секрет не настроен — пропускаем
    const token = req.headers["x-telegram-bot-api-secret-token"];
    return token === this.webhookSecret;
  }
}

export default new TelegramBotService();
