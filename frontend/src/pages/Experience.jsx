import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import { artistPhotos, paintings } from "../data/artist-works";
import PageMeta from "../components/PageMeta";

const processSteps = [
  {
    step: "01",
    title: "Выбор ткани",
    desc: "Премиум японский шёлк или шерсть отбираются вручную по текстуре и весу",
  },
  {
    step: "02",
    title: "Медитация",
    desc: "Художник входит в потоковое состояние, направляя энергию в дизайн",
  },
  {
    step: "03",
    title: "Послойное нанесение",
    desc: "УФ-реактивные пигменты наносятся в несколько слоёв кистевыми техниками",
  },
  {
    step: "04",
    title: "Проверка под UV",
    desc: "Под ультрафиолетом скрытые узоры проявляются и дорабатываются",
  },
];

const Experience = () => {
  const { isUVMode } = useTheme();

  // Фото студии из единого источника данных
  const studioImages = [
    ...artistPhotos.slice(1, 3),
    ...paintings.slice(1, 4).map((p) => p.imgAlt || p.img),
  ].slice(0, 6);

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Опыт владения"
        description="Материалы, UV-технология и ритуал создания хаори HAORI VISION."
      />
      <div className="max-w-6xl mx-auto">
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
            Опыт владения
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Что значит носить хаори — материалы, технология, ритуал создания
          </p>
        </motion.div>

        {/* Materials & Techniques — core unique content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900 rounded-lg p-8 md:p-12 mb-24"
        >
          <h2 className="text-3xl font-display font-bold mb-8 text-center text-white">
            Материалы и Техники
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3
                className={`text-xl font-semibold mb-4 ${
                  isUVMode ? "text-uv-cyan" : "text-white"
                }`}
              >
                Премиум Ткани
              </h3>
              <ul className="space-y-3 text-zinc-400">
                <li>100% японский шёлк Хабутай (12 момме)</li>
                <li>Премиум шерстяной креп (зимний вес)</li>
                <li>Шёлк дюпион с натуральной текстурой</li>
                <li>Органический хлопок и шёлковая подкладка</li>
              </ul>
            </div>

            <div>
              <h3
                className={`text-xl font-semibold mb-4 ${
                  isUVMode ? "text-uv-cyan" : "text-white"
                }`}
              >
                Световая Технология
              </h3>
              <ul className="space-y-3 text-zinc-400">
                <li>УФ-реактивные флуоресцентные пигменты</li>
                <li>Фосфоресцентные соединения (свечение в темноте)</li>
                <li>Техника многослойного нанесения</li>
                <li>Традиционная японская кистевая роспись</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <p className="text-center text-zinc-400">
              Каждая работа требует{" "}
              <span
                className={
                  isUVMode
                    ? "text-uv-pink font-semibold"
                    : "text-white font-semibold"
                }
              >
                16-24 часов
              </span>{" "}
              целенаправленного художественного труда
            </p>
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="mb-24">
          <h2 className="text-3xl font-display font-bold mb-12 text-center text-white">
            Ритуал Создания
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-uv text-center"
              >
                <div
                  className={`text-5xl font-display font-bold mb-4 ${
                    isUVMode ? "gradient-text" : "text-zinc-600"
                  }`}
                >
                  {item.step}
                </div>
                <h3
                  className={`text-xl font-semibold mb-3 ${
                    isUVMode ? "text-uv-pink" : "text-white"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Studio Gallery */}
        <div className="mb-24">
          <h2 className="text-3xl font-display font-bold mb-12 text-center text-white">
            Внутри Студии
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioImages.map((src, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -10 }}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer"
              >
                <img
                  src={src}
                  alt="Мастерская художника LiZa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2
            className={`text-3xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text" : "text-white"
            }`}
          >
            Стань владельцем произведения светового искусства
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-12 py-5 text-lg font-semibold transition-all ${
                  isUVMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white text-black"
                }`}
              >
                Смотреть коллекции
              </motion.button>
            </Link>
            <Link to="/bespoke">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-12 py-5 text-lg font-semibold border-2 transition-all ${
                  isUVMode
                    ? "border-uv-pink text-uv-pink hover:bg-uv-pink/10"
                    : "border-zinc-600 text-white hover:border-white"
                }`}
              >
                Заказать bespoke
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Experience;
