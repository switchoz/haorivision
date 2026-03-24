// src/components/gallery/WorkModal.jsx
// Модальное окно с детальной информацией о работе

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkModal({ work, isUV, onClose }) {
  const [currentImg, setCurrentImg] = useState(0);
  const accent = isUV ? "255,0,180" : "0,255,180";
  const accentHex = isUV ? "#ff00b4" : "#00ffb4";

  // Собираем все доступные изображения работы
  const images = [work.img, work.imgAlt, work.detail].filter(Boolean);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusLabel =
    work.status === "sold"
      ? "Продано"
      : work.status === "private"
        ? "Частная коллекция"
        : work.price
          ? `${work.price.toLocaleString("ru-RU")} ₽`
          : "В коллекции художника";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: "rgba(12,12,20,0.97)",
          border: `1px solid rgba(${accent}, 0.2)`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          ×
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image section */}
          <div className="relative aspect-[3/4] md:aspect-auto bg-black">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImg}
                src={images[currentImg]}
                alt={work.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full object-cover"
                style={{
                  filter: isUV
                    ? "saturate(1.4) brightness(0.9) hue-rotate(10deg)"
                    : "saturate(1) brightness(1)",
                }}
              />
            </AnimatePresence>

            {/* Image dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background:
                        currentImg === i ? accentHex : "rgba(255,255,255,0.3)",
                      transform: currentImg === i ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* UV glow overlay */}
            {isUV && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    "inset 0 0 60px rgba(139,0,255,0.2), inset 0 0 120px rgba(255,0,180,0.1)",
                }}
              />
            )}
          </div>

          {/* Info section */}
          <div className="p-8 flex flex-col justify-center">
            {/* Color palette */}
            <div className="flex gap-2 mb-6">
              {work.colors?.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.08, type: "spring" }}
                  className="w-8 h-8 rounded-full border-2 border-white/10"
                  style={{ background: c }}
                />
              ))}
            </div>

            {/* Title */}
            <h2 className="text-[28px] font-light mb-2 font-[Cormorant_Garamond]">
              «{work.name}»
            </h2>

            {/* Description */}
            <p className="text-sm text-white/40 italic mb-6 leading-relaxed">
              {work.desc}
            </p>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Размер", value: `${work.size} см` },
                { label: "Техника", value: work.tech },
                { label: "Год", value: work.year },
                { label: "Статус", value: statusLabel },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="rounded-md p-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="font-[Unbounded] text-[8px] tracking-[2px] text-white/30 mb-1">
                    {item.label}
                  </div>
                  <div
                    className="text-sm transition-colors duration-500"
                    style={{ color: `rgba(${accent}, 0.8)` }}
                  >
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA for available works */}
            {work.price && !work.status && (
              <motion.a
                href="/contact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="block text-center py-3 px-6 rounded-md font-[Unbounded] text-[10px] tracking-[3px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  border: `1px solid rgba(${accent}, 0.4)`,
                  color: `rgba(${accent}, 0.8)`,
                }}
              >
                УЗНАТЬ О ПОКУПКЕ
              </motion.a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
