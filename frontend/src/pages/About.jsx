import PageMeta from "../components/PageMeta";
import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useSearchParams } from "react-router-dom";
import WorkModal from "../components/gallery/WorkModal";
import WorkCard from "../components/gallery/WorkCard";
import {
  paintings,
  graphics,
  artistInfo,
  categories,
} from "../data/artist-works";

const Presentation = lazy(() => import("./Presentation"));

const { exhibitions } = artistInfo;

const About = () => {
  const { isUVMode } = useTheme();
  const [selectedWork, setSelectedWork] = useState(null);
  const [activeTab, setActiveTab] = useState("paintings");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(
    searchParams.get("view") === "presentation" ? "presentation" : "info",
  );
  const [uvShowcase, setUvShowcase] = useState(false);

  const allWorks = activeTab === "paintings" ? paintings : graphics;
  const filteredWorks = useMemo(() => {
    if (activeFilter === "all") return allWorks;
    const cat = categories.find((c) => c.id === activeFilter);
    return cat?.filter ? allWorks.filter(cat.filter) : allWorks;
  }, [allWorks, activeFilter]);

  // ── Fullscreen Presentation mode ──
  if (view === "presentation") {
    return (
      <div className="relative">
        {/* Back button */}
        <button
          onClick={() => setView("info")}
          className={`fixed top-5 left-5 z-[300] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
            isUVMode
              ? "bg-black/60 text-purple-300 border border-purple-500/30 hover:bg-black/80"
              : "bg-black/60 text-white/70 border border-white/10 hover:bg-black/80"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Художник
        </button>
        <Suspense fallback={null}>
          <Presentation />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Художник"
        description="HAORI VISION — бренд носимого светового искусства. Художник Елизавета Федькина (LiZa). Интуитивная живопись, UV-арт."
      />
      {/* ═══════════════════════════════════════════
          HERO — Full-bleed cinematic header
          ═══════════════════════════════════════════ */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/artist/page3_img1.jpeg"
            alt="Елизавета Федькина"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          {isUVMode && (
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent mix-blend-overlay" />
          )}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-12 w-full">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm uppercase tracking-[0.3em] mb-3 ${
              isUVMode ? "text-uv-cyan" : "text-zinc-400"
            }`}
          >
            Художник
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-3"
          >
            Елизавета Федькина
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-xl mb-8 ${isUVMode ? "text-uv-pink" : "text-zinc-300"}`}
          >
            LiZa &middot; Интуитивная живопись &middot; Москва
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setView("presentation")}
            className={`group inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-500 ${
              isUVMode
                ? "bg-purple-600/80 text-white border border-purple-400/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40"
            }`}
            style={{ backdropFilter: "blur(12px)" }}
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                isUVMode
                  ? "bg-white/20 group-hover:bg-white/30"
                  : "bg-white/10 group-hover:bg-white/20"
              }`}
            >
              <svg
                className="w-4 h-4 ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </span>
            Смотреть презентацию
          </motion.button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ARTIST BIO — Two-column layout
          ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Portrait column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="sticky top-28 space-y-6">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                <img
                  src="/artist/page2_img1.jpeg"
                  alt="Елизавета Федькина в студии"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 aspect-square rounded-xl overflow-hidden">
                  <img
                    src="/artist/page18_img1.jpeg"
                    alt="С картиной"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 aspect-square rounded-xl overflow-hidden">
                  <img
                    src="/artist/page4_img1.jpeg"
                    alt="Процесс создания"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 flex flex-col justify-center"
          >
            <h2
              className={`text-sm uppercase tracking-[0.25em] mb-6 ${
                isUVMode ? "text-uv-cyan" : "text-zinc-500"
              }`}
            >
              О художнике
            </h2>

            <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">
                  Елизавета Федькина
                </span>{" "}
                — мастер интуитивной живописи, создатель визуального языка
                HaoriVision. Каждая работа рождается в потоковом состоянии — из
                эмоции, запроса, слова, цвета и формы.
              </p>

              <blockquote
                className={`border-l-2 pl-6 py-4 my-8 text-2xl font-display italic ${
                  isUVMode
                    ? "border-uv-pink text-uv-pink"
                    : "border-zinc-600 text-white"
                }`}
              >
                &laquo;Мои картины — это порталы в другие измерения&raquo;
              </blockquote>

              <p>
                Выпускница МГУДТ им. Косыгина (промышленный дизайн) и РГУ им.
                Косыгина (искусствоведение). Защитила диплом на тему реализации
                принципов интуитивного творчества в произведениях искусства и
                предметной среде.
              </p>

              <p>
                Её визуальный язык — непрерывные текучие линии, органические
                спирали, космические мотивы: луны, звёзды, мифологические
                существа, порталы и глаза. Палитра бирюзового, фуксии и золота
                на тёмном фоне.
              </p>

              <p>
                От холста к ткани: Елизавета переносит свой потоковый стиль на
                хаори, создавая изделия с двойной жизнью. Днём — элегантное
                пальто. Под UV — живое произведение искусства.
              </p>
            </div>

            {/* Social links */}
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://instagram.com/DIKO.RATIVNO"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isUVMode
                    ? "bg-uv-pink/15 text-uv-pink border border-uv-pink/30 hover:bg-uv-pink/25"
                    : "bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <span>IG</span> @DIKO.RATIVNO
              </a>
              <a
                href="https://t.me/haori_vision_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isUVMode
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                    : "bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <span>TG</span> HaoriVision
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          UV HAORI SHOWCASE — Day vs Night
          ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className={`text-4xl md:text-5xl font-display font-bold mb-4 ${
                isUVMode ? "gradient-text text-glow" : "text-white"
              }`}
            >
              Днём — одежда. Ночью — портал.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Флуоресцентные краски, ручная роспись, UV-реактивные пигменты.
              Каждое хаори живёт двойной жизнью.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div
              className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group transition-shadow duration-700 ${
                uvShowcase ? "shadow-[0_0_50px_rgba(139,0,255,0.4)]" : ""
              }`}
              onClick={() => setUvShowcase(!uvShowcase)}
            >
              <img
                src="/artist/haori-presentation.jpg"
                alt="Хаори HAORI VISION"
                className="w-full h-full object-cover transition-all duration-[1200ms]"
                style={{
                  filter: uvShowcase
                    ? "saturate(1.8) brightness(1.2) hue-rotate(-15deg) contrast(1.2)"
                    : "saturate(1) brightness(1)",
                }}
              />

              {/* UV glow overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-[1200ms]"
                style={{
                  opacity: uvShowcase ? 1 : 0,
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(139,0,255,0.2) 0%, rgba(255,0,180,0.1) 40%, transparent 70%)",
                  boxShadow:
                    "inset 0 0 80px rgba(139,0,255,0.3), inset 0 0 160px rgba(255,0,180,0.15)",
                  mixBlendMode: "screen",
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Toggle */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <span
                  className={`text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                    !uvShowcase
                      ? "bg-white/20 text-white"
                      : "bg-transparent text-zinc-500"
                  }`}
                >
                  Дневной свет
                </span>
                <div
                  className={`w-12 h-6 rounded-full relative transition-all ${uvShowcase ? "bg-purple-600" : "bg-zinc-600"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${uvShowcase ? "left-6" : "left-0.5"}`}
                  />
                </div>
                <span
                  className={`text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                    uvShowcase
                      ? "bg-purple-500/30 text-purple-300"
                      : "bg-transparent text-zinc-500"
                  }`}
                >
                  UV-свет
                </span>
              </div>
            </div>
            <p className="text-center text-zinc-500 text-sm mt-4">
              Нажмите для переключения
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { label: "Ручная роспись", value: "UV-краски" },
              { label: "Тираж", value: "1 шт." },
              { label: "Подпись", value: "LiZa" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className={`text-lg font-bold mb-0.5 ${
                    isUVMode ? "text-purple-300" : "text-white"
                  }`}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FULL GALLERY — Tabs, Filters, WorkCard grid
          ═══════════════════════════════════════════ */}
      <section
        id="gallery"
        className={`content-lazy py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className={`text-4xl md:text-5xl font-display font-bold mb-4 ${
                isUVMode ? "gradient-text text-glow" : "text-white"
              }`}
            >
              Галерея работ
            </h2>
            <p className="text-zinc-400 text-lg">
              Интуитивная живопись. Акрил, смешанная техника
            </p>
          </motion.div>

          {/* Tabs: Paintings / Graphics */}
          <div className="flex items-center justify-center gap-6 mb-8">
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
                className={`text-sm font-semibold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? isUVMode
                      ? "text-purple-400 border-purple-400"
                      : "text-white border-white"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {tab.label}{" "}
                <span className="text-zinc-600 ml-1">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Filters (for paintings) */}
          {activeTab === "paintings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
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
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                      activeFilter === cat.id
                        ? isUVMode
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-white/10 text-white border border-white/30"
                        : "text-zinc-500 border border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {cat.label} <span className="opacity-50">{count}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Works grid */}
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredWorks.map((work, i) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={i}
                  isUV={isUVMode}
                  onClick={setSelectedWork}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredWorks.length === 0 && (
            <div className="text-center py-20 text-zinc-500 text-sm uppercase tracking-wider">
              Нет работ в этой категории
            </div>
          )}
        </div>
      </section>

      {/* Work Modal */}
      <AnimatePresence>
        {selectedWork && (
          <WorkModal
            work={selectedWork}
            isUV={isUVMode}
            onClose={() => setSelectedWork(null)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          PROCESS — Behind the scenes
          ═══════════════════════════════════════════ */}
      <section className="content-lazy py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={`text-4xl md:text-5xl font-display font-bold mb-4 ${
                isUVMode ? "gradient-text text-glow" : "text-white"
              }`}
            >
              Процесс создания
            </h2>
            <p className="text-zinc-400 text-lg">
              От потока сознания к носимому искусству
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Поток",
                desc: "Каждая работа начинается с эмоции — точки, цвета, формы. Елизавета входит в потоковое состояние, и линии сами находят путь по поверхности.",
                img: "/artist/page4_img1.jpeg",
              },
              {
                step: "02",
                title: "Свет",
                desc: "UV-реактивные пигменты наносятся послойно. Каждый слой проверяется под ультрафиолетом. Днём — одна история, под UV — совершенно другая.",
                img: "/artist/page26_img1.jpeg",
              },
              {
                step: "03",
                title: "Жизнь",
                desc: "Готовое произведение живёт в двух мирах — на стене как картина или на теле как хаори. С подписью художника LiZa.",
                img: "/artist/page6_img1.jpeg",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-6">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div
                  className={`text-xs uppercase tracking-[0.2em] mb-2 ${
                    isUVMode ? "text-uv-cyan" : "text-zinc-500"
                  }`}
                >
                  {item.step}
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          EXHIBITIONS — Timeline
          ═══════════════════════════════════════════ */}
      <section
        className={`content-lazy py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-4xl font-display font-bold mb-16 text-center ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Выставки и признание
          </motion.h2>

          <div className="space-y-0">
            {exhibitions.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex gap-8 py-8 ${
                  i < exhibitions.length - 1 ? "border-b border-zinc-800" : ""
                }`}
              >
                <div
                  className={`text-3xl font-display font-bold shrink-0 w-20 ${
                    isUVMode ? "text-uv-pink" : "text-zinc-600"
                  }`}
                >
                  {ex.year}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {ex.title}
                  </h3>
                  <p className="text-zinc-400">{ex.venue}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-zinc-500 text-sm">
              Галереи: {artistInfo.galleries.join(" · ")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PHILOSOPHY — Brand values
          ═══════════════════════════════════════════ */}
      <section className="content-lazy py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-4xl md:text-5xl font-display font-bold mb-16 text-center ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Философия
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Свет как Язык",
                desc: "Свет — не украшение. Это язык души, который говорит через флуоресценцию, через невидимое, ставшее видимым.",
              },
              {
                title: "Искусство, Не Мода",
                desc: "Мы не модный бренд. Мы художественная практика, принявшая форму одежды. Каждая работа — носимая световая инсталляция.",
              },
              {
                title: "Традиция + Будущее",
                desc: "Японское хаори трансформируется в артефакт самопознания, где древнее мастерство встречает современную технологию UV-пигментов.",
              },
              {
                title: "Ритуал Ношения",
                desc: "Надевать хаори — значит входить в особое состояние. Вы выбираете не одежду, а способ быть видимым миру.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-xl border transition-colors ${
                  isUVMode
                    ? "bg-purple-900/10 border-purple-500/20 hover:border-purple-500/40"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <h3
                  className={`text-xl font-semibold mb-3 ${
                    isUVMode ? "text-uv-pink" : "text-white"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MANIFESTO + CTA
          ═══════════════════════════════════════════ */}
      <section
        className={`content-lazy py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-xl text-zinc-300 mb-16"
          >
            <p>Мы верим, что одежда может быть искусством.</p>
            <p>Мы верим, что свет живёт не только снаружи, но и внутри.</p>
            <p>Мы верим, что истинная роскошь — в уникальности опыта.</p>

            <p
              className={`text-3xl font-display font-bold pt-8 ${
                isUVMode ? "gradient-text text-glow" : "text-white"
              }`}
            >
              Носи Свет. Стань Искусством.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-4 rounded-full font-semibold text-lg transition-all ${
                  isUVMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                Исследовать коллекции
              </motion.button>
            </Link>
            <Link to="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-4 rounded-full font-semibold text-lg border-2 transition-all ${
                  isUVMode
                    ? "border-uv-pink text-uv-pink hover:bg-uv-pink/10"
                    : "border-zinc-600 text-white hover:border-white"
                }`}
              >
                Связаться с художником
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
