import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const Footer = () => {
  const { isUVMode } = useTheme();
  const [nlEmail, setNlEmail] = useState("");
  const [nlLoading, setNlLoading] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter",
          email: nlEmail,
          subject: "Подписка на рассылку",
          message: "Хочу получать новости HAORI VISION",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Вы подписаны на новости HAORI VISION");
      setNlEmail("");
    } catch {
      toast.error("Ошибка. Попробуйте позже.");
    } finally {
      setNlLoading(false);
    }
  };

  const navLinks = [
    { label: "Магазин", path: "/shop" },
    { label: "Коллекции", path: "/collections" },
    { label: "Bespoke", path: "/bespoke" },
    { label: "Художник", path: "/about" },
    { label: "Журнал", path: "/journal" },
    { label: "Контакты", path: "/contact" },
    { label: "Отзывы", path: "/reviews" },
    { label: "FAQ", path: "/faq" },
    { label: "Опыт", path: "/experience" },
    { label: "События", path: "/events" },
    { label: "Размеры", path: "/size-guide" },
    { label: "Уход", path: "/care" },
  ];

  const socialLinks = [
    {
      label: "IG",
      href: "https://instagram.com/DIKO.RATIVNO",
      color: isUVMode
        ? "bg-pink-500/20 text-pink-400"
        : "bg-zinc-800 text-white",
    },
    {
      label: "TG",
      href: "https://t.me/haori_vision_bot",
      color: isUVMode
        ? "bg-blue-500/20 text-blue-400"
        : "bg-zinc-800 text-white",
    },
  ];

  return (
    <footer
      aria-label="Подвал сайта"
      className={`border-t py-12 transition-all duration-700 ${
        isUVMode
          ? "bg-[#05001a] border-purple-900/30"
          : "bg-black border-zinc-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/">
              <h3
                className={`text-xl font-bold mb-4 ${
                  isUVMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                    : "text-white"
                }`}
              >
                HAORI VISION
              </h3>
            </Link>
            <p className="text-zinc-400 text-sm mb-2">
              Носимое световое искусство
            </p>
            <p className="text-zinc-500 text-xs mb-1">
              Художник: Елизавета Федькина (LiZa)
            </p>
            <p className="text-zinc-500 text-xs">
              <a
                href="https://instagram.com/DIKO.RATIVNO"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                @DIKO.RATIVNO
              </a>{" "}
              &middot; Москва
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${
                      isUVMode
                        ? "text-zinc-400 hover:text-purple-300"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Связь</h4>
            <div className="flex space-x-3 mb-4">
              {socialLinks.map((s) => (
                <motion.a
                  key={s.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${s.color}`}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                </motion.a>
              ))}
            </div>
            <p className="text-zinc-500 text-xs mb-2">
              Bespoke заказы от &euro;3,000
            </p>
            <Link
              to="/contact"
              className={`text-sm transition-colors ${
                isUVMode
                  ? "text-purple-400 hover:text-purple-300"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Написать нам &rarr;
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div
          className={`mt-8 pt-8 border-t ${isUVMode ? "border-purple-900/20" : "border-zinc-800"}`}
        >
          <form
            onSubmit={handleNewsletter}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <span
              className={`text-sm whitespace-nowrap ${isUVMode ? "text-purple-300" : "text-zinc-400"}`}
            >
              Подпишитесь на новости
            </span>
            <input
              type="email"
              required
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              placeholder="your@email.com"
              className={`w-full sm:w-64 px-4 py-2 text-sm rounded-none outline-none transition-colors ${
                isUVMode
                  ? "bg-zinc-900 text-white border border-purple-500/30 focus:border-purple-500/60 placeholder-zinc-600"
                  : "bg-zinc-900 text-white border border-zinc-700 focus:border-zinc-500 placeholder-zinc-600"
              }`}
            />
            <button
              type="submit"
              disabled={nlLoading}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                isUVMode
                  ? "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  : "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
              }`}
            >
              {nlLoading ? "..." : "Подписаться"}
            </button>
          </form>
        </div>

        <div
          className={`pt-4 border-t ${isUVMode ? "border-purple-900/20" : "border-zinc-800"}`}
        >
          <p className="text-center text-zinc-500 text-sm">
            &copy; 2025–{new Date().getFullYear()} HAORI VISION. Каждая работа —
            уникальное произведение искусства.
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link
              to="/privacy"
              className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link
              to="/terms"
              className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
            >
              Условия
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
