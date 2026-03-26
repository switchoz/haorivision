/**
 * HAORI VISION — 404 Not Found Page (P22)
 *
 * Branded error page with minimalist design.
 *
 * Features:
 * - Logo centered
 * - Poetic quote about getting lost
 * - "Back to Gallery" CTA
 * - UV mode support
 */

import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const { isUVMode } = useTheme();
  const navigate = useNavigate();

  // Track 404 event for analytics
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[404] Page not found:", window.location.pathname);
    }
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${
        isUVMode ? "bg-black" : "bg-zinc-950"
      }`}
    >
      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-4 max-w-2xl"
      >
        {/* Logo / Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-12"
        >
          <div
            className={`text-5xl mb-4 ${isUVMode ? "text-purple-400" : "text-zinc-700"}`}
            style={{ fontFamily: "serif" }}
          >
            光
          </div>
          <h1
            className={`text-5xl md:text-7xl font-bold tracking-wider mb-4 transition-colors ${
              isUVMode ? "text-purple-400" : "text-white"
            }`}
          >
            HAORI VISION
          </h1>
          <div className="text-zinc-500 text-sm tracking-widest uppercase">
            Носимое световое искусство
          </div>
        </motion.div>

        {/* 404 Error Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
          <div
            className={`text-9xl md:text-[12rem] font-bold transition-colors ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
                : "text-zinc-800"
            }`}
          >
            404
          </div>
        </motion.div>

        {/* Poetic Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-zinc-400 text-xl md:text-2xl italic leading-relaxed mb-4">
            "В темноте мы находим новые пути."
          </p>
          <p className="text-zinc-500 text-lg">
            Эта страница не существует, но ваш путь продолжается.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Primary CTA - Go Home */}
          <Link to="/">
            <motion.button
              className={`w-full sm:w-auto px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all ${
                isUVMode
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              На главную
            </motion.button>
          </Link>

          {/* Secondary CTA - Shop */}
          <Link to="/shop">
            <motion.button
              className={`w-full sm:w-auto px-8 py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all ${
                isUVMode
                  ? "border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  : "border-zinc-700 text-white hover:border-zinc-500"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              В магазин
            </motion.button>
          </Link>

          {/* Tertiary CTA - Gallery */}
          <Link to="/gallery">
            <motion.button
              className={`w-full sm:w-auto px-8 py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all ${
                isUVMode
                  ? "border-purple-500/50 text-purple-400/70 hover:bg-purple-500/10"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Галерея
            </motion.button>
          </Link>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 text-zinc-600 text-sm"
        >
          <p className="mb-2">Возможно, вы ищете:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/shop"
              className="hover:text-purple-400 transition-colors"
            >
              Магазин
            </Link>
            <Link
              to="/collections"
              className="hover:text-purple-400 transition-colors"
            >
              Коллекции
            </Link>
            <Link
              to="/about"
              className="hover:text-purple-400 transition-colors"
            >
              О нас
            </Link>
            <Link
              to="/contact"
              className="hover:text-purple-400 transition-colors"
            >
              Контакты
            </Link>
          </div>
        </motion.div>

        {/* UV Mode Easter Egg */}
        {isUVMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              delay: 1.2,
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="mt-8 text-purple-400 text-xs tracking-widest"
          >
            UV MODE ACTIVATED
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default NotFound;
