import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const artworks = [
  { src: "/artist/page6_img2.jpeg", title: "Лунное Солнце", size: "60x100 см" },
  { src: "/artist/page7_img1.jpeg", title: "Жар-Птица", size: "70x100 см" },
  {
    src: "/artist/page9_img1.jpeg",
    title: "Туманность Андромеды",
    size: "70x100 см",
  },
  {
    src: "/artist/page17_img1.jpeg",
    title: "Ар-Деко на Сириусе",
    size: "70x100 см",
  },
  { src: "/artist/page31_img1.jpeg", title: "Эфир", size: "50x65 см" },
  { src: "/artist/page5_img2.jpeg", title: "Ихтис", size: "70x100 см" },
  {
    src: "/artist/page16_img1.jpeg",
    title: "Небесное покрывало",
    size: "70x100 см",
  },
  {
    src: "/artist/page34_img1.jpeg",
    title: "Космическое древо",
    size: "70x100 см",
  },
];

const exhibitions = [
  {
    year: "2020",
    title: "Ученики и учитель",
    venue: "Российский центр науки и культуры, Братислава",
  },
  {
    year: "2020",
    title: "В поисках Рая",
    venue: "Выставка современной живописи",
  },
  {
    year: "2021",
    title: "Крылья Ангела",
    venue: "Храм Христа Спасителя, Москва",
  },
  {
    year: "2021",
    title: "Международный конкурс",
    venue: "Диплом II степени — «Весна на планете Сириус»",
  },
];

const About = () => {
  const { isUVMode } = useTheme();
  const [lightboxImg, setLightboxImg] = useState(null);

  return (
    <div className="min-h-screen">
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
            className={`text-xl ${isUVMode ? "text-uv-pink" : "text-zinc-300"}`}
          >
            LiZa &middot; Интуитивная живопись &middot; Москва
          </motion.p>
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
          PORTFOLIO GALLERY — Masonry-style grid
          ═══════════════════════════════════════════ */}
      <section
        className={`py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
      >
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
              Избранные работы
            </h2>
            <p className="text-zinc-400 text-lg">
              Интуитивная живопись. Акрил, смешанная техника
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((work, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`group relative cursor-pointer overflow-hidden rounded-xl ${
                  i === 0 || i === 3 ? "row-span-2" : ""
                }`}
                onClick={() => setLightboxImg(work)}
              >
                <div
                  className={`${i === 0 || i === 3 ? "aspect-[3/5]" : "aspect-square"}`}
                >
                  <img
                    src={work.src}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {work.title}
                    </p>
                    <p className="text-zinc-400 text-xs">{work.size}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 cursor-pointer"
            onClick={() => setLightboxImg(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={lightboxImg.src}
              alt={lightboxImg.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-white font-semibold text-lg">
                {lightboxImg.title}
              </p>
              <p className="text-zinc-400 text-sm">{lightboxImg.size}</p>
            </div>
            <button className="absolute top-6 right-6 text-zinc-400 hover:text-white text-3xl transition-colors">
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          PROCESS — Behind the scenes
          ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
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
        className={`py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
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
              Галереи: ODA Decor &middot; G1.gallery &middot; Meeting point
              &middot; IZZI Decor &middot; Beer & Art
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PHILOSOPHY — Brand values
          ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
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
        className={`py-24 px-6 ${isUVMode ? "bg-zinc-950" : "bg-zinc-900/50"}`}
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
