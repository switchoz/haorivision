import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import { tid } from "../shared/testid";

const prefetchMap = {
  "/shop": () => import("../pages/Shop"),
  "/collections": () => import("../pages/Collections"),
  "/about": () => import("../pages/About"),
  "/experience": () => import("../pages/Experience"),
  "/journal": () => import("../pages/Blog"),
  "/contact": () => import("../pages/Contact"),
};
const prefetched = new Set();
const prefetchRoute = (path) => {
  if (prefetched.has(path) || !prefetchMap[path]) return;
  prefetched.add(path);
  prefetchMap[path]();
};

const Navigation = () => {
  const location = useLocation();
  const { isUVMode, toggleUVMode, uvIntensity, setUvIntensity } = useTheme();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { path: "/shop", label: "Магазин", testid: "nav-shop" },
    { path: "/collections", label: "Коллекции" },
    { path: "/about", label: "Художник" },
    { path: "/experience", label: "Опыт" },
    { path: "/journal", label: "Журнал" },
    { path: "/contact", label: "Контакты" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      aria-label="Главная навигация"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-700 ${
        isUVMode
          ? "bg-black/90 border-b border-purple-500/20"
          : "bg-black/90 border-b border-zinc-800/60"
      }`}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span
              className={`text-[13px] font-bold tracking-[0.25em] transition-all duration-500 ${
                isUVMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                  : "text-white"
              }`}
            >
              HAORI VISION
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-4 py-2 group"
                onMouseEnter={() => prefetchRoute(link.path)}
                {...(link.testid ? tid(link.testid) : {})}
              >
                <span
                  className={`text-[13px] tracking-[0.12em] transition-colors duration-300 ${
                    isActive(link.path)
                      ? isUVMode
                        ? "text-purple-300 font-medium"
                        : "text-white font-medium"
                      : "text-zinc-500 group-hover:text-zinc-200"
                  }`}
                >
                  {link.label}
                </span>
                {isActive(link.path) && (
                  <motion.div
                    layoutId="nav-active"
                    className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${
                      isUVMode
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-white"
                    }`}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* UV Toggle */}
            <button
              onClick={toggleUVMode}
              aria-label="Переключить UV режим"
              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-500 ${
                isUVMode
                  ? "bg-purple-900/40 border border-purple-500/30"
                  : "bg-zinc-900/60 border border-zinc-700/50"
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-[0.15em] transition-colors duration-500 ${
                  isUVMode ? "text-purple-300" : "text-zinc-500"
                }`}
              >
                UV
              </span>
              <div
                className={`relative w-9 h-5 rounded-full transition-all duration-500 ${
                  isUVMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                    : "bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-400 ${
                    isUVMode
                      ? "left-[18px] shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "left-[2px]"
                  }`}
                />
              </div>
            </button>

            {/* UV Intensity Slider */}
            {isUVMode && (
              <input
                type="range"
                min={20}
                max={100}
                step={10}
                value={uvIntensity}
                onChange={(e) => setUvIntensity(Number(e.target.value))}
                aria-label="UV интенсивность"
                className="w-20 h-1 appearance-none rounded-full bg-purple-900/60 accent-purple-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(168,85,247,0.6)] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(168,85,247,0.6)]"
              />
            )}

            {/* Account */}
            <Link
              to="/account"
              className={`p-2 rounded-lg transition-colors ${
                isUVMode
                  ? "text-zinc-400 hover:text-purple-300 hover:bg-purple-900/20"
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
              }`}
              aria-label="Личный кабинет"
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2 rounded-lg transition-colors ${
                isUVMode
                  ? "text-zinc-400 hover:text-purple-300 hover:bg-purple-900/20"
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
              }`}
              aria-label="Корзина"
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {totalItems > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                    isUVMode
                      ? "bg-purple-500 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Меню навигации"
              className="md:hidden p-2.5 text-zinc-400 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden border-t ${
            isUVMode
              ? "bg-black/95 border-purple-500/20"
              : "bg-black/95 border-zinc-800/60"
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                {...(link.testid ? tid(link.testid) : {})}
                className={`block px-3 py-2.5 rounded-lg text-[13px] tracking-wide transition-colors ${
                  isActive(link.path)
                    ? isUVMode
                      ? "text-purple-300 bg-purple-900/20 font-medium"
                      : "text-white bg-zinc-800/50 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-zinc-800/60">
              <Link
                to="/account"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] tracking-wide transition-colors ${
                  isActive("/account")
                    ? isUVMode
                      ? "text-purple-300 bg-purple-900/20"
                      : "text-white bg-zinc-800/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Личный кабинет
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navigation;
