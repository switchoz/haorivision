import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import { tid } from "../shared/testid";

const Navigation = () => {
  const location = useLocation();
  const { isUVMode, toggleUVMode } = useTheme();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { path: "/shop", label: "Магазин", testid: "nav-shop" },
    { path: "/collections", label: "Коллекции" },
    { path: "/gallery", label: "Галерея" },
    { path: "/presentation", label: "Художник" },
    { path: "/journal", label: "Журнал" },
    { path: "/about", label: "О нас" },
    { path: "/contact", label: "Контакты" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl font-display font-bold"
            >
              <span
                className={
                  isUVMode ? "text-glow-pink gradient-text" : "text-white"
                }
              >
                HAORI VISION
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative"
                {...(link.testid ? tid(link.testid) : {})}
              >
                <motion.span
                  whileHover={{ y: -2 }}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? isUVMode
                        ? "text-uv-pink text-glow-pink"
                        : "text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </motion.span>
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 ${
                      isUVMode ? "bg-uv-pink" : "bg-white"
                    }`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* UV Mode Toggle */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-bold tracking-[3px] transition-colors duration-500 ${
                  isUVMode ? "text-uv-pink" : "text-zinc-500"
                }`}
              >
                UV
              </span>
              <button
                onClick={toggleUVMode}
                className={`relative w-[52px] h-7 rounded-full transition-all duration-500 ${
                  isUVMode
                    ? "bg-gradient-to-r from-purple-700 to-pink-600 border border-pink-500/50 shadow-[0_0_30px_rgba(139,0,255,0.4)]"
                    : "bg-zinc-800/80 border border-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white transition-all duration-500 ${
                    isUVMode
                      ? "left-[27px] shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                      : "left-[3px]"
                  }`}
                />
              </button>
            </div>

            {/* Account */}
            <Link
              to="/account"
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Личный кабинет"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-zinc-400 hover:text-white transition-colors"
              aria-label="Корзина"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isUVMode ? "bg-uv-pink text-white" : "bg-white text-black"
                  }`}
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </motion.span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-black/95 border-t border-zinc-800"
        >
          <div className="px-4 py-4 space-y-3">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                {...(link.testid ? tid(link.testid) : {})}
                className={`block py-2 text-sm font-medium ${
                  location.pathname === link.path
                    ? isUVMode
                      ? "text-uv-pink"
                      : "text-white"
                    : "text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navigation;
