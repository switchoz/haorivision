import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import galleryData from "../../data/gallery-products.json";

/**
 * 🖼️ GALLERY PRODUCTS COMPONENT
 *
 * Отображает реальные продукты из галереи с фильтрацией по категориям
 * Использует оптимизированные изображения (WebP + резервный JPG)
 */
export default function GalleryProducts() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // Фильтрация продуктов
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return galleryData.products;
    }
    return galleryData.products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Категории с количеством
  const categories = [
    { id: "all", name: "Всё", count: galleryData.metadata.totalProducts },
    ...Object.entries(galleryData.categories).map(([id, cat]) => ({
      id,
      name: cat.name,
      count: cat.count,
    })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white py-20 px-4">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-12 text-center"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          HAORI VISION GALLERY
        </h1>
        <p className="text-gray-400 text-lg">
          Коллекция уникальных вещей ручной работы
        </p>
      </motion.div>

      {/* Фильтр категорий */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-7xl mx-auto mb-12"
      >
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {cat.name}{" "}
              <span className="ml-2 text-sm opacity-70">({cat.count})</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Сетка продуктов */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setHoveredProduct(product.id)}
                onHoverEnd={() => setHoveredProduct(null)}
                className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/30"
              >
                {/* Изображение с поддержкой WebP */}
                <div className="aspect-square overflow-hidden">
                  <picture>
                    <source
                      srcSet={product.images.mediumWebp}
                      type="image/webp"
                    />
                    <motion.img
                      src={product.images.medium}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </picture>
                </div>

                {/* Информация о продукте */}
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                      {galleryData.categories[product.category]?.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {product.description.short}
                  </p>

                  {/* Цена и статус */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">
                      ${product.price}
                    </div>
                    {product.stock.unique && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full font-medium">
                        1/1 UNIQUE
                      </span>
                    )}
                  </div>

                  {/* Теги */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overlay с дополнительной информацией */}
                <AnimatePresence>
                  {hoveredProduct === product.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                      <p className="text-sm text-gray-300 mb-4">
                        {product.tagline}
                      </p>
                      <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                        Подробнее
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Пустое состояние */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-400 text-xl">
              В этой категории пока нет продуктов
            </p>
          </motion.div>
        )}
      </div>

      {/* Статистика внизу */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-20 text-center"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text mb-2">
              {galleryData.metadata.totalProducts}
            </div>
            <div className="text-gray-400">Уникальных вещей</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text mb-2">
              {galleryData.metadata.totalCategories}
            </div>
            <div className="text-gray-400">Категорий</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text mb-2">
              100%
            </div>
            <div className="text-gray-400">Ручная работа</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
