/**
 * HAORI VISION — 500 Server Error Page (P22)
 *
 * Branded error page with soft, empathetic messaging.
 *
 * Features:
 * - Gentle error message
 * - Contact options (form + DM)
 * - Retry action
 * - UV mode support
 */

import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const ServerError = () => {
  const { isUVMode } = useTheme();

  // Track 500 error for monitoring
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error(
        "[500] Server error occurred at:",
        new Date().toISOString(),
      );
      console.error("[500] URL:", window.location.pathname);
    }
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

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
        className="text-center px-4 max-w-3xl"
      >
        {/* Logo / Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-12"
        >
          <h1
            className={`text-5xl md:text-7xl font-bold tracking-wider mb-4 transition-colors ${
              isUVMode ? "text-purple-400" : "text-white"
            }`}
          >
            HAORI VISION
          </h1>
          <div className="text-zinc-500 text-lg tracking-widest">
            UV-REACTIVE FASHION
          </div>
        </motion.div>

        {/* Error Icon/Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
          <div
            className={`text-8xl md:text-9xl mb-6 transition-colors ${
              isUVMode ? "text-purple-500/50" : "text-zinc-800"
            }`}
          >
            ⚡
          </div>
          <div
            className={`text-6xl md:text-7xl font-bold transition-colors ${
              isUVMode ? "text-purple-400" : "text-zinc-700"
            }`}
          >
            500
          </div>
        </motion.div>

        {/* Empathetic Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12 space-y-4"
        >
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-4">
            Что-то пошло не так
          </h2>

          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
            Наши серверы временно недоступны. Мы уже работаем над решением
            проблемы.
          </p>

          <p className="text-zinc-500 text-base">
            Пожалуйста, попробуйте обновить страницу или вернуться позже.
          </p>

          {/* Technical Details (collapsed by default) */}
          <details className="mt-6 text-left max-w-xl mx-auto">
            <summary className="text-zinc-600 cursor-pointer hover:text-purple-400 transition-colors text-sm">
              Технические детали
            </summary>
            <div className="mt-3 p-4 bg-zinc-900 rounded border border-zinc-800 text-zinc-500 text-xs font-mono">
              <p>Error Code: 500 Internal Server Error</p>
              <p>Timestamp: {new Date().toISOString()}</p>
              <p>Path: {window.location.pathname}</p>
            </div>
          </details>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          {/* Retry Button */}
          <motion.button
            onClick={handleRetry}
            className={`w-full sm:w-auto px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all ${
              isUVMode
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Обновить страницу
          </motion.button>

          {/* Back to Home */}
          <Link to="/">
            <motion.button
              className={`w-full sm:w-auto px-8 py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all ${
                isUVMode
                  ? "border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  : "border-zinc-700 text-white hover:border-zinc-500"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              На главную
            </motion.button>
          </Link>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="border-t border-zinc-800 pt-8"
        >
          <p className="text-zinc-500 mb-6">
            Проблема не решается? Свяжитесь с нами:
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Contact Form */}
            <Link to="/contact">
              <motion.button
                className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  isUVMode
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-zinc-400 hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                📧 Форма обратной связи
              </motion.button>
            </Link>

            {/* Instagram DM */}
            <a
              href="https://instagram.com/haorivision"
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.button
                className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  isUVMode
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-zinc-400 hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                📱 Instagram DM
              </motion.button>
            </a>

            {/* Email */}
            <a href="mailto:support@haorivision.com">
              <motion.button
                className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  isUVMode
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-zinc-400 hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                ✉️ Email
              </motion.button>
            </a>
          </div>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12 text-zinc-600 text-sm"
        >
          <p className="mb-3">Пока мы решаем проблему, вы можете:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/gallery"
              className="hover:text-purple-400 transition-colors"
            >
              Посмотреть галерею
            </Link>
            <Link
              to="/collections"
              className="hover:text-purple-400 transition-colors"
            >
              Изучить коллекции
            </Link>
            <Link
              to="/about"
              className="hover:text-purple-400 transition-colors"
            >
              Узнать о бренде
            </Link>
          </div>
        </motion.div>

        {/* Status Page Link (if exists) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-8"
        >
          <a
            href="https://status.haorivision.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-500 text-xs underline transition-colors"
          >
            Проверить статус системы
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ServerError;
