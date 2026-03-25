import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const statusMap = {
  new: { label: "Новый", step: 0 },
  pending: { label: "Ожидает оплаты", step: 0 },
  paid: { label: "Оплачен", step: 1 },
  processing: { label: "В обработке", step: 2 },
  fulfilled: { label: "Готов к отправке", step: 3 },
  shipped: { label: "Отправлен", step: 4 },
  delivered: { label: "Доставлен", step: 5 },
  canceled: { label: "Отменён", step: -1 },
  cancelled: { label: "Отменён", step: -1 },
  refunded: { label: "Возврат", step: -1 },
};

const timeline = [
  {
    id: "confirmed",
    title: "Заказ подтверждён",
    description: "Ваш заказ получен и подтверждён",
    step: 0,
  },
  {
    id: "paid",
    title: "Оплата получена",
    description: "Платёж успешно обработан",
    step: 1,
  },
  {
    id: "processing",
    title: "В работе",
    description: "Художник готовит ваше произведение",
    step: 2,
  },
  {
    id: "ready",
    title: "Упаковка",
    description: "Тщательно упаковывается для отправки",
    step: 3,
  },
  {
    id: "shipped",
    title: "Отправлено",
    description: "Посылка передана службе доставки",
    step: 4,
  },
  {
    id: "delivered",
    title: "Доставлено",
    description: "Произведение доставлено",
    step: 5,
  },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const { isUVMode } = useTheme();
  const [order, setOrder] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder(orderId);
  }, [orderId]);

  const loadOrder = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/orders/${encodeURIComponent(id)}`);
      const data = await r.json();
      if (r.ok && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(data.error || "Заказ не найден");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      setError("Введите номер заказа");
      return;
    }
    loadOrder(searchId.trim());
  };

  const currentStep = order ? (statusMap[order.status]?.step ?? -1) : -1;
  const isCancelled = currentStep === -1 && order;

  return (
    <div
      className={`min-h-screen ${isUVMode ? "bg-black" : "bg-zinc-950"} py-16`}
    >
      <div className="max-w-5xl mx-auto px-8">
        {/* Header */}
        <div className="mb-12">
          <h1
            className={`text-5xl font-black mb-4 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            Отследить заказ
          </h1>
          <p className="text-zinc-400 text-xl">
            Следите за путешествием вашего произведения
          </p>
        </div>

        {/* Search Form */}
        {!order && !loading && (
          <motion.div
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Найти заказ</h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Номер заказа (например, HV2603xxxx)"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className={`w-full py-4 rounded-lg text-lg font-bold uppercase tracking-wider transition-colors ${
                  isUVMode
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Отследить
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-zinc-600 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Order Details */}
        <AnimatePresence>
          {order && !loading && (
            <>
              {/* Order Header */}
              <motion.div
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                      Номер заказа
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {order.orderNumber || order._id}
                    </p>
                  </div>
                  <div className="text-left md:text-right mt-4 md:mt-0">
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                      Дата заказа
                    </p>
                    <p className="text-lg text-white">
                      {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="inline-block">
                  <div
                    className={`px-6 py-3 rounded-lg ${
                      isCancelled
                        ? "bg-red-600/20 border border-red-500"
                        : "bg-purple-600/20 border border-purple-500"
                    }`}
                  >
                    <p
                      className={`text-sm uppercase tracking-wider font-bold ${
                        isCancelled ? "text-red-400" : "text-purple-400"
                      }`}
                    >
                      {statusMap[order.status]?.label || order.status}
                    </p>
                  </div>
                </div>

                {/* Back to search */}
                <button
                  onClick={() => {
                    setOrder(null);
                    setError(null);
                  }}
                  className="ml-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Другой заказ
                </button>
              </motion.div>

              {/* Timeline */}
              {!isCancelled && (
                <motion.div
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-8">
                    Прогресс заказа
                  </h3>

                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-800" />
                    <div
                      className="absolute left-8 top-0 w-0.5 bg-purple-600 transition-all duration-1000"
                      style={{
                        height: `${(Math.max(0, currentStep + 1) / timeline.length) * 100}%`,
                      }}
                    />

                    <div className="space-y-8">
                      {timeline.map((s, i) => {
                        const completed = currentStep >= s.step;
                        return (
                          <motion.div
                            key={s.id}
                            className="relative pl-20"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.08 }}
                          >
                            <div
                              className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-4 transition-colors ${
                                completed
                                  ? "bg-purple-600 border-purple-400 text-white"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-600"
                              }`}
                            >
                              {completed ? "✓" : i + 1}
                            </div>
                            <div>
                              <h4
                                className={`text-xl font-bold mb-1 ${
                                  completed ? "text-white" : "text-zinc-600"
                                }`}
                              >
                                {s.title}
                              </h4>
                              <p
                                className={`text-sm ${
                                  completed ? "text-zinc-400" : "text-zinc-600"
                                }`}
                              >
                                {s.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tracking Info */}
              {order.tracking?.trackingNumber && (
                <motion.div
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Доставка
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                        Номер отслеживания
                      </p>
                      <p className="text-xl font-mono text-white">
                        {order.tracking.trackingNumber}
                      </p>
                      {order.tracking.carrier && (
                        <p className="text-zinc-400 mt-1">
                          {order.tracking.carrier}
                        </p>
                      )}
                    </div>
                    {order.tracking.shippedAt && (
                      <div>
                        <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                          Дата отправки
                        </p>
                        <p className="text-lg text-white">
                          {new Date(
                            order.tracking.shippedAt,
                          ).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Order Items */}
              {order.items?.length > 0 && (
                <motion.div
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Товары в заказе
                  </h3>
                  <div className="space-y-4">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg"
                      >
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-white">{item.name}</p>
                          {item.editionNumber && (
                            <p className="text-sm text-zinc-400">
                              Экземпляр #{item.editionNumber}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-white">
                          {item.price?.toLocaleString()}{" "}
                          {order.currency?.toUpperCase() || ""}
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.totals?.total && (
                    <div className="mt-4 pt-4 border-t border-zinc-700 text-right">
                      <span className="text-zinc-400 mr-4">Итого:</span>
                      <span className="text-2xl font-bold text-white">
                        {order.totals.total.toLocaleString()}{" "}
                        {order.currency?.toUpperCase() || ""}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                className="flex flex-col md:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/shop" className="flex-1">
                  <button className="w-full py-4 border-2 border-zinc-700 rounded-lg text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors">
                    В магазин
                  </button>
                </Link>
                <Link to="/contact" className="flex-1">
                  <button className="w-full py-4 border-2 border-zinc-700 rounded-lg text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors">
                    Связаться с нами
                  </button>
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTracking;
