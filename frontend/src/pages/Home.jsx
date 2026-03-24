import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import UVParticles from "../components/UVParticles";

const Home = () => {
  const { isUVMode } = useTheme();

  const collections = [
    {
      id: "mycelium_dreams",
      name: "Mycelium Dreams",
      price: 7200,
      editions: 8,
      uvColors: ["#39FF14", "#00D9FF", "#B026FF"],
    },
    {
      id: "void_bloom",
      name: "Void Bloom",
      price: 9800,
      editions: 5,
      uvColors: ["#FF10F0", "#B026FF", "#00D4FF"],
    },
    {
      id: "neon_ancestors",
      name: "Neon Ancestors",
      price: 8400,
      editions: 12,
      uvColors: ["#FF10F0", "#39FF14", "#00D4FF", "#FF6600"],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* UV Particle Effects */}
      <UVParticles isActive={isUVMode} />

      {/* Hero Section with MASSIVE WOW */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-all duration-1000 ${
              isUVMode
                ? "bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50"
                : "bg-gradient-to-b from-black via-zinc-900 to-black"
            }`}
          />

          {/* Radial Glow Effect (UV Mode) */}
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

          {/* Light Rays Effect */}
          {isUVMode && (
            <div className="absolute inset-0 opacity-20">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1 h-full origin-top"
                  style={{
                    background: `linear-gradient(to bottom, ${collections[0].uvColors[i % 3]}, transparent)`,
                    transform: `rotate(${i * 30}deg)`,
                  }}
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {/* Japanese Symbol */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
            className={`text-8xl md:text-9xl mb-8 ${
              isUVMode ? "text-purple-400" : "text-zinc-700"
            }`}
            style={{ fontFamily: "serif" }}
          >
            光
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`text-7xl md:text-9xl font-black mb-6 tracking-tight ${
              isUVMode ? "text-white" : "text-white"
            }`}
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
              className={`text-2xl md:text-4xl mb-3 font-light tracking-wide ${
                isUVMode ? "text-purple-300" : "text-zinc-300"
              }`}
            >
              Носи Свет
            </p>
            <p
              className={`text-2xl md:text-4xl mb-3 font-light tracking-wide ${
                isUVMode ? "text-pink-300" : "text-zinc-400"
              }`}
            >
              Вешай Свет
            </p>
            <p
              className={`text-2xl md:text-4xl font-light tracking-wide ${
                isUVMode ? "text-cyan-300" : "text-zinc-500"
              }`}
            >
              Живи Светом
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto"
          >
            Носимое искусство. Каждое хаори расписано вручную UV-реактивными
            красками. Днём — элегантное пальто. Под ультрафиолетом — живое
            произведение.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link to="/collections">
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
                🔥 Исследовать коллекции
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { label: "Лимитированные", value: "Всего 25" },
              { label: "Доставка", value: "3-4 недели" },
              { label: "С подписью", value: "100%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className={`text-2xl md:text-3xl font-bold mb-1 ${
                    isUVMode ? "text-purple-400" : "text-white"
                  }`}
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

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className={`w-8 h-12 border-2 rounded-full flex justify-center pt-2 ${
              isUVMode ? "border-purple-400" : "border-white"
            }`}
          >
            <motion.div
              className={`w-1.5 h-3 rounded-full ${
                isUVMode ? "bg-purple-400" : "bg-white"
              }`}
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest">
            Прокрутите
          </p>
        </motion.div>
      </section>

      {/* Haori Concept Section */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-50" />

        <div className="relative z-10 max-w-4xl mx-auto text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-5xl md:text-7xl font-black mb-8 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            Два мира в одном хаори
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 leading-relaxed mb-16"
          >
            Каждое хаори живёт двойной жизнью. <br />
            <span
              className={
                isUVMode
                  ? "text-purple-400 font-semibold"
                  : "text-white font-semibold"
              }
            >
              Днём — элегантное пальто. Под UV — живое произведение искусства.
            </span>
            <br />
            Ручная роспись UV-реактивными красками. Каждое — уникальный
            экземпляр.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20"
          >
            <div className="relative group">
              <div
                className={`absolute inset-0 bg-gradient-to-br from-zinc-500/20 to-transparent rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500`}
              />
              <div className="relative bg-zinc-900/80 backdrop-blur-sm p-10 border border-zinc-800 hover:border-zinc-500/50 transition-colors">
                <div className="text-6xl mb-6">☀️</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Дневной свет
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Элегантное шёлковое хаори с тонкими узорами. Стильное пальто
                  для повседневной жизни, галерей и мероприятий.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div
                className={`absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500`}
              />
              <div className="relative bg-zinc-900/80 backdrop-blur-sm p-10 border border-zinc-800 hover:border-purple-500/50 transition-colors">
                <div className="text-6xl mb-6">🔮</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ультрафиолет
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Под UV-светом хаори преображается — раскрываются скрытые
                  космические узоры, спирали и мифологические формы.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-4 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2
              className={`text-5xl md:text-6xl font-black mb-6 ${
                isUVMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                  : "text-white"
              }`}
            >
              Философия
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              Свет спрятан внутри. Большую часть времени мы его не видим. Как
              флуоресцентные узоры на чёрном шёлке — невидимые при дневном
              свете.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Уникальность",
                icon: "✨",
                desc: "Каждое хаори уникально. Расписано художником вручную. С подписью LiZa. Единственный экземпляр.",
              },
              {
                title: "Энергия Света",
                icon: "💡",
                desc: "УФ-реактивные пигменты создают живую энергию. Измени свет — измени реальность.",
              },
              {
                title: "Ритуализм",
                icon: "🕯️",
                desc: "Носить и выставлять HAORI VISION — осознанный акт. Ежедневная медитация на свет.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    i === 0
                      ? "from-purple-500/10"
                      : i === 1
                        ? "from-pink-500/10"
                        : "from-cyan-500/10"
                  } to-transparent rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                />

                <div className="relative bg-zinc-900/50 backdrop-blur-sm p-8 border border-zinc-800 group-hover:border-zinc-700 transition-colors h-full">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      isUVMode ? "text-purple-400" : "text-white"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-5xl md:text-6xl font-black mb-6 text-center ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400"
                : "text-white"
            }`}
          >
            Три Пути Света
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 text-center mb-20 max-w-3xl mx-auto"
          >
            Каждая коллекция предлагает разную энергию. Найди свет, который
            зовёт тебя.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collections.map((collection, i) => (
              <Link key={i} to="/collections">
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative h-[500px] overflow-hidden cursor-pointer group"
                  style={{
                    background: `linear-gradient(180deg, ${collection.uvColors[0]}15 0%, black 100%)`,
                    border: `1px solid ${collection.uvColors[0]}30`,
                  }}
                >
                  {/* Hover Glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${collection.uvColors[0]}, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div>
                      <p className="text-sm text-zinc-500 uppercase tracking-widest mb-2">
                        Коллекция {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3
                        className="text-3xl font-bold mb-4"
                        style={{ color: collection.uvColors[0] }}
                      >
                        {collection.name}
                      </h3>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        {collection.uvColors.map((color, j) => (
                          <div
                            key={j}
                            className="w-8 h-8 rounded-full border-2 border-white/20"
                            style={{ background: color }}
                          />
                        ))}
                      </div>

                      <p className="text-2xl font-bold text-white mb-1">
                        ${collection.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Осталось {collection.editions} издания
                      </p>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Artist Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0">
              <div className="aspect-square md:aspect-auto overflow-hidden">
                <img
                  src="/artist/page1_img1.jpeg"
                  alt="Елизавета Федькина"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h3
                  className={`text-2xl md:text-3xl font-display font-bold mb-1 ${
                    isUVMode ? "text-uv-cyan" : "text-white"
                  }`}
                >
                  Елизавета Федькина
                </h3>
                <p
                  className={`text-sm mb-4 ${isUVMode ? "text-uv-pink" : "text-zinc-500"}`}
                >
                  LiZa · Основной художник HaoriVision ·{" "}
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
                <p
                  className={`italic ${isUVMode ? "text-uv-pink/80" : "text-zinc-500"}`}
                >
                  &laquo;Мои картины — это порталы в другие измерения&raquo;
                </p>
                <Link
                  to="/about"
                  className={`inline-block mt-4 text-sm font-medium transition-colors ${
                    isUVMode
                      ? "text-uv-cyan hover:text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Подробнее о художнике →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        {/* Animated Background */}
        {isUVMode && (
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(176, 38, 255, 0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(255, 16, 240, 0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(176, 38, 255, 0.2) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-5xl md:text-7xl font-black mb-8 ${
              isUVMode ? "text-white" : "text-white"
            }`}
            style={{
              textShadow: isUVMode
                ? "0 0 60px rgba(176, 38, 255, 1), 0 0 100px rgba(255, 16, 240, 0.8)"
                : "none",
            }}
          >
            Готов носить свет?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 mb-12"
          >
            Изготовление под заказ. С подписью художника. Доставка 3-4 недели по
            всему миру.
          </motion.p>

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
        </div>
      </section>
    </div>
  );
};

export default Home;
