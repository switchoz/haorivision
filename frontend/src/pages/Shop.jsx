import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useState } from "react";

const Shop = () => {
  const { isUVMode } = useTheme();
  const [filter, setFilter] = useState("all");

  const products = [
    {
      id: 1,
      collection: "Mycelium Dreams",
      type: "bundle",
      name: "Mycelium Dreams Complete Set",
      edition: "3 of 8",
      price: 5400,
      status: "available",
      image: "mycelium",
    },
    {
      id: 2,
      collection: "Void Bloom",
      type: "haori",
      name: "Void Bloom Haori",
      edition: "1 of 5",
      price: 4500,
      status: "upcoming",
      image: "void",
    },
    {
      id: 3,
      collection: "Neon Ancestors",
      type: "bundle",
      name: "Neon Ancestors Complete Set",
      edition: "5 of 12",
      price: 6200,
      status: "concept",
      image: "neon",
    },
    {
      id: 4,
      collection: "Mycelium Dreams",
      type: "canvas",
      name: "Mycelium Dreams Canvas",
      edition: "2 of 8",
      price: 2200,
      status: "available",
      image: "mycelium",
    },
  ];

  const filteredProducts =
    filter === "all" ? products : products.filter((p) => p.type === filter);

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-7xl mx-auto">
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
            Магазин
          </h1>
          <p className="text-xl text-zinc-400">
            Каждая работа — уникальный артефакт света
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {["all", "bundle", "haori", "canvas"].map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(type)}
              className={`px-6 py-3 rounded-full font-semibold capitalize transition-all ${
                filter === type
                  ? isUVMode
                    ? "bg-uv-pink text-white"
                    : "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {type === "all"
                ? "Все Товары"
                : type === "bundle"
                  ? "Полные Наборы"
                  : type === "haori"
                    ? "Хаори"
                    : "Холсты"}
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              data-testid="product-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="card-uv cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-4 bg-zinc-800">
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    isUVMode
                      ? "bg-gradient-to-br from-uv-pink/20 to-uv-cyan/20"
                      : ""
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-4xl mb-2 ${
                        product.image === "mycelium"
                          ? "🌿"
                          : product.image === "void"
                            ? "🌌"
                            : "⚡"
                      }`}
                    />
                    <span className="text-zinc-600 text-sm">
                      {product.collection}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === "available"
                        ? "bg-green-500/20 text-green-400"
                        : product.status === "upcoming"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">
                      {product.collection}
                    </p>
                    <h3
                      className={`text-lg font-semibold ${
                        isUVMode ? "text-white" : "text-white"
                      }`}
                    >
                      {product.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        isUVMode ? "text-uv-cyan" : "text-white"
                      }`}
                    >
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm mb-4">
                  Издание {product.edition}
                </p>

                <motion.button
                  data-testid="add-to-cart"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={product.status !== "available"}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    product.status === "available"
                      ? "btn-gradient text-white"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {product.status === "available"
                    ? "В Корзину"
                    : product.status === "upcoming"
                      ? "Уведомить Меня"
                      : "Скоро"}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Orders */}
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
            Интересуетесь Индивидуальной Работой?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Закажите уникальное творение HAORI VISION, разработанное специально
            для вас. Художник Елизавета Федькина (LiZa) создаст работу в
            потоковом состоянии — из вашей энергии, цвета и формы.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-12 py-5 rounded-full font-semibold border-2 ${
              isUVMode
                ? "border-uv-pink text-uv-pink hover:bg-uv-pink/10"
                : "border-white text-white hover:bg-white/10"
            } transition-colors`}
          >
            Запросить Индивидуальный Заказ
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Shop;
