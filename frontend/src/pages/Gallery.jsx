// src/pages/Gallery.jsx
// Галерея работ Елизаветы Федькиной + первое хаори HaoriVision
// UV-режим, фильтры, интерактивные карточки

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UVToggle from "../components/UVToggle";
import WorkCard from "../components/gallery/WorkCard";
import WorkModal from "../components/gallery/WorkModal";
import {
  paintings,
  graphics,
  artistInfo,
  categories,
  brandPalette,
} from "../data/artist-works";

// Фото первого хаори — замени на реальный путь когда добавишь фото в public/
const HAORI_UV_IMG = "/artist/haori-dark-uv.jpg";

export default function Gallery() {
  const [isUV, setIsUV] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("paintings");
  const [showHaori, setShowHaori] = useState(false);

  const palette = isUV ? brandPalette.uv : brandPalette.normal;
  const allWorks = activeTab === "paintings" ? paintings : graphics;

  const filteredWorks = useMemo(() => {
    if (activeFilter === "all") return allWorks;
    const cat = categories.find((c) => c.id === activeFilter);
    return cat?.filter ? allWorks.filter(cat.filter) : allWorks;
  }, [allWorks, activeFilter]);

  return (
    <div
      className="min-h-screen relative transition-all duration-[1500ms]"
      style={{
        background: isUV
          ? "radial-gradient(ellipse at 30% 20%, rgba(80,0,160,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(120,0,200,0.2) 0%, transparent 50%), #0a0012"
          : "radial-gradient(ellipse at 50% 0%, rgba(15,15,30,1) 0%, #0a0a14 70%)",
        color: "#fff",
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
        style={{
          background: "rgba(10,10,20,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <a
          href="/"
          className="font-[Unbounded] text-[11px] tracking-[6px] transition-colors duration-1000"
          style={{ color: `rgba(${palette.accentRgb}, 0.5)` }}
        >
          HAORIVISION
        </a>
        <UVToggle isUV={isUV} onToggle={() => setIsUV(!isUV)} />
      </header>

      {/* Hero section */}
      <section className="pt-32 pb-16 px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="font-[Unbounded] text-[9px] tracking-[6px] mb-4 transition-colors duration-1000"
            style={{ color: `rgba(${palette.accentRgb}, 0.4)` }}
          >
            {artistInfo.direction.toUpperCase()}
          </p>
          <h1 className="text-[clamp(32px,5vw,56px)] font-light leading-[1.1] mb-4">
            <span
              className="transition-all duration-1000"
              style={{
                background: isUV
                  ? "linear-gradient(135deg, #ff00b4, #8b00ff, #00ffcc)"
                  : "linear-gradient(135deg, #fff, rgba(0,255,180,0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {artistInfo.name}
            </span>
          </h1>
          <p className="text-lg italic text-white/40 max-w-xl">
            «{artistInfo.quote}»
          </p>
        </motion.div>
      </section>

      {/* Haori showcase section */}
      <section className="px-8 max-w-6xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-xl overflow-hidden"
          style={{
            border: `1px solid rgba(${palette.accentRgb}, 0.15)`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-black">
              <img
                src={HAORI_UV_IMG}
                alt="HaoriVision DARK — первое хаори"
                className="w-full h-full object-cover transition-all duration-[1500ms]"
                style={{
                  filter: isUV
                    ? "saturate(1.3) brightness(1.1)"
                    : "saturate(0.7) brightness(0.6)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 p-5"
                style={{
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                }}
              >
                <span
                  className="font-[Unbounded] text-[9px] tracking-[4px] transition-colors duration-1000"
                  style={{ color: `rgba(${palette.accentRgb}, 0.8)` }}
                >
                  ПЕРВОЕ ХАОРИ · UV-РЕЖИМ
                </span>
              </div>

              {/* UV glow */}
              {isUV && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow:
                      "inset 0 0 80px rgba(139,0,255,0.3), inset 0 0 160px rgba(255,0,180,0.15)",
                  }}
                />
              )}
            </div>

            {/* Text */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-[clamp(24px,4vw,42px)] font-light leading-[1.2] mb-6">
                <span
                  className="transition-colors duration-1000"
                  style={{
                    color: isUV
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(255,255,255,0.9)",
                  }}
                >
                  Днём — одежда.
                </span>
                <br />
                <span
                  className="transition-all duration-1000"
                  style={{
                    color: isUV ? "#fff" : "rgba(255,255,255,0.3)",
                    textShadow: isUV ? "0 0 40px rgba(255,0,180,0.6)" : "none",
                  }}
                >
                  Ночью — портал.
                </span>
              </h2>
              <p className="text-base text-white/50 leading-relaxed mb-6">
                Флуоресцентные краски, ручная роспись, UV-реактивные пигменты.
                Каждое хаори живёт двойной жизнью — видимой и скрытой.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Спиральные мотивы — подпись LiZa",
                  "Солярный символ — энергетическое ядро",
                  "Силуэтный слой — глубина проявления",
                ].map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-1000"
                      style={{ background: palette.accent }}
                    />
                    <span className="text-sm text-white/45">{t}</span>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => setIsUV(!isUV)}
                className="self-start px-6 py-3 rounded-md font-[Unbounded] text-[10px] tracking-[3px] transition-all duration-300 hover:scale-[1.03]"
                style={{
                  border: `1px solid rgba(${palette.accentRgb}, 0.4)`,
                  color: `rgba(${palette.accentRgb}, 0.8)`,
                }}
              >
                {isUV ? "ВЫКЛЮЧИТЬ UV" : "ВКЛЮЧИТЬ UV ⚡"}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Tabs: Paintings / Graphics */}
      <section className="px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-8 mb-6">
          {[
            { id: "paintings", label: "Живопись", count: paintings.length },
            { id: "graphics", label: "Графика", count: graphics.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveFilter("all");
              }}
              className="font-[Unbounded] text-[10px] tracking-[3px] pb-2 transition-all duration-300"
              style={{
                color:
                  activeTab === tab.id
                    ? `rgba(${palette.accentRgb}, 0.8)`
                    : "rgba(255,255,255,0.3)",
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid rgba(${palette.accentRgb}, 0.5)`
                    : "2px solid transparent",
              }}
            >
              {tab.label}{" "}
              <span className="text-white/20 ml-1">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab === "paintings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((cat) => {
              const count = cat.filter
                ? paintings.filter(cat.filter).length
                : paintings.length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className="px-4 py-2 rounded-full text-xs font-[Unbounded] tracking-[1px] transition-all duration-300"
                  style={{
                    background:
                      activeFilter === cat.id
                        ? `rgba(${palette.accentRgb}, 0.15)`
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeFilter === cat.id ? `rgba(${palette.accentRgb}, 0.4)` : "rgba(255,255,255,0.08)"}`,
                    color:
                      activeFilter === cat.id
                        ? `rgba(${palette.accentRgb}, 0.9)`
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {cat.label} <span className="opacity-50 ml-1">{count}</span>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Works grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-20"
        >
          <AnimatePresence mode="popLayout">
            {filteredWorks.map((work, i) => (
              <WorkCard
                key={work.id}
                work={work}
                index={i}
                isUV={isUV}
                onClick={setSelectedWork}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredWorks.length === 0 && (
          <div className="text-center py-20 text-white/30 font-[Unbounded] text-xs tracking-[3px]">
            НЕТ РАБОТ В ЭТОЙ КАТЕГОРИИ
          </div>
        )}
      </section>

      {/* Process section */}
      <section className="px-8 max-w-6xl mx-auto py-20">
        <p
          className="font-[Unbounded] text-[9px] tracking-[6px] mb-4 transition-colors duration-1000"
          style={{ color: `rgba(${palette.accentRgb}, 0.4)` }}
        >
          ПРОЦЕСС
        </p>
        <h2 className="text-3xl font-light mb-10">Как рождается хаори</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              title: "Интуитивный поток",
              desc: "Образ рождается из эмоции, слова, имени. Художник входит в потоковое состояние — и линия ведёт сама.",
            },
            {
              num: "02",
              title: "Перенос на ткань",
              desc: "Орнаменты адаптируются под форму хаори. Многослойная роспись вручную — акрил и флуоресцентные пигменты.",
            },
            {
              num: "03",
              title: "UV-слой",
              desc: "Скрытый рисунок наносится UV-реактивными красками. При обычном свете невидим — при ультрафиолете проявляется.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="p-6 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid rgba(${palette.accentRgb}, 0.1)`,
              }}
            >
              <span
                className="font-[Unbounded] text-3xl font-extralight block mb-4 transition-colors duration-1000"
                style={{ color: `rgba(${palette.accentRgb}, 0.15)` }}
              >
                {step.num}
              </span>
              <h3 className="text-lg font-normal mb-3">{step.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Work Modal */}
      <AnimatePresence>
        {selectedWork && (
          <WorkModal
            work={selectedWork}
            isUV={isUV}
            onClose={() => setSelectedWork(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
