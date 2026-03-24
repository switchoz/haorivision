import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { tid } from "../../shared/testid";
import ARButton from "../ARButton";

const ProductCard = ({ product }) => {
  const { isUVMode } = useTheme();
  const [imageMode, setImageMode] = useState("daylight");
  const [isHovered, setIsHovered] = useState(false);

  const currentImage =
    imageMode === "uv" ? product.images.uv.hero : product.images.daylight.hero;

  const isLimited = product.editions.remaining <= 2;
  const isSoldOut =
    product.status === "sold-out" || product.editions.remaining === 0;

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        {...tid("product-card")}
        className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition-all duration-500"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -8 }}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-black">
          {/* Main Image */}
          <motion.img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* UV/Daylight Toggle Overlay */}
          <motion.div
            className="absolute top-4 right-4 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex gap-2 bg-black/80 backdrop-blur-sm p-2 border border-zinc-700">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImageMode("daylight");
                }}
                className={`px-3 py-1 text-xs uppercase tracking-wider transition-all ${
                  imageMode === "daylight"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Дневной
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImageMode("uv");
                }}
                className={`px-3 py-1 text-xs uppercase tracking-wider transition-all ${
                  imageMode === "uv"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-purple-400"
                }`}
              >
                UV
              </button>
            </div>
          </motion.div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {product.featured && (
              <div className="bg-purple-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-bold">
                Избранное
              </div>
            )}
            {isLimited && !isSoldOut && (
              <motion.div
                className="bg-orange-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-bold"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Осталось {product.editions.remaining}
              </motion.div>
            )}
            {isSoldOut && (
              <div className="bg-red-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-bold">
                Продано
              </div>
            )}
          </div>

          {/* UV Glow Effect on Hover */}
          {isUVMode && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: isHovered
                  ? [
                      "radial-gradient(circle at 50% 50%, rgba(176, 38, 255, 0.3) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 50%, rgba(255, 16, 240, 0.3) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 50%, rgba(176, 38, 255, 0.3) 0%, transparent 70%)",
                    ]
                  : "radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%)",
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Quick View Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isHovered ? 1 : 0.8,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-white text-sm uppercase tracking-[0.3em] mb-2">
                Подробнее
              </p>
              <div className="w-12 h-12 mx-auto border-2 border-white rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.div>

            {/* AR Button on Hover */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{
                scale: isHovered ? 1 : 0.8,
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
              onClick={(e) => e.preventDefault()}
              className="w-full max-w-xs"
            >
              <ARButton
                productId={product.id}
                className="w-full text-sm py-3"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          {/* Collection Tag */}
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">
            {product.collection}
          </p>

          {/* Product Name */}
          <h3
            className={`text-2xl font-bold mb-2 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            {product.name}
          </h3>

          {/* Tagline */}
          <p className="text-sm text-zinc-400 mb-4 italic">{product.tagline}</p>

          {/* Short Description */}
          <p className="text-sm text-zinc-300 mb-6 line-clamp-2">
            {product.description.short}
          </p>

          {/* UV Colors Preview */}
          {product.uvColors && product.uvColors.length > 0 && (
            <div className="flex gap-2 mb-6">
              {product.uvColors.slice(0, 4).map((color, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-zinc-700"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.3 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
              {product.uvColors.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                  +{product.uvColors.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Price & Editions */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-white">
                ${product.price.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                USD
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">
                Издание{" "}
                {product.editions.total - product.editions.remaining + 1}/
                {product.editions.total}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {product.editions.remaining} доступно
              </p>
            </div>
          </div>

          {/* Features Icons */}
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <div
              className="flex items-center gap-1 text-xs text-zinc-500"
              title="Подпись художника"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Подпись LiZa</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs text-zinc-500"
              title="UV лампа в комплекте"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>UV лампа</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs text-zinc-500"
              title="Двойное произведение"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>+ Холст</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs text-zinc-500"
              title="Доставка по всему миру"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Глобально</span>
            </div>
          </div>
        </div>

        {/* Hover Glow Border Effect */}
        {isUVMode && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: isHovered
                ? [
                    "0 0 0px rgba(176, 38, 255, 0)",
                    "0 0 30px rgba(176, 38, 255, 0.6), 0 0 60px rgba(255, 16, 240, 0.3)",
                    "0 0 0px rgba(176, 38, 255, 0)",
                  ]
                : "0 0 0px rgba(176, 38, 255, 0)",
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export default ProductCard;
