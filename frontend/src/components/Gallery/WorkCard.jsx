// src/components/gallery/WorkCard.jsx
// Интерактивная карточка работы с hover-эффектами и UV-режимом

import { useState, memo } from "react";
import { motion } from "framer-motion";

function WorkCard({ work, index, isUV, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = isUV ? "255,0,180" : "0,255,180";

  const statusLabel =
    work.status === "sold"
      ? "Продано"
      : work.status === "private"
        ? "Частная коллекция"
        : work.price
          ? `${work.price.toLocaleString("ru-RU")} ₽`
          : "В коллекции";

  const isSold = work.status === "sold" || work.status === "private";

  return (
    <motion.div
      onClick={() => onClick(work)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(work);
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="cursor-pointer group relative overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid rgba(${accent}, 0.08)`,
      }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-black/50">
        {!imgError && (
          <img
            src={work.img}
            alt={work.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-all duration-700"
            style={{
              opacity: imgLoaded ? 1 : 0,
              filter: isUV
                ? "saturate(1.4) brightness(0.9) hue-rotate(10deg)"
                : "saturate(1) brightness(1)",
            }}
          />
        )}

        {/* Shimmer placeholder */}
        {!imgLoaded && !imgError && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: `linear-gradient(135deg, rgba(${accent},0.05), rgba(${accent},0.02))`,
            }}
          />
        )}

        {/* Fallback: color palette */}
        {imgError && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: work.colors?.[0] || "#1a1a2e" }}
          >
            <div className="flex gap-2">
              {work.colors?.map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border border-white/20"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end"
          style={{
            background:
              "linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)",
          }}
        >
          <div className="p-4 w-full">
            <p className="text-xs text-white/60 leading-relaxed">{work.desc}</p>
          </div>
        </div>

        {/* UV glow border on hover */}
        {isUV && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              boxShadow:
                "inset 0 0 30px rgba(139,0,255,0.3), inset 0 0 60px rgba(255,0,180,0.15)",
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex gap-1.5 mb-3">
          {work.colors?.slice(0, 4).map((c, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-white/10"
              style={{ background: c }}
            />
          ))}
        </div>
        <h3 className="text-[15px] font-normal mb-1 text-white/85 group-hover:text-white transition-colors">
          «{work.name}»
        </h3>
        <p className="font-[Unbounded] text-[8px] tracking-[2px] text-white/30 mb-2">
          {work.size} · {work.tech?.split(",")[0]} · {work.year}
        </p>
        <p
          className="font-[Unbounded] text-[10px] transition-colors duration-500"
          style={{
            color: isSold ? `rgba(${accent}, 0.6)` : "rgba(255,255,255,0.5)",
          }}
        >
          {statusLabel}
        </p>
      </div>
    </motion.div>
  );
}

export default memo(WorkCard);
