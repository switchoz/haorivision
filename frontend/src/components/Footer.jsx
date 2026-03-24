import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const Footer = () => {
  const { isUVMode } = useTheme();

  return (
    <footer className="bg-black border-t border-zinc-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3
              className={`text-xl font-display font-bold mb-4 ${
                isUVMode ? "gradient-text text-glow" : "text-white"
              }`}
            >
              HAORI VISION
            </h3>
            <p className="text-zinc-400 text-sm mb-2">
              Носи свет. Стань искусством.
            </p>
            <p className="text-zinc-500 text-xs mb-1">
              Художник: Елизавета Федькина (LiZa)
            </p>
            <p className="text-zinc-500 text-xs">Светящееся искусство с 2025</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              {["Коллекции", "Опыт", "Магазин", "О нас", "Контакты"].map(
                (link, i) => {
                  const paths = [
                    "collections",
                    "experience",
                    "shop",
                    "about",
                    "contact",
                  ];
                  return (
                    <li key={i}>
                      <a
                        href={`/${paths[i]}`}
                        className="text-zinc-400 text-sm hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  );
                },
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Связь</h4>
            <div className="flex space-x-4 mb-4">
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isUVMode
                    ? "bg-uv-pink/20 text-uv-pink"
                    : "bg-zinc-800 text-white"
                } transition-colors`}
              >
                <span className="text-sm">IG</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isUVMode
                    ? "bg-uv-cyan/20 text-uv-cyan"
                    : "bg-zinc-800 text-white"
                } transition-colors`}
              >
                <span className="text-sm">TW</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isUVMode
                    ? "bg-uv-purple/20 text-uv-purple"
                    : "bg-zinc-800 text-white"
                } transition-colors`}
              >
                <span className="text-sm">OS</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="https://t.me/haori_vision_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isUVMode
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-zinc-800 text-white"
                } transition-colors`}
              >
                <span className="text-sm">TG</span>
              </motion.a>
            </div>
            <p className="text-zinc-500 text-xs">Telegram-канал</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800">
          <p className="text-center text-zinc-500 text-sm">
            © 2025 HAORI VISION. Все права защищены. Каждая работа — уникальное
            произведение искусства.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
