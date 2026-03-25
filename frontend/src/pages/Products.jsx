import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const Products = () => {
  const { isUVMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/api/products?limit=100`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filter === "all") return true;
      if (filter === "available") return product.status === "available";
      if (filter === "featured") return product.featured;
      return true;
    });
  }, [products, filter]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-6xl font-bold mb-4 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            Каталог произведений
          </h1>
          <p className="text-xl text-zinc-400">
            {filteredProducts.length} товаров доступно
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { value: "all", label: "Все" },
            { value: "featured", label: "Избранное" },
            { value: "available", label: "В наличии" },
          ].map((filterOption) => (
            <motion.button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 text-sm uppercase tracking-wider transition-all rounded-full ${
                filter === filterOption.value
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {filterOption.label}
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <motion.div
                  className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all overflow-hidden group"
                  whileHover={{ y: -8 }}
                >
                  {/* Image */}
                  <div className="aspect-[3/4] bg-black overflow-hidden relative">
                    <picture>
                      <source
                        srcSet={product.images?.daylight?.hero?.replace(
                          ".jpg",
                          ".webp",
                        )}
                        type="image/webp"
                      />
                      <img
                        src={product.images?.daylight?.hero}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </picture>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    {/* Collection */}
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      {product.productCollection}
                    </p>

                    {/* Name */}
                    <h3 className="text-2xl font-bold mb-2 text-white">
                      {product.name}
                    </h3>

                    {/* Tagline */}
                    <p className="text-sm text-zinc-400 mb-4 italic">
                      {product.tagline}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-zinc-300 mb-6 line-clamp-2">
                      {product.description?.short}
                    </p>

                    {/* UV Colors */}
                    {product.uvColors && product.uvColors.length > 0 && (
                      <div className="flex gap-2 mb-6">
                        {product.uvColors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-zinc-700"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Price & Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          ${product.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-500 uppercase">USD</p>
                      </div>
                      <div className="text-right">
                        {product.status === "sold-out" ||
                        product.editions?.remaining === 0 ? (
                          <span className="bg-red-600 text-white px-3 py-1 text-xs uppercase font-bold">
                            Продано
                          </span>
                        ) : product.editions?.remaining <= 2 ? (
                          <span className="bg-orange-600 text-white px-3 py-1 text-xs uppercase font-bold">
                            Осталось {product.editions.remaining}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-sm">
                            {product.editions?.remaining} доступно
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
