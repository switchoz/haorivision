import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Unboxing Feedback Page - "How does your Light feel?"
 */

export default function UnboxingFeedbackPage() {
  const { qrCode } = useParams();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const response = await fetch(`/api/packaging/feedback/${qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: rating,
          message: message,
          photos: photos,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      }

      setUploading(false);
    } catch (error) {
      console.error("Submit feedback error:", error);
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white flex items-center justify-center">
        <motion.div
          className="text-center max-w-2xl mx-auto px-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-4xl font-bold text-purple-300 mb-6">
            Спасибо за твой отзыв!
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Твоё мнение помогает нам создавать ещё более волшебные вещи.
          </p>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-8">
            <p className="text-purple-300 mb-4">🎁 В благодарность:</p>
            <p className="text-white text-xl font-semibold mb-2">
              +50 Glow Points
            </p>
            <p className="text-sm text-gray-400">Добавлено на твой аккаунт</p>
          </div>

          <a
            href="/"
            className="inline-block mt-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
          >
            Вернуться на главную
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent text-center">
            How does your Light feel?
          </h1>

          <p className="text-center text-gray-400 text-lg mb-12">
            Поделись впечатлениями от распаковки и первого знакомства с твоей
            хаори
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8">
              <label className="block text-lg font-semibold text-purple-300 mb-4">
                Как ты оцениваешь свой опыт?
              </label>

              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-5xl transition-all ${
                      star <= rating
                        ? "text-yellow-400 scale-110"
                        : "text-gray-600 hover:text-yellow-400/50"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <p className="text-center text-purple-300 mt-4">
                  {rating === 5 && "🌟 Невероятно!"}
                  {rating === 4 && "✨ Отлично!"}
                  {rating === 3 && "👍 Хорошо!"}
                  {rating === 2 && "😐 Нормально"}
                  {rating === 1 && "😞 Могло быть лучше"}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8">
              <label className="block text-lg font-semibold text-purple-300 mb-4">
                Твоя история
              </label>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Расскажи, как чувствует себя твоя хаори? Где она побывала впервые? Какие эмоции вызвала?"
                rows={6}
                className="w-full px-4 py-3 bg-white/10 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />

              <p className="text-xs text-gray-500 mt-2">
                Лучшие истории попадут на наш сайт в раздел "Light Stories"
              </p>
            </div>

            {/* Photos */}
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8">
              <label className="block text-lg font-semibold text-purple-300 mb-4">
                Фото (опционально)
              </label>

              <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center hover:border-purple-500/60 transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;

                    const uploaded = [];
                    for (const file of files) {
                      const formData = new FormData();
                      formData.append("photo", file);
                      formData.append("qrCode", qrCode);
                      try {
                        const res = await fetch("/api/packaging/upload-photo", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.url) uploaded.push(data.url);
                      } catch (err) {
                        console.error("Upload error:", err);
                      }
                    }
                    setPhotos((prev) => [...prev, ...uploaded]);
                  }}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📸</div>
                  <p className="text-purple-300 mb-2">
                    Загрузи фото своей хаори
                  </p>
                  <p className="text-sm text-gray-400">
                    В дневном свете и UV свечении
                  </p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-purple-500/30"
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                🎁 За фото в UV свете: +25 Glow Points
              </p>
            </div>

            {/* Social Share Prompt */}
            <div className="bg-gradient-to-r from-purple-900/30 to-violet-900/30 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">
                📱 Поделись в соцсетях
              </h3>
              <p className="text-gray-400 mb-4">
                Отметь нас @haorivision с хештегом #wearlight — лучшие посты
                попадут в нашу галерею!
              </p>

              <div className="flex gap-4">
                <a
                  href={`https://instagram.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:from-pink-500 hover:to-purple-500 transition-all"
                >
                  Instagram
                </a>
                <a
                  href={`https://tiktok.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-black border border-white rounded-lg hover:bg-white hover:text-black transition-all"
                >
                  TikTok
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={rating === 0 || uploading}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Отправка..." : "Отправить отзыв"}
            </button>

            {rating === 0 && (
              <p className="text-center text-sm text-gray-500">
                Выбери рейтинг, чтобы отправить отзыв
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
