import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import productsData from "../data/gallery-products.json";
import toast from "react-hot-toast";

const CATEGORIES = [
  { key: "all", label: "Все товары" },
  { key: "haori", label: "Хаори", match: "real-haori" },
  { key: "jackets", label: "Куртки", match: "real-jackets" },
  { key: "jeans", label: "Джинсы", match: "real-jeans" },
  { key: "robes", label: "Халаты", match: "real-robes" },
  { key: "hoodies", label: "Худи", match: "real-hoodies" },
  { key: "sneakers", label: "Кроссовки", match: "real-sneakers" },
  { key: "scarves", label: "Шарфы", match: "real-scarves" },
  { key: "bags", label: "Сумки", match: "real-bags" },
  { key: "caps", label: "Кепки", match: "real-caps" },
  { key: "belts", label: "Ремни", match: "real-belts" },
];

const SORT_OPTIONS = [
  { key: "default", label: "По умолчанию" },
  { key: "price-asc", label: "Цена: по возрастанию" },
  { key: "price-desc", label: "Цена: по убыванию" },
  { key: "name", label: "По названию" },
];

const Shop = () => {
  const { isUVMode } = useTheme();
  const { addItem } = useCart();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");

  const products = productsData.products;

  const filtered = useMemo(() => {
    let result = products;

    // Category filter
    if (category !== "all") {
      const cat = CATEGORIES.find((c) => c.key === category);
      if (cat?.match) {
        result = result.filter((p) => p.id.startsWith(cat.match));
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          (p.tagline && p.tagline.toLowerCase().includes(q)),
      );
    }

    // Sort
    switch (sort) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, "ru"));
        break;
      default:
        break;
    }

    return result;
  }, [products, category, sort, search]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency || "USD",
      image: product.images?.daylight?.hero,
      collection: product.collection,
      editions: product.editions,
    });
    toast.success(`${product.name} добавлено в корзину`);
  };

  const categoryCount = (key) => {
    if (key === "all") return products.length;
    const cat = CATEGORIES.find((c) => c.key === key);
    return cat?.match
      ? products.filter((p) => p.id.startsWith(cat.match)).length
      : 0;
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className={`text-5xl md:text-7xl font-display font-bold mb-4 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Магазин
          </h1>
          <p className="text-xl text-zinc-400">
            Каждая работа — уникальный артефакт света. Ручная роспись
            UV-красками.
          </p>
        </motion.div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full px-5 py-3 bg-zinc-900 border border-zinc-700 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat.key
                  ? isUVMode
                    ? "bg-uv-pink text-white"
                    : "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {cat.label}
              <span className="ml-1 text-xs opacity-60">
                ({categoryCount(cat.key)})
              </span>
            </motion.button>
          ))}
        </div>

        {/* Sort + Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-zinc-500 text-sm">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "товар"
              : filtered.length < 5
                ? "товара"
                : "товаров"}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-zinc-500 text-lg">Ничего не найдено</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-4 text-purple-400 hover:text-purple-300 underline"
              >
                Сбросить фильтры
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  data-testid="product-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link to={`/product/${product.id}`} className="block group">
                    <div className="card-uv overflow-hidden">
                      {/* Product Image */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
                        <img
                          src={product.images?.daylight?.hero}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 0 }}
                            className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 px-4 py-2 rounded-full"
                          >
                            Подробнее
                          </motion.span>
                        </div>

                        {/* Edition badge */}
                        {product.editions?.total === 1 && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-purple-600/90 text-white px-2 py-1 rounded text-xs font-semibold">
                              Единственный экземпляр
                            </span>
                          </div>
                        )}

                        {/* Status badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              product.status === "available"
                                ? "bg-green-500/20 text-green-400"
                                : product.status === "sold-out"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {product.status === "available"
                              ? "В наличии"
                              : product.status === "sold-out"
                                ? "Продано"
                                : "Скоро"}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <p className="text-zinc-500 text-xs mb-1 truncate">
                          {product.collection}
                        </p>
                        <h3 className="text-white font-semibold text-sm mb-2 truncate">
                          {product.name}
                        </h3>
                        {product.tagline && (
                          <p className="text-zinc-400 text-xs mb-3 line-clamp-1">
                            {product.tagline}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-lg font-bold ${
                              isUVMode ? "text-uv-cyan" : "text-white"
                            }`}
                          >
                            ${product.price.toLocaleString()}
                          </p>
                          <motion.button
                            data-testid="add-to-cart"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.status !== "available"}
                            className={`p-2 rounded-full transition-all ${
                              product.status === "available"
                                ? isUVMode
                                  ? "bg-uv-pink/20 text-uv-pink hover:bg-uv-pink/40"
                                  : "bg-zinc-700 text-white hover:bg-zinc-600"
                                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            }`}
                            title="В корзину"
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
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                              />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Bespoke CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2
            className={`text-3xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text" : "text-white"
            }`}
          >
            Интересуетесь индивидуальной работой?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Закажите уникальное творение HAORI VISION, разработанное специально
            для вас. Художник Елизавета Федькина (LiZa) создаст работу в
            потоковом состоянии — из вашей энергии, цвета и формы.
          </p>
          <Link to="/bespoke">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-12 py-5 rounded-full font-semibold border-2 ${
                isUVMode
                  ? "border-uv-pink text-uv-pink hover:bg-uv-pink/10"
                  : "border-white text-white hover:bg-white/10"
              } transition-colors`}
            >
              Запросить индивидуальный заказ
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Shop;
