import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import UVParticles from "../components/UVParticles";
import PageMeta from "../components/PageMeta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010";

const Home = () => {
  const { isUVMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [uvCompare, setUvCompare] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products?featured=true&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products)
          setProducts(data.products.filter((p) => p.status !== "archived"));
      })
      .catch(() => {});
  }, []);

  // Real artist work photos for hero and sections
  const heroWorks = [
    "/artist/page5_img1.jpeg",
    "/artist/page7_img1.jpeg",
    "/artist/page10_img1.jpeg",
    "/artist/page14_img1.jpeg",
  ];

  const galleryPreview = [
    "/artist/page3_img1.jpeg",
    "/artist/page6_img1.jpeg",
    "/artist/page8_img1.jpeg",
    "/artist/page11_img1.jpeg",
    "/artist/page15_img1.jpeg",
    "/artist/page17_img1.jpeg",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <UVParticles isActive={isUVMode} />

      <PageMeta description="HAORI VISION — носимое световое искусство. Хаори с ручной росписью UV-красками. Каждое изделие уникально. Bespoke от €3,000." />
      {/* ===== HERO ===== */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-all duration-1000 ${
              isUVMode
                ? "bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50"
                : "bg-gradient-to-b from-black via-zinc-900 to-black"
            }`}
          />
          {isUVMode && (
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 80%, rgba(176, 38, 255, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(255, 16, 240, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 80%, rgba(176, 38, 255, 0.3) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
            className={`text-8xl md:text-9xl mb-8 ${isUVMode ? "text-purple-400" : "text-zinc-700"}`}
            style={{ fontFamily: "serif" }}
          >
            光
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-7xl md:text-9xl font-black mb-6 tracking-tight text-white"
            style={{
              textShadow: isUVMode
                ? "0 0 40px rgba(176, 38, 255, 0.8), 0 0 80px rgba(255, 16, 240, 0.6)"
                : "none",
            }}
          >
            HAORI VISION
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-12"
          >
            <p
              className={`text-2xl md:text-4xl mb-3 font-light tracking-wide ${isUVMode ? "text-purple-300" : "text-zinc-300"}`}
            >
              Wearable Light Art
            </p>
            <p
              className={`text-lg md:text-xl font-light tracking-wide ${isUVMode ? "text-pink-300/70" : "text-zinc-500"}`}
            >
              Носимое световое искусство
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto"
          >
            Каждое хаори расписано вручную UV-реактивными красками. Днём —
            элегантное пальто. Под ультрафиолетом — живое произведение.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link to="/shop">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: isUVMode
                    ? "0 0 40px rgba(176, 38, 255, 0.8)"
                    : "none",
                }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 text-lg font-bold uppercase tracking-wider transition-all duration-300 ${
                  isUVMode
                    ? "bg-purple-600 text-white border-2 border-purple-400"
                    : "bg-white text-black border-2 border-white"
                }`}
              >
                Смотреть коллекции
              </motion.button>
            </Link>
            <Link to="/presentation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 text-lg font-medium uppercase tracking-wider border-2 transition-all duration-300 ${
                  isUVMode
                    ? "border-purple-400/50 text-purple-300 hover:bg-purple-900/30"
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                О художнике
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { label: "Лимитированные", value: "3–7 шт." },
              { label: "Ручная роспись", value: "UV-краски" },
              { label: "Подпись художника", value: "LiZa" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className={`text-2xl md:text-3xl font-bold mb-1 ${isUVMode ? "text-purple-400" : "text-white"}`}
                >
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className={`w-8 h-12 border-2 rounded-full flex justify-center pt-2 ${isUVMode ? "border-purple-400" : "border-white"}`}
          >
            <motion.div
              className={`w-1.5 h-3 rounded-full ${isUVMode ? "bg-purple-400" : "bg-white"}`}
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ===== UV BEFORE/AFTER ===== */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-50" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-5xl md:text-7xl font-black mb-8 text-center ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            Два мира в одном хаори
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl text-zinc-400 text-center mb-16 max-w-3xl mx-auto"
          >
            Днём — элегантное пальто. Под UV — живое произведение искусства.
          </motion.p>

          {/* Interactive UV comparison */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-3xl mx-auto"
          >
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => setUvCompare(!uvCompare)}
            >
              <img
                src={
                  uvCompare
                    ? "/artist/haori-dark-uv.jpg"
                    : "/artist/haori-presentation.jpg"
                }
                alt={
                  uvCompare ? "Хаори под UV-светом" : "Хаори при дневном свете"
                }
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Toggle hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <span
                  className={`text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                    !uvCompare
                      ? "bg-white/20 text-white"
                      : "bg-transparent text-zinc-500"
                  }`}
                >
                  Дневной свет
                </span>
                <div
                  className={`w-12 h-6 rounded-full relative transition-all ${uvCompare ? "bg-purple-600" : "bg-zinc-600"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${uvCompare ? "left-6" : "left-0.5"}`}
                  />
                </div>
                <span
                  className={`text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                    uvCompare
                      ? "bg-purple-500/30 text-purple-300"
                      : "bg-transparent text-zinc-500"
                  }`}
                >
                  UV-свет
                </span>
              </div>
            </div>

            <p className="text-center text-zinc-500 text-sm mt-4">
              Нажмите для переключения между режимами
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS (from API) ===== */}
      {products.length > 0 && (
        <section
          className={`py-32 px-4 relative transition-all duration-1000 ${
            isUVMode ? "bg-[#0a0015]" : ""
          }`}
        >
          {/* UV ambient glow */}
          {isUVMode && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(139,0,255,0.15)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(255,0,180,0.1)_0%,transparent_50%)]" />
            </>
          )}
          <div className="relative z-10 max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-5xl md:text-6xl font-black mb-6 text-center transition-all duration-700 ${
                isUVMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400"
                  : "text-white"
              }`}
              style={
                isUVMode
                  ? { filter: "drop-shadow(0 0 20px rgba(0,255,200,0.5))" }
                  : {}
              }
            >
              Коллекция
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`text-xl text-center mb-16 max-w-3xl mx-auto transition-colors duration-700 ${
                isUVMode ? "text-purple-300/80" : "text-zinc-400"
              }`}
            >
              Каждое хаори уникально. Расписано вручную. Лимитированные тиражи.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, i) => {
                const glowColor = product.uvColors?.[0] || "#a855f7";
                return (
                  <Link
                    key={product._id || i}
                    to={`/product/${product.id || product._id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.03, y: -8 }}
                      className={`relative overflow-hidden cursor-pointer group transition-all duration-700 ${
                        isUVMode
                          ? "bg-black/80 border-2 border-purple-500/40"
                          : "bg-zinc-900 border border-zinc-800 hover:border-zinc-600"
                      }`}
                      style={
                        isUVMode
                          ? {
                              boxShadow: `0 0 25px ${glowColor}40, 0 0 60px ${glowColor}15, inset 0 0 30px ${glowColor}08`,
                            }
                          : {}
                      }
                    >
                      {/* Product image */}
                      <div className="aspect-[3/4] overflow-hidden bg-zinc-800 relative">
                        <img
                          src={galleryPreview[i % galleryPreview.length]}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${
                            isUVMode
                              ? "brightness-110 saturate-150 contrast-110"
                              : ""
                          }`}
                          loading="lazy"
                        />
                        <div
                          className={`absolute inset-0 transition-all duration-700 ${
                            isUVMode
                              ? "bg-gradient-to-t from-black/90 via-purple-900/20 to-transparent"
                              : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                          }`}
                        />
                        {/* UV overlay shimmer */}
                        {isUVMode && (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 mix-blend-screen" />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {product.uvColors?.slice(0, 3).map((color, j) => (
                            <div
                              key={j}
                              className={`w-3 h-3 rounded-full transition-all duration-700 ${
                                isUVMode
                                  ? "border-2 border-white/40"
                                  : "border border-white/20"
                              }`}
                              style={
                                isUVMode
                                  ? {
                                      background: color,
                                      boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80`,
                                    }
                                  : { background: color }
                              }
                            />
                          ))}
                        </div>
                        <h3
                          className={`text-xl font-bold mb-1 transition-all duration-700 ${
                            isUVMode ? "text-white" : "text-white"
                          }`}
                          style={
                            isUVMode
                              ? { textShadow: `0 0 15px ${glowColor}80` }
                              : {}
                          }
                        >
                          {product.name}
                        </h3>
                        <p
                          className={`text-sm mb-3 transition-colors duration-700 ${
                            isUVMode ? "text-purple-300/70" : "text-zinc-400"
                          }`}
                        >
                          {product.productCollection}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-lg font-bold transition-all duration-700 ${
                              isUVMode ? "text-cyan-300" : "text-white"
                            }`}
                            style={
                              isUVMode
                                ? { textShadow: "0 0 10px rgba(0,220,255,0.6)" }
                                : {}
                            }
                          >
                            {product.price?.toLocaleString("ru-RU")}{" "}
                            {product.currency === "USD" ? "$" : "₽"}
                          </span>
                          {product.editions && (
                            <span
                              className={`text-xs px-2 py-1 rounded transition-all duration-700 ${
                                product.status === "sold-out"
                                  ? "bg-red-900/50 text-red-400"
                                  : product.status === "low-stock"
                                    ? isUVMode
                                      ? "bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                      : "bg-amber-900/50 text-amber-400"
                                    : isUVMode
                                      ? "bg-purple-900/50 text-purple-300"
                                      : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {product.status === "sold-out"
                                ? "Продано"
                                : product.status === "low-stock"
                                  ? `Осталось ${product.editions.remaining}`
                                  : `${product.editions.remaining} из ${product.editions.total}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-2 transition-all duration-700 ${
                    isUVMode
                      ? "border-purple-400 text-purple-300 hover:bg-purple-900/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                      : "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  Все работы в магазине
                </motion.button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== GALLERY PREVIEW ===== */}
      <section
        className={`py-24 px-4 relative transition-all duration-1000 ${
          isUVMode ? "bg-[#05001a]" : "bg-zinc-950"
        }`}
      >
        {/* UV ambient */}
        {isUVMode && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(100,0,255,0.12)_0%,transparent_70%)]" />
        )}
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-5xl md:text-6xl font-black mb-6 text-center transition-all duration-700 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                : "text-white"
            }`}
            style={
              isUVMode
                ? { filter: "drop-shadow(0 0 25px rgba(0,220,255,0.5))" }
                : {}
            }
          >
            Работы художника
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`text-xl text-center mb-16 transition-colors duration-700 ${
              isUVMode ? "text-purple-300/80" : "text-zinc-400"
            }`}
          >
            Елизавета Федькина (LiZa) — интуитивная живопись, UV-арт
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "/artist/page3_img1.jpeg",
              "/artist/page5_img2.jpeg",
              "/artist/page7_img2.jpeg",
              "/artist/page9_img1.jpeg",
              "/artist/page12_img1.jpeg",
              "/artist/page16_img1.jpeg",
            ].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                className={`aspect-square overflow-hidden relative group cursor-pointer transition-all duration-700 ${
                  isUVMode ? "rounded-lg" : ""
                }`}
                style={
                  isUVMode
                    ? {
                        boxShadow: `0 0 20px rgba(139,0,255,0.3), 0 0 40px rgba(255,0,180,0.15)`,
                        border: "1px solid rgba(139,0,255,0.3)",
                      }
                    : {}
                }
              >
                <img
                  src={src}
                  alt={`Работа LiZa ${i + 1}`}
                  className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${
                    isUVMode ? "brightness-125 saturate-[1.4] contrast-110" : ""
                  }`}
                  loading="lazy"
                />
                {isUVMode && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-pink-500/15 mix-blend-screen" />
                )}
                <div
                  className={`absolute inset-0 transition-all duration-300 ${
                    isUVMode
                      ? "bg-purple-900/0 group-hover:bg-purple-900/20"
                      : "bg-black/0 group-hover:bg-black/30"
                  }`}
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/gallery">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-2 transition-all ${
                  isUVMode
                    ? "border-purple-400 text-purple-300"
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Вся галерея
              </motion.button>
            </Link>
            <Link to="/presentation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                  isUVMode ? "bg-purple-600 text-white" : "bg-white text-black"
                }`}
              >
                Презентация художника
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ARTIST ===== */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`rounded-2xl overflow-hidden ${
              isUVMode
                ? "bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/20"
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
              <div className="aspect-square md:aspect-auto overflow-hidden">
                <img
                  src="/artist/page1_img1.jpeg"
                  alt="Елизавета Федькина"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h3
                  className={`text-2xl md:text-3xl font-bold mb-1 ${isUVMode ? "text-cyan-400" : "text-white"}`}
                >
                  Елизавета Федькина
                </h3>
                <p
                  className={`text-sm mb-4 ${isUVMode ? "text-pink-400" : "text-zinc-500"}`}
                >
                  LiZa &middot; Основной художник HAORI VISION &middot;{" "}
                  <a
                    href="https://instagram.com/DIKO.RATIVNO"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors"
                  >
                    @DIKO.RATIVNO
                  </a>
                </p>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Мастер интуитивной живописи. Каждое хаори расписано вручную
                  UV-реактивными красками в потоковом состоянии — из эмоции,
                  цвета и формы. Текучие органические линии, космические мотивы,
                  палитра бирюзового и фуксии на тёмном фоне.
                </p>
                <p className="text-zinc-400 text-sm mb-4">
                  Выставки: Храм Христа Спасителя, РЦНК Братислава. 50+ работ. 5
                  галерей.
                </p>
                <p
                  className={`italic ${isUVMode ? "text-pink-400/80" : "text-zinc-500"}`}
                >
                  &laquo;Мои картины — это порталы в другие измерения&raquo;
                </p>
                <Link
                  to="/presentation"
                  className={`inline-block mt-4 text-sm font-medium transition-colors ${
                    isUVMode
                      ? "text-cyan-400 hover:text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Полная презентация художника &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BESPOKE CTA ===== */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${
            isUVMode
              ? "bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"
              : "bg-gradient-to-b from-zinc-950 to-black"
          }`}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p
              className={`text-sm uppercase tracking-[0.3em] mb-6 ${isUVMode ? "text-purple-400" : "text-zinc-500"}`}
            >
              Bespoke Commission
            </p>
            <h2
              className="text-5xl md:text-7xl font-black mb-8 text-white"
              style={{
                textShadow: isUVMode
                  ? "0 0 60px rgba(176, 38, 255, 1), 0 0 100px rgba(255, 16, 240, 0.8)"
                  : "none",
              }}
            >
              Создай своё хаори
            </h2>
            <p className="text-xl text-zinc-400 mb-6 max-w-2xl mx-auto">
              Расскажи о своей энергии — и LiZa создаст уникальное хаори,
              расписанное специально для тебя. Персональная консультация,
              moodboard, ручная роспись.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-zinc-500">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isUVMode ? "bg-purple-400" : "bg-zinc-400"}`}
                />
                от &euro;3,000
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isUVMode ? "bg-pink-400" : "bg-zinc-400"}`}
                />
                2–4 недели
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isUVMode ? "bg-cyan-400" : "bg-zinc-400"}`}
                />
                С подписью LiZa
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/shop">
              <motion.button
                whileHover={{
                  scale: 1.1,
                  boxShadow: isUVMode
                    ? "0 0 60px rgba(176, 38, 255, 1)"
                    : "0 10px 40px rgba(255,255,255,0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                className={`px-16 py-6 text-xl font-bold uppercase tracking-widest transition-all duration-300 ${
                  isUVMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white text-black"
                }`}
              >
                Заказать хаори
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section
        className={`py-24 px-4 relative transition-all duration-1000 ${
          isUVMode ? "bg-[#08001a]" : "bg-zinc-950"
        }`}
      >
        {isUVMode && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,0,255,0.12)_0%,transparent_60%)]" />
        )}
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={`text-5xl md:text-6xl font-black mb-6 transition-all duration-700 ${
                isUVMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                  : "text-white"
              }`}
              style={
                isUVMode
                  ? { filter: "drop-shadow(0 0 20px rgba(0,220,255,0.4))" }
                  : {}
              }
            >
              Философия
            </h2>
            <p
              className={`text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-700 ${
                isUVMode ? "text-purple-200/60" : "text-zinc-400"
              }`}
            >
              Свет спрятан внутри. Как флуоресцентные узоры на чёрном шёлке —
              невидимые при дневном свете, но раскрывающиеся под ультрафиолетом.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Уникальность",
                desc: "Каждое хаори уникально. Расписано художником вручную. С подписью LiZa. Единственный экземпляр.",
                glow: "#a855f7",
              },
              {
                title: "Энергия Света",
                desc: "УФ-реактивные пигменты создают живую энергию. Измени свет — измени реальность.",
                glow: "#ff10f0",
              },
              {
                title: "Ритуализм",
                desc: "Носить HAORI VISION — осознанный акт. Ежедневная медитация на свет.",
                glow: "#00d4ff",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div
                  className={`relative backdrop-blur-sm p-8 h-full transition-all duration-700 ${
                    isUVMode
                      ? "bg-black/60 border-2 border-purple-500/30 group-hover:border-purple-400/60"
                      : "bg-zinc-900/50 border border-zinc-800 group-hover:border-zinc-700"
                  }`}
                  style={
                    isUVMode
                      ? {
                          boxShadow: `0 0 20px ${item.glow}25, 0 0 50px ${item.glow}10`,
                        }
                      : {}
                  }
                >
                  <h3
                    className={`text-2xl font-bold mb-4 transition-all duration-700 ${
                      isUVMode ? "text-purple-300" : "text-white"
                    }`}
                    style={
                      isUVMode ? { textShadow: `0 0 15px ${item.glow}80` } : {}
                    }
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`leading-relaxed transition-colors duration-700 ${
                      isUVMode ? "text-zinc-300/70" : "text-zinc-400"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
