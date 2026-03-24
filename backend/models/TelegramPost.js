import mongoose from "mongoose";

const telegramPostSchema = new mongoose.Schema(
  {
    // Тип контента
    type: {
      type: String,
      enum: ["esoteric", "haori_work", "news", "promo", "behind_scenes"],
      required: true,
    },

    // Текст поста
    text: {
      type: String,
      required: true,
    },

    // URL изображения (опционально)
    imageUrl: {
      type: String,
      default: null,
    },

    // Локальный путь к изображению
    imagePath: {
      type: String,
      default: null,
    },

    // Telegram message_id после отправки
    telegramMessageId: {
      type: Number,
      default: null,
    },

    // Статус
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },

    // Запланированное время отправки
    scheduledAt: {
      type: Date,
      default: null,
    },

    // Время фактической отправки
    sentAt: {
      type: Date,
      default: null,
    },

    // Сгенерирован ли AI
    aiGenerated: {
      type: Boolean,
      default: false,
    },

    // Ошибка при отправке
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

telegramPostSchema.index({ status: 1, scheduledAt: 1 });
telegramPostSchema.index({ type: 1 });

export default mongoose.model("TelegramPost", telegramPostSchema);
