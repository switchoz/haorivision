import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const TwinArtworkViewer = ({ collection }) => {
  const { isUVMode } = useTheme();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const triggerExplosion = () => {
    setShowExplosion(true);
    setTimeout(() => setShowExplosion(false), 1000);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Twin Artwork Viewer */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-none bg-black border border-gray-800">
        {/* Daylight Image (Behind) */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: isUVMode ? 0 : 1 }}
          transition={{ duration: 1 }}
        >
          <img
            src={`/images/${collection.id}-daylight-twin.jpg`}
            alt={`${collection.name} Daylight`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/artist/page5_img1.jpeg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>

        {/* UV Image (Front) with Slider */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isUVMode ? 1 : 0 }}
          transition={{ duration: 1 }}
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={`/images/${collection.id}-uv-twin.jpg`}
            alt={`${collection.name} UV`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/artist/haori-dark-uv.jpg";
            }}
          />

          {/* UV Glow Overlay */}
          <motion.div
            className="absolute inset-0 opacity-40"
            animate={{
              background: [
                "radial-gradient(circle at 30% 40%, rgba(176, 38, 255, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 60%, rgba(255, 16, 240, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 40%, rgba(176, 38, 255, 0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Slider Handle */}
        {isUVMode && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Handle Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  />
                </svg>
              </div>
            </div>

            {/* Glow Effect */}
            <motion.div
              className="absolute top-0 bottom-0 w-20 -left-10"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(176, 38, 255, 0.5), transparent)",
                filter: "blur(20px)",
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}

        {/* Explosion Effect */}
        <AnimatePresence>
          {showExplosion && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ["#B026FF", "#FF10F0", "#00D4FF", "#39FF14"][
                      i % 4
                    ],
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{
                    x: Math.cos((i * 18 * Math.PI) / 180) * 200,
                    y: Math.sin((i * 18 * Math.PI) / 180) * 200,
                    scale: [0, 1, 0],
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labels */}
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            className="bg-black/80 backdrop-blur-sm px-4 py-2 border border-purple-500/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs uppercase tracking-widest text-purple-400">
              Двойное Произведение
            </p>
            <h3 className="text-xl font-bold text-white">{collection.name}</h3>
          </motion.div>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <motion.button
            onClick={triggerExplosion}
            className="bg-purple-500/20 backdrop-blur-sm px-4 py-2 border border-purple-500 text-white text-sm uppercase tracking-wider hover:bg-purple-500/40 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✨ WOW Эффект
          </motion.button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <motion.div
            className="flex justify-between items-end"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-black/80 backdrop-blur-sm px-4 py-3 border border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {isUVMode
                  ? "UV Режим — Свет Раскрыт"
                  : "Дневной Свет — Свет Скрыт"}
              </p>
              <p className="text-white text-sm">
                {isUVMode
                  ? "Перетащи ползунок для сравнения ←→"
                  : "Включи UV чтобы раскрыть свет"}
              </p>
            </div>

            <div className="bg-black/80 backdrop-blur-sm px-6 py-3 border border-purple-500/50">
              <p className="text-3xl font-bold text-white">
                ${collection.price?.toLocaleString()}
              </p>
              <p className="text-xs text-purple-400 uppercase tracking-wider">
                Двойной Набор
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Twin Concept Explanation */}
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="bg-gray-900/50 p-6 border border-gray-800">
          <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">👘</span> Носимая Форма
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Расписанное вручную шёлковое хаори с УФ-реактивными пигментами. Носи
            свет в мир. Трансформируйся в УФ-клубах, галереях, под
            ультрафиолетом.
          </p>
        </div>

        <div className="bg-gray-900/50 p-6 border border-gray-800">
          <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">🖼️</span> Форма Холста
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Тот же узор, те же пигменты, на холсте 40×60см. Повесь свет в своём
            пространстве. Медитируй, размышляй, помни.
          </p>
        </div>
      </motion.div>

      {/* What's Included */}
      <motion.div
        className="mt-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6 border border-purple-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <h4 className="text-lg font-bold text-white mb-4">
          В Двойной Набор Входит:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: "👘", label: "Носимое Искусство (Хаори)" },
            { icon: "🖼️", label: "Искусство на Холсте (40×60см)" },
            { icon: "💡", label: "УФ Лампа (Портативная)" },
            { icon: "✍️", label: "Подпись художника LiZa" },
            { icon: "✍️", label: "Заявление Художника" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <button className="group relative inline-block px-12 py-4 overflow-hidden border-2 border-purple-500 text-white uppercase tracking-wider font-bold hover:text-black transition-colors duration-300">
          <span className="relative z-10">Зарезервируй Свой Двойной Набор</span>
          <div className="absolute inset-0 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Лимитировано {collection.editions} изданиями • Под заказ • Доставка
          3-4 недели
        </p>
      </motion.div>
    </div>
  );
};

export default TwinArtworkViewer;
