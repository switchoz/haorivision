import PageMeta from "../components/PageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useState, Suspense, lazy, Component } from "react";
import { Link } from "react-router-dom";
import collectionsData from "../data/collections.json";
import toast from "react-hot-toast";

class Scene3DFallback extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-3">
          <span className="text-4xl">光</span>
          <p className="text-sm">3D-модель недоступна</p>
          <Link to="/shop" className="text-xs text-purple-400 hover:underline">
            Смотреть в магазине →
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load 3D scene — three.js (~1MB) грузится только когда нужен Canvas
const Collection3DScene = lazy(() => import("../components/Collection3DScene"));

const Collections = () => {
  const { isUVMode } = useTheme();
  const [selectedCollection, setSelectedCollection] = useState(0);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showNotify, setShowNotify] = useState(false);

  const collections = collectionsData.collections;
  const currentCollection = collections[selectedCollection];

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim() || !notifyEmail.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Подписка на коллекцию",
          email: notifyEmail,
          subject: `Уведомление: ${currentCollection?.name || "Новая коллекция"}`,
          message: `Хочу получить уведомление о коллекции "${currentCollection?.name}".`,
        }),
      });
      toast.success("Готово! Мы уведомим вас о старте коллекции.");
      setNotifyEmail("");
      setShowNotify(false);
    } catch {
      toast.error("Ошибка. Попробуйте позже.");
    }
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Коллекции"
        description="Коллекции HAORI VISION — носимое световое искусство. Хаори, куртки, сумки и аксессуары с UV-росписью."
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className={`text-5xl md:text-7xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Коллекции
          </h1>
          <p className="text-xl text-zinc-400">
            Каждая коллекция — это уникальное видение света, превращённое в
            носимое искусство
          </p>
        </motion.div>

        {/* Collection Selector */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {collections.map((col, index) => (
            <motion.button
              key={col.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCollection(index)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCollection === index
                  ? isUVMode
                    ? "bg-uv-pink text-white"
                    : "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {col.name}
            </motion.button>
          ))}
        </div>

        {/* 3D Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* 3D Model */}
          <motion.div
            key={currentCollection.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-[500px] rounded-lg overflow-hidden bg-zinc-900"
          >
            <Scene3DFallback>
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <div className="w-8 h-8 border-2 border-zinc-600 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                }
              >
                <Collection3DScene
                  color={currentCollection.color}
                  isUVMode={isUVMode}
                />
              </Suspense>
            </Scene3DFallback>
          </motion.div>

          {/* Collection Details */}
          <motion.div
            key={currentCollection.id + "_details"}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                  currentCollection.status === "available"
                    ? "bg-green-500/20 text-green-400"
                    : currentCollection.status === "upcoming"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : currentCollection.status === "sold-out"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {currentCollection.status === "available"
                  ? "В наличии"
                  : currentCollection.status === "upcoming"
                    ? "Скоро"
                    : currentCollection.status === "sold-out"
                      ? "Продано"
                      : currentCollection.status}
              </span>
            </div>

            <h2
              className={`text-4xl font-display font-bold mb-4 ${
                isUVMode ? "text-glow-pink" : "text-white"
              }`}
            >
              {currentCollection.name}
            </h2>

            <p
              className={`text-xl mb-6 italic ${
                isUVMode ? "text-uv-cyan" : "text-zinc-300"
              }`}
            >
              "{currentCollection.tagline}"
            </p>

            <p className="text-zinc-400 mb-8 leading-relaxed">
              {currentCollection.description}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Лимитированная Серия</span>
                <span className="text-white font-semibold">
                  {currentCollection.editions.remaining}/
                  {currentCollection.editions.total} доступно
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">
                  Цена набора (Хаори + Холст)
                </span>
                <span className="text-white font-semibold text-2xl">
                  ${currentCollection.priceBundle.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Только Хаори</span>
                <span className="text-zinc-400">
                  ${currentCollection.priceHaori.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Только Холст</span>
                <span className="text-zinc-400">
                  ${currentCollection.priceCanvas.toLocaleString()}
                </span>
              </div>
            </div>

            {/* UV Color Palette */}
            <div className="mb-8">
              <p className="text-zinc-400 mb-3">Цвета УФ-Света</p>
              <div className="flex gap-3">
                {currentCollection.uvColors.map((color, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-12 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: isUVMode ? `0 0 20px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {currentCollection.status === "available" ? (
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-gradient px-8 py-4 rounded-full text-white font-semibold w-full"
                >
                  Посмотреть в Магазине
                </motion.button>
              </Link>
            ) : currentCollection.status === "sold-out" ? (
              <motion.button
                disabled
                className="bg-zinc-800 text-zinc-600 px-8 py-4 rounded-full font-semibold w-full cursor-not-allowed"
              >
                Продано
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotify(true)}
                className="border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-4 rounded-full font-semibold w-full transition-colors"
              >
                Уведомить Меня
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Collection Grid Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24"
        >
          <h3 className="text-3xl font-display font-bold mb-8 text-center text-white">
            Все Коллекции
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                whileHover={{ scale: 1.05, y: -10 }}
                onClick={() => setSelectedCollection(i)}
                className="cursor-pointer card-uv"
              >
                <div className="h-64 mb-4 rounded-lg bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle, ${col.color} 0%, transparent 70%)`,
                    }}
                  />
                  <h4 className="text-2xl font-display font-bold text-white relative z-10">
                    {col.name}
                  </h4>
                </div>
                <p className="text-zinc-400 text-sm mb-2">{col.tagline}</p>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">
                    {col.editions.total} изданий
                  </span>
                  <span className="text-white font-semibold">
                    ${col.priceBundle.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      col.status === "available"
                        ? "bg-green-500/20 text-green-400"
                        : col.status === "sold-out"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {col.status === "available"
                      ? "В наличии"
                      : col.status === "sold-out"
                        ? "Продано"
                        : "Скоро"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Notify Modal */}
      <AnimatePresence>
        {showNotify && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowNotify(false)}
          >
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleNotify}
              className={`w-full max-w-md rounded-2xl p-8 ${
                isUVMode
                  ? "bg-zinc-900 border border-purple-500/30"
                  : "bg-zinc-900 border border-zinc-700"
              }`}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Узнать о старте первым
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                Оставьте email — мы напишем, когда коллекция{" "}
                <span className="text-white">{currentCollection?.name}</span>{" "}
                станет доступна.
              </p>
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white mb-4 focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isUVMode
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  Подписаться
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotify(false)}
                  className="px-6 py-3 rounded-xl text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Collections;
