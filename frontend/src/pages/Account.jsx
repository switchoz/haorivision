import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import PageMeta from "../components/PageMeta";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const getToken = () => localStorage.getItem("customer_jwt");
const setToken = (t) => localStorage.setItem("customer_jwt", t);
const clearToken = () => localStorage.removeItem("customer_jwt");

const apiFetch = async (path, opts = {}) => {
  const token = getToken();
  const r = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (r.status === 401) {
    clearToken();
    throw new Error("UNAUTH");
  }
  return r.json();
};

const statusLabels = {
  new: "Новый",
  pending: "Ожидает",
  paid: "Оплачен",
  processing: "В обработке",
  fulfilled: "Выполнен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  canceled: "Отменён",
  cancelled: "Отменён",
  refunded: "Возврат",
};

const bespokeLabels = {
  submitted: "Заявка подана",
  moodboard_created: "Moodboard создан",
  consultation_scheduled: "Консультация",
  consultation_completed: "Консультация прошла",
  approved: "Утверждён",
  in_progress: "В работе",
  completed: "Завершено",
  delivered: "Доставлено",
  cancelled: "Отменено",
};

export default function Account() {
  const { isUVMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bespoke, setBespoke] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [tab, setTab] = useState("orders");
  const [loading, setLoading] = useState(true);

  // Auth form
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (getToken()) loadAccount();
    else setLoading(false);
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const [me, ordersData, bespokeData, wishlistData] = await Promise.all([
        apiFetch("/api/account/me"),
        apiFetch("/api/account/orders"),
        apiFetch("/api/account/bespoke"),
        apiFetch("/api/account/wishlist"),
      ]);
      setUser(me.customer);
      setOrders(ordersData.orders || []);
      setBespoke(bespokeData.commissions || []);
      setWishlist(wishlistData.items || []);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === "login" ? "/api/account/login" : "/api/account/register";
      const body =
        authMode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const r = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();

      if (!r.ok) {
        toast.error(data.error || "Ошибка");
        return;
      }

      setToken(data.token);
      toast.success(authMode === "login" ? "Вы вошли" : "Аккаунт создан");
      await loadAccount();
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setOrders([]);
    setBespoke([]);
    setWishlist([]);
  };

  const removeFromWishlist = async (productId) => {
    try {
      await apiFetch(`/api/account/wishlist/${productId}`, {
        method: "DELETE",
      });
      setWishlist(wishlist.filter((p) => p.id !== productId));
      toast.success("Удалено из избранного");
    } catch {
      toast.error("Ошибка");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-600 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Auth form
  if (!user) {
    return (
      <div className="min-h-screen py-24 px-4">
        <PageMeta title="Личный кабинет" />
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              className={`text-4xl font-display font-bold text-center mb-8 ${isUVMode ? "gradient-text" : "text-white"}`}
            >
              {authMode === "login" ? "Вход" : "Регистрация"}
            </h1>

            <form
              onSubmit={handleAuth}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
            >
              {authMode === "register" && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Имя
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {authLoading
                  ? "Загрузка..."
                  : authMode === "login"
                    ? "Войти"
                    : "Создать аккаунт"}
              </button>
            </form>

            <p className="text-center text-zinc-500 mt-4">
              {authMode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
                className="text-purple-400 hover:text-purple-300"
              >
                {authMode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Account dashboard
  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta title="Личный кабинет" />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1
              className={`text-4xl font-display font-bold ${isUVMode ? "gradient-text" : "text-white"}`}
            >
              {user.name}
            </h1>
            <p className="text-zinc-400 mt-1">{user.email}</p>
            {user.vipTier && user.vipTier !== "standard" && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 uppercase">
                {user.vipTier}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-zinc-400 hover:text-white border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors"
          >
            Выйти
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: "orders", label: `Заказы (${orders.length})` },
            { key: "bespoke", label: `Bespoke (${bespoke.length})` },
            { key: "wishlist", label: `Избранное (${wishlist.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                tab === t.key
                  ? isUVMode
                    ? "bg-purple-600 text-white"
                    : "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-xl mb-4">У вас пока нет заказов</p>
                <Link
                  to="/shop"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Перейти в магазин
                </Link>
              </div>
            ) : (
              orders.map((o) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-white font-medium">
                        {o.orderNumber || o._id}
                      </span>
                      <span className="text-zinc-500 text-sm ml-3">
                        {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        o.status === "paid" || o.status === "delivered"
                          ? "bg-green-500/20 text-green-400"
                          : o.status === "canceled" || o.status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  {o.items?.map((item, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.name}
                          className="w-10 h-12 object-cover rounded"
                        />
                      )}
                      <span className="text-zinc-300">{item.name}</span>
                      <span className="text-zinc-500 ml-auto">
                        {item.price?.toLocaleString()}{" "}
                        {o.currency?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {o.tracking?.trackingNumber && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Трек:{" "}
                      <span className="font-mono text-zinc-400">
                        {o.tracking.trackingNumber}
                      </span>
                    </p>
                  )}
                  <div className="mt-3">
                    <Link
                      to={`/orders/${o.orderNumber || o._id}`}
                      className="text-purple-400 text-sm hover:text-purple-300"
                    >
                      Подробнее
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Bespoke */}
        {tab === "bespoke" && (
          <div className="space-y-4">
            {bespoke.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-xl mb-4">Нет bespoke комиссий</p>
                <Link
                  to="/bespoke"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Заказать индивидуальное хаори
                </Link>
              </div>
            ) : (
              bespoke.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-white font-medium">
                      {c.commissionNumber}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.status === "completed" || c.status === "delivered"
                          ? "bg-green-500/20 text-green-400"
                          : c.status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : c.status === "in_progress"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {bespokeLabels[c.status] || c.status}
                    </span>
                  </div>
                  {c.brief?.energy && (
                    <p className="text-sm text-zinc-400">
                      Энергия: {c.brief.energy}
                    </p>
                  )}
                  {c.brief?.colors?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {c.brief.colors.slice(0, 5).map((color, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.pricing?.totalPrice && (
                    <p className="text-sm text-zinc-500 mt-2">
                      Итого:{" "}
                      <span className="text-white font-medium">
                        {c.pricing.totalPrice} {c.pricing.currency}
                      </span>
                      {c.pricing.depositPaid && (
                        <span className="text-green-400 ml-2">
                          (депозит оплачен)
                        </span>
                      )}
                    </p>
                  )}
                  {c.moodboard?.generated && (
                    <p className="text-xs text-purple-400 mt-2">
                      Moodboard готов
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Wishlist */}
        {tab === "wishlist" && (
          <div className="space-y-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-xl mb-4">Список избранного пуст</p>
                <Link
                  to="/shop"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Перейти в магазин
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((p) => (
                  <motion.div
                    key={p.id || p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                  >
                    {p.images?.[0] && (
                      <Link to={`/product/${p.id}`}>
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-48 object-cover hover:opacity-80 transition-opacity"
                        />
                      </Link>
                    )}
                    <div className="p-4">
                      <Link
                        to={`/product/${p.id}`}
                        className="text-white font-medium hover:text-purple-400 transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.tagline && (
                        <p className="text-zinc-500 text-sm mt-1">
                          {p.tagline}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-white font-bold">
                          {p.price?.toLocaleString()} $
                        </span>
                        <button
                          onClick={() => removeFromWishlist(p.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
