import PageMeta from "../components/PageMeta";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const SizeGuide = () => {
  const { isUVMode } = useTheme();

  const sizes = [
    {
      size: "XS",
      chest: "86\u201390",
      waist: "\u2014",
      hips: "\u2014",
      length: "75",
    },
    {
      size: "S",
      chest: "90\u201396",
      waist: "\u2014",
      hips: "\u2014",
      length: "78",
    },
    {
      size: "M",
      chest: "96\u2013102",
      waist: "\u2014",
      hips: "\u2014",
      length: "80",
    },
    {
      size: "L",
      chest: "102\u2013108",
      waist: "\u2014",
      hips: "\u2014",
      length: "82",
    },
    {
      size: "XL",
      chest: "108\u2013114",
      waist: "\u2014",
      hips: "\u2014",
      length: "84",
    },
  ];

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Таблица размеров"
        description="Таблица размеров хаори HAORI VISION. Размеры XS\u2013XL, свободный крой."
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
            Таблица размеров
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Подберите идеальный размер вашего хаори
          </p>
        </motion.div>

        {/* Size Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`border rounded-lg overflow-hidden ${
            isUVMode
              ? "border-purple-900/30 bg-zinc-900/50"
              : "border-zinc-800 bg-zinc-900/30"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b ${
                    isUVMode
                      ? "border-purple-900/30 bg-purple-900/20"
                      : "border-zinc-800 bg-zinc-800/50"
                  }`}
                >
                  {[
                    "Размер",
                    "Грудь (см)",
                    "Талия (см)",
                    "Бёдра (см)",
                    "Длина (см)",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-4 text-sm font-semibold ${
                        isUVMode ? "text-purple-300" : "text-white"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((row, index) => (
                  <tr
                    key={row.size}
                    className={`border-b last:border-b-0 transition-colors ${
                      isUVMode
                        ? "border-purple-900/20 hover:bg-purple-900/10"
                        : "border-zinc-800 hover:bg-zinc-800/30"
                    }`}
                  >
                    <td
                      className={`px-6 py-4 font-semibold ${
                        isUVMode ? "text-purple-200" : "text-white"
                      }`}
                    >
                      {row.size}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{row.chest}</td>
                    <td className="px-6 py-4 text-zinc-400">{row.waist}</td>
                    <td className="px-6 py-4 text-zinc-400">{row.hips}</td>
                    <td className="px-6 py-4 text-zinc-400">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-8 border rounded-lg p-6 md:p-8 ${
            isUVMode
              ? "border-purple-900/30 bg-zinc-900/50"
              : "border-zinc-800 bg-zinc-900/30"
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-3 ${
              isUVMode ? "text-purple-300" : "text-white"
            }`}
          >
            Обратите внимание
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Хаори имеет свободный крой. Размеры указаны приблизительно. Если вы
            сомневаетесь между двумя размерами, рекомендуем выбрать больший для
            более расслабленной посадки или меньший для более облегающего
            силуэта.
          </p>
        </motion.div>

        {/* How to measure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-6 border rounded-lg p-6 md:p-8 ${
            isUVMode
              ? "border-purple-900/30 bg-zinc-900/50"
              : "border-zinc-800 bg-zinc-900/30"
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-3 ${
              isUVMode ? "text-purple-300" : "text-white"
            }`}
          >
            Как измерить
          </h2>
          <ul className="text-zinc-400 space-y-2 leading-relaxed">
            <li>
              <span className="text-white font-medium">Грудь:</span> измерьте
              обхват груди по самой выступающей точке
            </li>
            <li>
              <span className="text-white font-medium">Длина:</span> измерьте от
              верхней точки плеча до низа изделия
            </li>
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">
            Нужна помощь с подбором размера? Мы всегда готовы помочь.
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

export default SizeGuide;
