// src/components/UVToggle.jsx
// Переключатель UV-режима — ключевая фича HaoriVision
// Используется глобально через контекст или локально через props

import { motion } from "framer-motion";

export default function UVToggle({ isUV, onToggle, size = "md" }) {
  const sizes = {
    sm: { w: 44, h: 24, dot: 18, travel: 21 },
    md: { w: 52, h: 28, dot: 22, travel: 25 },
    lg: { w: 64, h: 34, dot: 28, travel: 31 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-3">
      <span
        className="font-[Unbounded] text-[9px] tracking-[3px] transition-colors duration-500"
        style={{
          color: isUV ? "rgba(255,0,180,0.8)" : "rgba(255,255,255,0.4)",
        }}
      >
        UV
      </span>
      <motion.div
        onClick={onToggle}
        className="relative cursor-pointer rounded-full"
        style={{
          width: s.w,
          height: s.h,
          background: isUV
            ? "linear-gradient(135deg, #8b00ff, #ff00b4)"
            : "rgba(255,255,255,0.1)",
          border: isUV
            ? "1px solid rgba(255,0,180,0.5)"
            : "1px solid rgba(255,255,255,0.2)",
        }}
        animate={{
          boxShadow: isUV
            ? "0 0 30px rgba(139,0,255,0.4), 0 0 60px rgba(255,0,180,0.2)"
            : "0 0 0px transparent",
        }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute rounded-full bg-white"
          style={{ width: s.dot, height: s.dot, top: (s.h - s.dot) / 2 - 1 }}
          animate={{
            left: isUV ? s.travel : 3,
            boxShadow: isUV
              ? "0 0 15px rgba(255,255,255,0.6)"
              : "0 0 0px transparent",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </div>
  );
}
