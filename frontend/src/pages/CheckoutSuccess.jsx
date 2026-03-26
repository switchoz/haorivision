import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isUVMode } = useTheme();
  const order = location.state?.order;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!order) {
      navigate("/products");
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [order, navigate]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-10 h-10 border-2 border-zinc-600 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div
      className={`min-h-screen ${isUVMode ? "bg-black" : "bg-zinc-950"} py-16 relative overflow-hidden`}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-20px",
                backgroundColor: [
                  "#B026FF",
                  "#FF10F0",
                  "#00D4FF",
                  "#39FF14",
                  "#FF6600",
                ][Math.floor(Math.random() * 5)],
              }}
              animate={{
                y: window.innerHeight + 100,
                x: [0, Math.random() * 200 - 100],
                rotate: [0, Math.random() * 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8">
        {/* Success Icon */}
        <motion.div
          className="text-center mb-12"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.div
            className="inline-block relative"
            animate={{
              boxShadow: isUVMode
                ? [
                    "0 0 0px rgba(176, 38, 255, 0)",
                    "0 0 60px rgba(176, 38, 255, 0.8)",
                    "0 0 0px rgba(176, 38, 255, 0)",
                  ]
                : "0 0 0px rgba(255, 255, 255, 0)",
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            className={`text-5xl font-black mb-4 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Заказ подтвержден!
          </motion.h1>

          <motion.p
            className="text-xl text-zinc-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Спасибо за покупку. Ваше произведение искусства готовится к
            отправке.
          </motion.p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Order Number */}
          <div className="mb-8 pb-8 border-b border-zinc-800">
            <p className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
              Номер заказа
            </p>
            <p className="text-3xl font-bold text-white">{order.id}</p>
          </div>

          {/* Product Info */}
          <div className="space-y-4 mb-8 pb-8 border-b border-zinc-800">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-6">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-44 object-cover"
                  />
                )}
                <div className="flex-1">
                  {item.collection && (
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      {item.collection}
                    </p>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {item.name}
                  </h3>
                  {item.tagline && (
                    <p className="text-zinc-400 mb-4">{item.tagline}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-bold text-white">
                      ${(item.price * (item.qty || 1)).toLocaleString()}
                    </p>
                    {(item.qty || 1) > 1 && (
                      <>
                        <span className="text-zinc-600">|</span>
                        <p className="text-sm text-zinc-500">x{item.qty}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
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
            <div>
              <p className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
                Ожидаемая доставка
              </p>
              <p className="text-white text-xl font-bold mb-2">
                {deliveryDate}
              </p>
              <p className="text-zinc-400 text-sm">
                через {order.tracking.carrier}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          className="bg-zinc-900 border border-zinc-800 p-8 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6">Что дальше?</h3>
          <div className="space-y-6">
            {[
              {
                icon: "📧",
                title: "Подтверждение по email",
                description:
                  "Вы получите подтверждение заказа на " +
                  order.customer.email +
                  " со всеми деталями.",
                time: "В течение нескольких минут",
              },
              {
                icon: "✍️",
                title: "Подпись художника",
                description:
                  "Ваши хаори и холст будут лично подписаны и пронумерованы художником.",
                time: "1-2 дня",
              },
              {
                icon: "📦",
                title: "Тщательная упаковка",
                description:
                  "Ваше Двойное произведение будет тщательно упаковано в роскошную коробку с UV лампой.",
                time: "2-3 дня",
              },
              {
                icon: "🚚",
                title: "Отправка",
                description:
                  "DHL Express заберет ваш заказ, и вы получите информацию для отслеживания.",
                time: "3-5 дней",
              },
              {
                icon: "🎨",
                title: "Доставка",
                description:
                  "Ваше произведение прибывает! Требуется подпись для этой ценной посылки.",
                time: deliveryDate,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="text-4xl flex-shrink-0">{step.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-bold text-white">
                      {step.title}
                    </h4>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Link to={`/orders/${order.id}`}>
            <motion.button
              className={`w-full py-5 text-lg font-bold uppercase tracking-wider ${
                isUVMode
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-white text-black hover:bg-zinc-200"
              } transition-colors`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Отследить заказ
            </motion.button>
          </Link>

          <Link to="/shop">
            <motion.button
              className="w-full py-5 border-2 border-zinc-700 text-white font-bold uppercase tracking-wider hover:border-purple-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Продолжить покупки
            </motion.button>
          </Link>
        </motion.div>

        {/* Support */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-zinc-500 mb-2">Нужна помощь с заказом?</p>
          <Link
            to="/contact"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Связаться с поддержкой →
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
