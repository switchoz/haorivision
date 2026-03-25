import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import ARPreview from "../components/premium/ARPreview";
import ProductCTA from "../components/ProductCTA";
import ARButton from "../components/ARButton";
import { trackCTAEvent } from "../ab/withCTAExperiment";

const API_URL = import.meta.env.VITE_API_URL || "";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isUVMode } = useTheme();
  const [product, setProduct] = useState(null);
  const [viewMode, setViewMode] = useState("daylight"); // daylight or uv
  const [selectedImage, setSelectedImage] = useState("hero");
  const [activeTab, setActiveTab] = useState("description"); // description, specifications, shipping
  const [expandedIncludedItem, setExpandedIncludedItem] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products/${productId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.product) {
          // Map API fields to component expectations
          const p = data.product;
          setProduct({
            ...p,
            collection: p.productCollection || p.collection,
            description: {
              short: p.description?.short,
              full: p.description?.long || p.description?.full,
              story: p.description?.story,
              ...p.description,
            },
          });
        }
      })
      .catch(() => {});
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Загрузка...</p>
      </div>
    );
  }

  const currentImages =
    viewMode === "uv" ? product.images.uv : product.images.daylight;
  const isLimited = product.editions.remaining <= 2;
  const isSoldOut =
    product.status === "sold-out" || product.editions.remaining === 0;

  const handleBuyNow = () => {
    // Track add to cart event for A/B test
    trackCTAEvent("add_to_cart", productId);

    // Navigate to checkout with product data
    navigate("/checkout", { state: { product } });
  };

  return (
    <div className={`min-h-screen ${isUVMode ? "bg-black" : "bg-zinc-950"}`}>
      {/* Breadcrumb */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <button
            onClick={() => navigate("/")}
            className="hover:text-white transition-colors"
          >
            Главная
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("/products")}
            className="hover:text-white transition-colors"
          >
            Каталог
          </button>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <motion.div
              key={selectedImage + viewMode}
              className="relative aspect-[3/4] bg-zinc-900 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={currentImages[selectedImage]}
                alt={`${product.name} - ${selectedImage}`}
                className="w-full h-full object-cover"
              />

              {/* UV/Daylight Toggle */}
              <div className="absolute top-6 right-6 z-10">
                <div className="flex gap-2 bg-black/80 backdrop-blur-sm p-2 border border-zinc-700">
                  <button
                    onClick={() => setViewMode("daylight")}
                    className={`px-6 py-3 text-sm uppercase tracking-wider font-bold transition-all ${
                      viewMode === "daylight"
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    ☀️ Дневной
                  </button>
                  <button
                    onClick={() => setViewMode("uv")}
                    className={`px-6 py-3 text-sm uppercase tracking-wider font-bold transition-all ${
                      viewMode === "uv"
                        ? "bg-purple-600 text-white"
                        : "text-zinc-400 hover:text-purple-400"
                    }`}
                  >
                    💡 UV свет
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-6 left-6 z-10">
                {isLimited && !isSoldOut && (
                  <motion.div
                    className="bg-orange-600 text-white px-4 py-2 text-sm uppercase tracking-wider font-bold"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Осталось {product.editions.remaining}
                  </motion.div>
                )}
                {isSoldOut && (
                  <div className="bg-red-600 text-white px-4 py-2 text-sm uppercase tracking-wider font-bold">
                    Продано
                  </div>
                )}
              </div>
            </motion.div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-6 gap-4">
              {Object.keys(currentImages)
                .filter((key) => key !== "transformation")
                .map((imageKey) => (
                  <button
                    key={imageKey}
                    onClick={() => setSelectedImage(imageKey)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${
                      selectedImage === imageKey
                        ? "border-purple-500"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <img
                      src={currentImages[imageKey]}
                      alt={imageKey}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
            </div>

            {/* AR Preview */}
            <ARPreview product={product} />
          </div>

          {/* Right: Product Info */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-2">
                {product.collection}
              </p>
              <h1
                className={`text-5xl font-black mb-4 ${
                  isUVMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                    : "text-white"
                }`}
              >
                {product.name}
              </h1>
              <p className="text-xl text-zinc-400 italic">{product.tagline}</p>
            </div>

            {/* Price & Edition */}
            <div className="flex items-end justify-between py-6 border-y border-zinc-800">
              <div>
                <p className="text-5xl font-bold text-white mb-2">
                  ${product.price.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-500 uppercase tracking-wider">
                  USD • Двойное произведение
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {product.editions.remaining}/{product.editions.total}
                </p>
                <p className="text-sm text-zinc-500 uppercase tracking-wider">
                  Доступно изданий
                </p>
              </div>
            </div>

            {/* UV Colors */}
            {product.uvColors && product.uvColors.length > 0 && (
              <div>
                <p className="text-sm text-zinc-500 mb-3 uppercase tracking-wider">
                  UV цветовая палитра
                </p>
                <div className="flex gap-3">
                  {product.uvColors.map((color, i) => (
                    <motion.div
                      key={i}
                      className="relative group"
                      whileHover={{ scale: 1.2 }}
                    >
                      <div
                        className="w-14 h-14 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: color }}
                      />
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white whitespace-nowrap bg-black px-2 py-1">
                          {color}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* What's Included - Interactive */}
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <p className="text-sm uppercase tracking-wider text-zinc-500 mb-4">
                Что входит в комплект
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: "👘",
                    text: "Расписанное вручную шёлковое хаори",
                    details:
                      "Премиальное японское шелковое хаори с уникальной росписью UV пигментами. Каждая работа создаётся вручную, что делает её полностью уникальной. Только химчистка.",
                  },
                  {
                    icon: "🖼️",
                    text: "Холст в раме",
                    details:
                      "Компаньон холст размером 40×60см в профессиональной раме. Та же композиция, та же техника, готов к подвешиванию. Создан для отображения дома когда хаори не носится.",
                  },
                  {
                    icon: "💡",
                    text: "Профессиональная UV лампа",
                    details:
                      "Портативная UV лампа 395nm с перезаряжаемой батареей. Специально подобрана для активации флуоресцентных пигментов. Срок службы батареи: 4-6 часов непрерывного использования.",
                  },
                  {
                    icon: "✍️",
                    text: "Подпись художника LiZa",
                    details:
                      "Каждая работа лично подписана художником Елизаветой Федькиной (LiZa) в домашней мастерской. Подпись подтверждает подлинность и уникальность произведения ручной работы.",
                  },
                  {
                    icon: "✍️",
                    text: "Подпись и нумерация художника",
                    details:
                      "Обе работы подписаны и пронумерованы художником вручную. Номер издания вышит на внутренней подкладке хаори и отпечатан на обратной стороне холста.",
                  },
                  {
                    icon: "📦",
                    text: "Роскошная двойная упаковка",
                    details:
                      "Индивидуальная упаковка премиум-класса для обеих работ. Хаори в шелковом мешке с деревянной коробкой. Холст в защитной упаковке с углами. Всё помещается в фирменный внешний ящик.",
                  },
                ].map((item, i) => {
                  const isExpanded = expandedIncludedItem === i;
                  return (
                    <motion.div
                      key={i}
                      className={`border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                        isUVMode
                          ? "border-purple-500/30 hover:border-purple-500/50"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() =>
                        setExpandedIncludedItem(isExpanded ? null : i)
                      }
                    >
                      <div
                        className={`flex items-center justify-between p-4 ${
                          isUVMode
                            ? "hover:bg-purple-500/5"
                            : "hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <p
                            className={`text-sm font-medium ${isExpanded ? "text-white" : "text-zinc-300"}`}
                          >
                            {item.text}
                          </p>
                        </div>
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-zinc-500"
                        >
                          ▼
                        </motion.span>
                      </div>

                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-4 pb-4 pt-2">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              {/* Primary CTA with A/B Test */}
              {isSoldOut ? (
                <motion.button
                  disabled
                  className="w-full py-5 text-lg font-bold uppercase tracking-wider bg-zinc-800 text-zinc-600 cursor-not-allowed"
                >
                  Продано
                </motion.button>
              ) : (
                <ProductCTA
                  productId={productId}
                  language="ru"
                  onClick={handleBuyNow}
                  disabled={isSoldOut}
                  isUVMode={isUVMode}
                />
              )}

              {/* AR Try-On Button */}
              <ARButton productId={productId} />

              {/* Secondary CTA (unchanged) */}
              <button className="w-full py-5 border-2 border-zinc-700 text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors">
                В избранное
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800">
              <div className="text-center">
                <svg
                  className="w-8 h-8 text-purple-400 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="text-xs text-zinc-500">Гарантия подлинности</p>
              </div>
              <div className="text-center">
                <svg
                  className="w-8 h-8 text-purple-400 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <p className="text-xs text-zinc-500">Безопасная оплата</p>
              </div>
              <div className="text-center">
                <svg
                  className="w-8 h-8 text-purple-400 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <p className="text-xs text-zinc-500">Застрахованная доставка</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Tabs */}
      <div className="max-w-[1800px] mx-auto px-8 py-16">
        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-zinc-800 mb-12">
          {[
            { id: "description", label: "Описание" },
            { id: "specifications", label: "Характеристики" },
            { id: "shipping", label: "Доставка и возврат" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-sm uppercase tracking-wider font-bold transition-all relative ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "description" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Об этом произведении
                  </h3>
                  <p className="text-zinc-400 leading-relaxed mb-6">
                    {product.description.full}
                  </p>
                  {product.description?.story && (
                    <>
                      <h4 className="text-xl font-bold text-white mb-3">
                        История создания
                      </h4>
                      <p className="text-zinc-400 leading-relaxed">
                        {product.description.story}
                      </p>
                    </>
                  )}
                </div>
                {product.artist && (
                  <div className="bg-zinc-900 border border-zinc-800 p-8">
                    <h4 className="text-xl font-bold text-white mb-6">
                      Художник
                    </h4>
                    <p className="text-zinc-500 mb-4">{product.artist.bio}</p>
                    {product.artist.website && (
                      <a
                        href={product.artist.website}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {product.artist.website} →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Haori Specs */}
                {product.specifications?.haori && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">
                      👘 Характеристики хаори
                    </h3>
                    <div className="space-y-4">
                      <SpecRow
                        label="Материал"
                        value={product.specifications.haori.material}
                      />
                      <SpecRow
                        label="Вес"
                        value={product.specifications.haori.weight}
                      />
                      <SpecRow
                        label="Размеры"
                        value={`${product.specifications.haori.dimensions.length} × ${product.specifications.haori.dimensions.width}`}
                      />
                      <SpecRow
                        label="Длина рукава"
                        value={product.specifications.haori.dimensions.sleeve}
                      />
                      <SpecRow
                        label="Размер"
                        value={product.specifications.haori.sizes.join(", ")}
                      />
                      <SpecRow
                        label="Техника"
                        value={product.specifications.haori.technique}
                      />
                      <SpecRow
                        label="Слои краски"
                        value={`${product.specifications.haori.paintLayers} слоёв`}
                      />
                      <SpecRow
                        label="Уход"
                        value={product.specifications.haori.care}
                      />
                    </div>
                  </div>
                )}

                {/* Canvas Specs */}
                {product.specifications?.canvas && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">
                      🖼️ Характеристики холста
                    </h3>
                    <div className="space-y-4">
                      <SpecRow
                        label="Материал"
                        value={product.specifications.canvas.material}
                      />
                      <SpecRow
                        label="Размеры"
                        value={`${product.specifications.canvas.dimensions.width} × ${product.specifications.canvas.dimensions.height} × ${product.specifications.canvas.dimensions.depth}`}
                      />
                      <SpecRow
                        label="Рама"
                        value={product.specifications.canvas.frame}
                      />
                      <SpecRow
                        label="Вес"
                        value={product.specifications.canvas.weight}
                      />
                      <SpecRow
                        label="Техника"
                        value={product.specifications.canvas.technique}
                      />
                      <SpecRow
                        label="Крепление"
                        value={product.specifications.canvas.hanging}
                      />
                    </div>
                  </div>
                )}

                {/* UV Lamp */}
                {product.specifications?.uvLamp && (
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">
                      💡 UV лампа в комплекте
                    </h4>
                    <div className="space-y-4">
                      <SpecRow
                        label="Модель"
                        value={product.specifications.uvLamp.model}
                      />
                      <SpecRow
                        label="Длина волны"
                        value={product.specifications.uvLamp.wavelength}
                      />
                      <SpecRow
                        label="Мощность"
                        value={product.specifications.uvLamp.power}
                      />
                      <SpecRow
                        label="Батарея"
                        value={product.specifications.uvLamp.battery}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Информация о доставке
                  </h3>
                  <div className="space-y-4 mb-8">
                    <SpecRow
                      label="Перевозчик"
                      value={product.shipping.carrier}
                    />
                    <SpecRow
                      label="Доставка по стране"
                      value={product.shipping.estimatedDays.domestic}
                    />
                    <SpecRow
                      label="Международная доставка"
                      value={product.shipping.estimatedDays.international}
                    />
                    <SpecRow
                      label="Страховка"
                      value={product.shipping.insurance}
                    />
                    <SpecRow
                      label="Таможня"
                      value={product.shipping.customsDuty}
                    />
                  </div>

                  <h4 className="text-xl font-bold text-white mb-4">
                    Упаковка
                  </h4>
                  <p className="text-zinc-400 mb-4">{product.packaging.type}</p>
                  <ul className="space-y-2">
                    {product.packaging.includes.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-zinc-400"
                      >
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8">
                  <h4 className="text-xl font-bold text-white mb-6">
                    Возврат и обмен
                  </h4>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    В связи с ручным изготовлением и ограниченным тиражом этих
                    произведений искусства, все продажи окончательны. Мы не
                    принимаем возвраты или обмен, если товар не прибыл
                    поврежденным или дефектным.
                  </p>
                  <h4 className="text-lg font-bold text-white mb-3">
                    Претензии по повреждениям
                  </h4>
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    Если ваше произведение прибыло поврежденным, пожалуйста,
                    свяжитесь с нами в течение 48 часов с фотографиями. Мы будем
                    работать с DHL для подачи страхового иска и организации
                    замены или полного возврата средств.
                  </p>
                  <button className="w-full py-3 bg-purple-600 text-white font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors">
                    Связаться с поддержкой
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper Component for Specifications
const SpecRow = ({ label, value }) => (
  <div className="flex justify-between py-3 border-b border-zinc-800">
    <span className="text-sm text-zinc-500 uppercase tracking-wider">
      {label}
    </span>
    <span className="text-sm text-zinc-300 text-right max-w-md">{value}</span>
  </div>
);

export default ProductDetail;
