import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import PageMeta from "../components/PageMeta";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const Stars = ({ count, interactive, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type={interactive ? "button" : undefined}
        onClick={interactive ? () => onChange(i) : undefined}
        className={`text-xl transition-colors ${
          i <= count ? "text-yellow-400" : "text-zinc-700"
        } ${interactive ? "cursor-pointer hover:text-yellow-300" : "cursor-default"}`}
      >
        ★
      </button>
    ))}
  </div>
);

export default function Reviews() {
  const { isUVMode } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    rating: 5,
    text: "",
    productName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/reviews?page=${p}&limit=12`);
      const d = await r.json();
      setReviews(d.items || []);
      setPage(d.page || 1);
      setPages(d.pages || 1);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Имя и текст обязательны");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast.success("Спасибо! Отзыв отправлен на модерацию");
        setShowForm(false);
        setForm({ name: "", city: "", rating: 5, text: "", productName: "" });
      } else {
        toast.error("Ошибка отправки");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Отзывы"
        description="Отзывы клиентов HAORI VISION — реальные истории владельцев"
      />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className={`text-5xl md:text-7xl font-display font-bold mb-6 ${isUVMode ? "gradient-text text-glow" : "text-white"}`}
          >
            Отзывы
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Что говорят владельцы наших работ
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-8 py-3 rounded-full font-medium transition-colors ${
              isUVMode
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {showForm ? "Скрыть форму" : "Оставить отзыв"}
          </button>
        </motion.div>

        {/* Review form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto mb-16 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
          >
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Имя *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Город</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Оценка</label>
              <Stars
                count={form.rating}
                interactive
                onChange={(r) => setForm({ ...form, rating: r })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Какое изделие
              </label>
              <input
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
                placeholder="Название хаори"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Отзыв *
              </label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Отправка..." : "Отправить отзыв"}
            </button>
          </motion.form>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-zinc-600 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-xl">Пока нет отзывов</p>
            <p className="mt-2">Будьте первым!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl p-6 border ${
                  isUVMode
                    ? "bg-zinc-900/80 border-purple-500/30"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Stars count={r.rating} />
                <p className="text-zinc-300 mt-3 mb-4 text-sm leading-relaxed">
                  {r.text}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{r.name}</p>
                    {r.city && (
                      <p className="text-zinc-500 text-xs">{r.city}</p>
                    )}
                  </div>
                  {r.productName && (
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                      {r.productName}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="px-6 py-3 bg-zinc-800 text-white rounded-full disabled:opacity-50 hover:bg-zinc-700"
            >
              Назад
            </button>
            <span className="px-4 py-3 text-zinc-400">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => load(page + 1)}
              className="px-6 py-3 bg-zinc-800 text-white rounded-full disabled:opacity-50 hover:bg-zinc-700"
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
