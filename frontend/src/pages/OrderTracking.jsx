import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const OrderTracking = () => {
  const { orderId } = useParams();
  const { isUVMode } = useTheme();
  const [order, setOrder] = useState(null);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = (id) => {
    // Load from localStorage (in production, this would be an API call)
    const orders = JSON.parse(localStorage.getItem("haori_orders") || "[]");
    const foundOrder = orders.find((o) => o.id === id);

    if (foundOrder) {
      setOrder(foundOrder);
      setError(null);
    } else {
      setOrder(null);
      setError("Заказ не найден");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchOrderId || !searchEmail) {
      setError("Пожалуйста, введите номер заказа и email");
      return;
    }

    const orders = JSON.parse(localStorage.getItem("haori_orders") || "[]");
    const foundOrder = orders.find(
      (o) =>
        o.id === searchOrderId &&
        o.customer.email.toLowerCase() === searchEmail.toLowerCase(),
    );

    if (foundOrder) {
      setOrder(foundOrder);
      setError(null);
    } else {
      setOrder(null);
      setError("Заказ не найден. Пожалуйста, проверьте номер заказа и email.");
    }
  };

  // Order status timeline
  const getOrderTimeline = () => {
    const statuses = [
      {
        id: "confirmed",
        title: "Заказ подтвержден",
        description: "Ваш заказ получен и подтвержден",
        icon: "✓",
        completed: true,
      },
      {
        id: "processing",
        title: "В обработке",
        description: "Художник подписывает и готовит ваше произведение",
        icon: "✍️",
        completed: order?.tracking.status !== "confirmed",
      },
      {
        id: "packaging",
        title: "Упаковка",
        description: "Тщательно упаковывается в двойную коробку",
        icon: "📦",
        completed:
          order?.tracking.status === "shipped" ||
          order?.tracking.status === "in_transit" ||
          order?.tracking.status === "delivered",
      },
      {
        id: "shipped",
        title: "Отправлено",
        description: "Посылка передана в DHL Express",
        icon: "🚚",
        completed:
          order?.tracking.status === "in_transit" ||
          order?.tracking.status === "delivered",
      },
      {
        id: "in_transit",
        title: "В пути",
        description: "Едет к вам",
        icon: "✈️",
        completed: order?.tracking.status === "delivered",
      },
      {
        id: "delivered",
        title: "Доставлено",
        description: "Произведение доставлено",
        icon: "🎉",
        completed: order?.tracking.status === "delivered",
      },
    ];

    return statuses;
  };

  const deliveryDate = order
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

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

        {/* Search Form (if no order loaded yet) */}
        {!order && !orderId && (
          <motion.div
            className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Найти ваш заказ
            </h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="Номер заказа (например, ORD-1234567890123)"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Email адрес"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-900/20 border border-red-500 p-4 text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className={`w-full py-4 text-lg font-bold uppercase tracking-wider ${
                  isUVMode
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-white text-black hover:bg-zinc-200"
                } transition-colors`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Отследить заказ
              </motion.button>
            </form>

            <div className="mt-8 pt-8 border-t border-zinc-800">
              <p className="text-sm text-zinc-500 mb-4">
                Демо номера заказов (для тестирования):
              </p>
              <div className="space-y-2">
                <p className="text-xs text-zinc-600">
                  Вы можете отследить любой заказ, созданный при оформлении.
                  После завершения покупки используйте номер заказа со страницы
                  подтверждения.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Details (if order found) */}
        <AnimatePresence>
          {order && (
            <>
              {/* Order Header */}
              <motion.div
                className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                      Номер заказа
                    </p>
                    <p className="text-3xl font-bold text-white">{order.id}</p>
                  </div>
                  <div className="text-left md:text-right mt-4 md:mt-0">
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
                      Дата заказа
                    </p>
                    <p className="text-lg text-white">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Current Status Badge */}
                <div className="inline-block">
                  <div className="bg-purple-600/20 border border-purple-500 px-6 py-3">
                    <p className="text-sm uppercase tracking-wider text-purple-400 font-bold">
                      Статус: {order.tracking.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Timeline */}
              <motion.div
                className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-2xl font-bold text-white mb-8">
                  Прогресс заказа
                </h3>

                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-800" />
                  <div
                    className="absolute left-8 top-0 w-0.5 bg-purple-600 transition-all duration-1000"
                    style={{
                      height: `${
                        (getOrderTimeline().filter((s) => s.completed).length /
                          getOrderTimeline().length) *
                        100
                      }%`,
                    }}
                  />

                  {/* Timeline Steps */}
                  <div className="space-y-8">
                    {getOrderTimeline().map((status, i) => (
                      <motion.div
                        key={status.id}
                        className="relative pl-20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        {/* Icon */}
                        <div
                          className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 ${
                            status.completed
                              ? "bg-purple-600 border-purple-400"
                              : "bg-zinc-800 border-zinc-700"
                          }`}
                        >
                          {status.icon}
                        </div>

                        {/* Content */}
                        <div>
                          <h4
                            className={`text-xl font-bold mb-1 ${
                              status.completed ? "text-white" : "text-zinc-600"
                            }`}
                          >
                            {status.title}
                          </h4>
                          <p
                            className={`text-sm ${
                              status.completed
                                ? "text-zinc-400"
                                : "text-zinc-600"
                            }`}
                          >
                            {status.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Tracking Information */}
              <motion.div
                className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  Детали доставки
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tracking Info */}
                  <div>
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
                      Номер отслеживания
                    </p>
                    <p className="text-xl font-mono text-white mb-4">
                      {order.tracking.number}
                    </p>

                    <a
                      href={order.tracking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors"
                    >
                      <span>Отследить через {order.tracking.carrier}</span>
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>

                  {/* Delivery Estimate */}
                  <div>
                    <p className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
                      Ожидаемая доставка
                    </p>
                    <p className="text-xl font-bold text-white mb-2">
                      {deliveryDate}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Требуется подпись при получении
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mt-8 pt-8 border-t border-zinc-800">
                  <p className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
                    Адрес доставки
                  </p>
                  <p className="text-white">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="text-zinc-400">{order.customer.address}</p>
                  <p className="text-zinc-400">
                    {order.customer.city}, {order.customer.postalCode}
                  </p>
                  <p className="text-zinc-400">{order.customer.country}</p>
                </div>
              </motion.div>

              {/* Product Info */}
              <motion.div
                className="bg-zinc-900 border border-zinc-800 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  Ваше произведение
                </h3>

                <div className="flex gap-6">
                  <img
                    src={order.product.images.daylight.hero}
                    alt={order.product.name}
                    className="w-40 h-52 object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      {order.product.collection}
                    </p>
                    <h4 className="text-3xl font-bold text-white mb-2">
                      {order.product.name}
                    </h4>
                    <p className="text-lg text-zinc-400 italic mb-4">
                      {order.product.tagline}
                    </p>

                    <div className="flex items-center gap-4 mb-6">
                      <p className="text-2xl font-bold text-white">
                        ${order.amount.toLocaleString()}
                      </p>
                      <span className="text-zinc-600">|</span>
                      <p className="text-sm text-zinc-500">
                        Edition{" "}
                        {order.product.editions.total -
                          order.product.editions.remaining +
                          1}
                        /{order.product.editions.total}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {order.product.specifications.haori.uvColors
                        .slice(0, 5)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full border-2 border-zinc-700"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="mt-8 flex flex-col md:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/products" className="flex-1">
                  <button className="w-full py-4 border-2 border-zinc-700 text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors">
                    Больше произведений
                  </button>
                </Link>
                <Link to="/contact" className="flex-1">
                  <button className="w-full py-4 border-2 border-zinc-700 text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors">
                    Связаться с поддержкой
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
