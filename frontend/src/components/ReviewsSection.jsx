import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const Stars = ({ count }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`text-sm ${i <= count ? "text-yellow-400" : "text-zinc-700"}`}
      >
        ★
      </span>
    ))}
  </div>
);

export default function ReviewsSection() {
  const { isUVMode } = useTheme();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews?featured=true&limit=6`)
      .then((r) => r.json())
      .then((d) => setReviews(d.items || []))
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`text-4xl md:text-5xl font-display font-bold text-center mb-4 ${
            isUVMode ? "gradient-text text-glow" : "text-white"
          }`}
        >
          Отзывы
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-zinc-400 text-center mb-12"
        >
          Что говорят владельцы HAORI VISION
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-6 border transition-colors ${
                isUVMode
                  ? "bg-zinc-900/80 border-purple-500/30 shadow-lg shadow-purple-500/10"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <Stars count={r.rating} />
              <p className="text-zinc-300 mt-3 mb-4 text-sm leading-relaxed line-clamp-6">
                {r.text}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{r.name}</p>
                  {r.city && <p className="text-zinc-500 text-xs">{r.city}</p>}
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

        <div className="text-center mt-10">
          <Link
            to="/reviews"
            className={`inline-block px-8 py-3 rounded-full font-medium transition-colors ${
              isUVMode
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            Все отзывы
          </Link>
        </div>
      </div>
    </section>
  );
}
