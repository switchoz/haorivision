import PageMeta from "../components/PageMeta";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const Care = () => {
  const { isUVMode } = useTheme();

  const instructions = [
    {
      icon: "\u{1F9F4}",
      title: "Ручная стирка при 30\u00B0C",
      description:
        "Стирайте изделие вручную в прохладной воде (не выше 30\u00B0C) с мягким моющим средством. Не замачивайте надолго. Аккуратно отожмите, не выкручивая.",
    },
    {
      icon: "\u26D4",
      title: "Не отбеливать",
      description:
        "Категорически запрещается использовать отбеливатели и средства, содержащие хлор. Они повредят UV-пигменты и ткань.",
    },
    {
      icon: "\u{1F32C}\uFE0F",
      title: "Не сушить в машине",
      description:
        "Сушите изделие в расправленном виде на горизонтальной поверхности, вдали от прямых солнечных лучей и источников тепла. Не используйте сушильную машину.",
    },
    {
      icon: "\u{1F9F9}",
      title: "Гладить с изнанки",
      description:
        "Если необходимо, гладьте изделие только с изнаночной стороны на минимальной температуре. Не гладьте непосредственно по UV-рисунку.",
    },
    {
      icon: "\u{1F311}",
      title: "Хранить в тёмном месте",
      description:
        "UV-краски чувствительны к длительному солнечному воздействию. Храните изделие в тёмном прохладном месте, в оригинальной упаковке или тканевом чехле. Избегайте длительного нахождения под прямыми солнечными лучами.",
    },
    {
      icon: "\u2728",
      title: "UV-эффект: 5+ лет",
      description:
        "При правильном уходе UV-эффект сохраняет яркость более 5 лет. Профессиональные UV-реактивные пигменты, которые мы используем, устойчивы к стирке и выцветанию. Для максимального срока службы следуйте всем рекомендациям.",
    },
  ];

  const tips = [
    "Не используйте химчистку без предварительной консультации с нами",
    "Избегайте контакта с агрессивными химическими веществами (растворители, спирт)",
    "При появлении пятен \u2014 обработайте их точечно мягким средством",
    "Для транспортировки используйте оригинальную упаковку HAORI VISION",
    "UV-лампу используйте на расстоянии минимум 20 см от изделия",
  ];

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Уход за изделием"
        description="Инструкции по уходу за изделиями HAORI VISION. Как стирать, хранить и ухаживать за одеждой с UV-рисунками."
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className={`text-4xl md:text-6xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Уход за изделием
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Правильный уход сохранит яркость UV-эффекта на долгие годы
          </p>
        </motion.div>

        {/* Care Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {instructions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`border rounded-lg p-6 ${
                isUVMode
                  ? "border-purple-900/30 bg-zinc-900/50"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h2
                className={`text-lg font-semibold mb-2 ${
                  isUVMode ? "text-purple-300" : "text-white"
                }`}
              >
                {item.title}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`border rounded-lg p-6 md:p-8 ${
            isUVMode
              ? "border-purple-900/30 bg-zinc-900/50"
              : "border-zinc-800 bg-zinc-900/30"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isUVMode ? "text-purple-300" : "text-white"
            }`}
          >
            Дополнительные рекомендации
          </h2>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start text-zinc-400">
                <span
                  className={`mr-3 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isUVMode ? "bg-purple-400" : "bg-zinc-500"
                  }`}
                />
                <span className="text-sm leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">
            Есть вопросы по уходу за вашим изделием? Мы всегда поможем.
          </p>
          <Link
            to="/contact"
            className={`inline-block text-sm transition-colors ${
              isUVMode
                ? "text-purple-400 hover:text-purple-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Свяжитесь с нами &rarr;
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Care;
