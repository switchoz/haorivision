import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { trackCTAEvent } from "../ab/withCTAExperiment";
import { tid } from "../shared/testid";

const API_URL = import.meta.env.VITE_API_URL || "";

// Stripe publishable key (test mode)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ items, totalAmount, onSuccess, clearCart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { isUVMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    trackCTAEvent("checkout_started", items[0]?.id);

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      const { error: pmError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              country: formData.country,
            },
          },
        });

      if (pmError) {
        throw new Error(pmError.message);
      }

      const orderRes = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
          })),
          paymentMethodId: paymentMethod.id,
          customer: {
            name: `${formData.firstName} ${formData.lastName}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
          },
          amount: totalAmount,
          shippingAddress: {
            name: `${formData.firstName} ${formData.lastName}`,
            street: formData.address,
            city: formData.city,
            zipCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Ошибка создания заказа");
      }

      trackCTAEvent("order_completed", items[0]?.id);

      const order = {
        id: orderData.order?.orderNumber || orderData.order?._id,
        items,
        customer: formData,
        paymentMethodId: paymentMethod.id,
        amount: totalAmount,
        currency: "USD",
        status: "confirmed",
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        tracking: orderData.order?.tracking || {
          carrier: "DHL Express",
          status: "processing",
        },
      };

      const existingOrders = JSON.parse(
        localStorage.getItem("haori_orders") || "[]",
      );
      existingOrders.push(order);
      localStorage.setItem("haori_orders", JSON.stringify(existingOrders));

      if (clearCart) clearCart();

      navigate("/checkout/success", { state: { order } });
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.message || "Оплата не удалась. Пожалуйста, попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        "::placeholder": {
          color: "#71717a",
        },
        backgroundColor: "transparent",
      },
      invalid: {
        color: "#ef4444",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact Information */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">
          Контактная информация
        </h3>
        <div className="space-y-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Имя"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Фамилия"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Телефон"
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Адрес доставки</h3>
        <div className="space-y-4">
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Адрес"
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Город"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="Почтовый индекс"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Выберите страну</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="JP">Japan</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="SG">Singapore</option>
            <option value="HK">Hong Kong</option>
            <option value="AE">UAE</option>
          </select>
        </div>
      </div>

      {/* Payment Information */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">
          Платежная информация
        </h3>
        <div className="bg-zinc-900 border border-zinc-700 p-4">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Тестовая карта: 4242 4242 4242 4242 • Любая будущая дата • Любой
          3-значный CVC
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500 p-4 text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        {...tid("checkout")}
        type="submit"
        disabled={!stripe || loading}
        className={`w-full py-5 text-lg font-bold uppercase tracking-wider transition-all ${
          loading || !stripe
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : isUVMode
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-white text-black hover:bg-zinc-200"
        }`}
        whileHover={!loading && stripe ? { scale: 1.02 } : {}}
        whileTap={!loading && stripe ? { scale: 0.98 } : {}}
      >
        {loading ? "Обработка..." : `Оплатить $${totalAmount.toLocaleString()}`}
      </motion.button>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <svg
          className="w-6 h-6 text-zinc-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-zinc-500">Безопасная оплата</span>
        <span className="text-zinc-700">|</span>
        <span className="text-sm text-zinc-500">При поддержке Stripe</span>
      </div>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isUVMode } = useTheme();
  const cart = useCart();

  // Support both: single product from ProductDetail and multi-item from Cart
  const singleProduct = location.state?.product;
  const fromCart = location.state?.fromCart;

  const checkoutItems = fromCart
    ? cart.items
    : singleProduct
      ? [
          {
            ...singleProduct,
            qty: 1,
            image: singleProduct.images?.daylight?.hero,
          },
        ]
      : [];

  useEffect(() => {
    if (checkoutItems.length === 0) {
      navigate("/shop");
    }
  }, [checkoutItems.length, navigate]);

  if (checkoutItems.length === 0) {
    return null;
  }

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );
  const shippingCost = subtotal >= 5000 ? 0 : 150;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  return (
    <div
      className={`min-h-screen ${isUVMode ? "bg-black" : "bg-zinc-950"} py-16`}
    >
      <div className="max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="mb-12">
          <h1
            className={`text-4xl font-black mb-2 ${
              isUVMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-white"
            }`}
          >
            Безопасная оплата
          </h1>
          <p className="text-zinc-500">Завершите покупку</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Checkout Form */}
          <div>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                items={checkoutItems}
                totalAmount={total}
                clearCart={fromCart ? cart.clearCart : undefined}
              />
            </Elements>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="sticky top-24">
              <h3 className="text-2xl font-bold text-white mb-6">
                Сводка заказа
              </h3>

              <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
                {/* Items */}
                <div className="space-y-4 mb-6 pb-6 border-b border-zinc-800">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-20 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                        {item.image || item.images?.daylight?.hero ? (
                          <img
                            src={item.image || item.images?.daylight?.hero}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            👘
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                          {item.collection}
                        </p>
                        <h4 className="text-sm font-bold text-white truncate">
                          {item.name}
                        </h4>
                        {(item.qty || 1) > 1 && (
                          <p className="text-xs text-zinc-400">x{item.qty}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">
                          ${(item.price * (item.qty || 1)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-zinc-400">
                    <span>Промежуточный итог</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Доставка (DHL Express)</span>
                    <span>
                      {shippingCost === 0 ? "БЕСПЛАТНО" : `$${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Налог (приблизительно)</span>
                    <span>${tax.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
                  <span className="text-xl font-bold text-white">Итого</span>
                  <span className="text-3xl font-bold text-white">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h4 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">
                  Что входит в комплект
                </h4>
                <div className="space-y-3">
                  {[
                    "👘 Расписанное вручную шёлковое хаори",
                    "🎁 Фирменная упаковка",
                    "✍️ Подпись художника LiZa",
                    "📦 Роскошная подарочная коробка",
                    "🚚 Застрахованная доставка",
                    "🌍 Доставка по всему миру",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm text-zinc-400"
                    >
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 text-center">
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
                  <p className="text-xs text-zinc-500">SSL шифрование</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 text-center">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="text-xs text-zinc-500">PCI сертифицирован</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
