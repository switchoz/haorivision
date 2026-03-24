import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const Experience = () => {
  const { isUVMode } = useTheme();

  return (
    <div className="min-h-screen py-24 px-4">
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
            Творческий Процесс
          </h1>
          <p className="text-xl text-zinc-400">
            Наблюдайте трансформацию от тьмы к свету
          </p>
        </motion.div>

        {/* Hero Image — UV Before/After */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="/artist/haori-presentation.jpg"
                alt="Хаори при дневном свете"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded text-sm text-zinc-300">
                Дневной свет
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="/artist/haori-dark-uv.jpg"
                alt="Хаори под UV-светом"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-purple-900/60 backdrop-blur-sm rounded text-sm text-purple-300">
                UV-свет
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2
              className={`text-3xl font-bold mb-4 ${
                isUVMode ? "text-cyan-400" : "text-white"
              }`}
            >
              От Холста к Хаори: Путешествие Света
            </h2>
            <p className="text-zinc-400 leading-relaxed max-w-3xl mx-auto">
              Каждая работа HAORI VISION рождается в мастерской художника, где
              интуитивная живопись встречается с UV-технологией. Флуоресцентные
              пигменты наносятся вручную, создавая узоры, скрытые при дневном
              свете, но раскрывающиеся под ультрафиолетом.
            </p>
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="mb-24">
          <h2 className="text-3xl font-display font-bold mb-12 text-center text-white">
            Ритуал Создания
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Выбор",
                desc: "Премиум японский шёлк или шерсть отбираются вручную по текстуре и весу",
              },
              {
                step: "02",
                title: "Медитация",
                desc: "Художник входит в медитативное состояние, направляя энергию в дизайн",
              },
              {
                step: "03",
                title: "Нанесение",
                desc: "УФ-реактивные пигменты наносятся традиционными кистевыми техниками",
              },
              {
                step: "04",
                title: "Откровение",
                desc: "Под УФ-светом скрытые узоры раскрываются и дорабатываются",
              },
            ].map((item, i) => (
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
            {[
              "/artist/page2_img1.jpeg",
              "/artist/page4_img1.jpeg",
              "/artist/page6_img1.jpeg",
              "/artist/page8_img2.jpeg",
              "/artist/page12_img2.jpeg",
              "/artist/page20_img1.jpeg",
            ].map((src, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -10 }}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer"
              >
                <img
                  src={src}
                  alt={`Мастерская ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Materials & Techniques */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900 rounded-lg p-12"
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
                <li>• 100% японский шёлк Хабутай (12 момме)</li>
                <li>• Премиум шерстяной креп (зимний вес)</li>
                <li>• Шёлк дюпион с натуральной текстурой</li>
                <li>• Органический хлопок и шёлковая подкладка</li>
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
                <li>• УФ-реактивные флуоресцентные пигменты</li>
                <li>• Фосфоресцентные соединения (светящиеся в темноте)</li>
                <li>• Техника многослойного нанесения</li>
                <li>• Традиционная японская кистевая роспись</li>
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-24"
        >
          <h2
            className={`text-3xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text" : "text-white"
            }`}
          >
            Стань владельцем произведения светового искусства
          </h2>
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
        </motion.div>
      </div>
    </div>
  );
};

export default Experience;
