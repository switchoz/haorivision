import PageMeta from "../components/PageMeta";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010";

const Contact = () => {
  const { isUVMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка отправки");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", type: "general", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err.message || "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "Как ухаживать за моей работой HAORI VISION?",
      answer:
        "Хаори: Только химчистка. Хранить вдали от прямых солнечных лучей когда не носится. Холст: Беречь от влаги и прямых солнечных лучей. Чистить сухой мягкой тканью. УФ лампа: Протирать мягкой тканью, избегать попадания воды.",
    },
    {
      question: "Что подтверждает подлинность работы?",
      answer:
        "Каждая работа подписана художником LiZa лично. В комплект входят: подпись и нумерация на изделии, изображения работы в высоком разрешении (дневной свет и УФ), детали издания и уникальный серийный номер, эксклюзивный доступ к закулисному контенту.",
    },
    {
      question: "Вы доставляете по всему миру?",
      answer:
        "Да! Мы отправляем по всему миру из домашней мастерской в Москве. Все работы застрахованы и требуют подписи при получении. Стандартная доставка: 2-4 недели. Экспресс доставка: 5-7 рабочих дней. Все таможенные пошлины и налоги включены в цену.",
    },
    {
      question: "Могу ли я посетить мастерскую художника?",
      answer:
        "Да! Мы предлагаем визиты в домашнюю мастерскую в Москве только по предварительной записи. Свяжитесь с нами минимум за 2 недели, чтобы назначить встречу. Во время вашего визита вы можете встретиться с художником, увидеть работы вживую под УФ светом, и узнать о процессе создания.",
    },
  ];

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Контакты"
        description="Свяжитесь с HAORI VISION. Заказ хаори, bespoke-комиссии, сотрудничество. Москва."
      />
      <div className="max-w-6xl mx-auto">
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
            Связаться с Нами
          </h1>
          <p className="text-xl text-zinc-400">
            Свяжитесь с нами для запросов, индивидуальных заказов или
            сотрудничества
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2
              className={`text-3xl font-display font-bold mb-8 ${
                isUVMode ? "text-uv-cyan" : "text-white"
              }`}
            >
              Отправить Сообщение
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-zinc-400 mb-2 text-sm">
                  Ваше Имя
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg bg-zinc-900 border ${
                    isUVMode
                      ? "border-uv-pink/30 focus:border-uv-pink"
                      : "border-zinc-700 focus:border-white"
                  } text-white outline-none transition-colors`}
                  placeholder="Введите ваше имя"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-zinc-400 mb-2 text-sm">
                  Email Адрес
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg bg-zinc-900 border ${
                    isUVMode
                      ? "border-uv-pink/30 focus:border-uv-pink"
                      : "border-zinc-700 focus:border-white"
                  } text-white outline-none transition-colors`}
                  placeholder="ваш@email.com"
                />
              </div>

              {/* Inquiry Type */}
              <div>
                <label className="block text-zinc-400 mb-2 text-sm">
                  Тип Запроса
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-zinc-900 border ${
                    isUVMode
                      ? "border-uv-pink/30 focus:border-uv-pink"
                      : "border-zinc-700 focus:border-white"
                  } text-white outline-none transition-colors`}
                >
                  <option value="general">Общий Запрос</option>
                  <option value="custom">Индивидуальный Заказ</option>
                  <option value="collection">Информация о Коллекции</option>
                  <option value="authenticity">Подлинность работы</option>
                  <option value="collaboration">Сотрудничество</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-zinc-400 mb-2 text-sm">
                  Сообщение
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg bg-zinc-900 border ${
                    isUVMode
                      ? "border-uv-pink/30 focus:border-uv-pink"
                      : "border-zinc-700 focus:border-white"
                  } text-white outline-none transition-colors resize-none`}
                  placeholder="Расскажите о вашем запросе..."
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-gradient py-4 rounded-full text-white font-semibold text-lg"
              >
                {sending
                  ? "Отправка..."
                  : submitted
                    ? "✓ Сообщение Отправлено!"
                    : "Отправить Сообщение"}
              </motion.button>
            </form>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-lg text-center ${
                  isUVMode
                    ? "bg-uv-pink/20 text-uv-pink"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                Спасибо! Мы ответим вам в течение 24-48 часов.
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg text-center bg-red-500/20 text-red-400"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h2
                className={`text-3xl font-display font-bold mb-8 ${
                  isUVMode ? "text-uv-cyan" : "text-white"
                }`}
              >
                Контактная Информация
              </h2>

              <div className="space-y-6">
                {/* Studio */}
                <div className="card-uv">
                  <div className="flex items-start gap-4">
                    <div
                      className={`text-3xl ${isUVMode ? "text-uv-pink" : "text-white"}`}
                    >
                      🏢
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">
                        Мастерская художника
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        Москва, Россия
                        <br />
                        Только по предварительной записи
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="card-uv">
                  <div className="flex items-start gap-4">
                    <div
                      className={`text-3xl ${isUVMode ? "text-uv-pink" : "text-white"}`}
                    >
                      ✉️
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">Email</h3>
                      <p
                        className={`text-sm ${
                          isUVMode ? "text-uv-cyan" : "text-zinc-300"
                        }`}
                      >
                        contact@haorivision.art
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="card-uv">
                  <div className="flex items-start gap-4">
                    <div
                      className={`text-3xl ${isUVMode ? "text-uv-pink" : "text-white"}`}
                    >
                      ⏰
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">
                        Время Ответа
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        Мы обычно отвечаем в течение 24-48 часов
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Подписывайтесь на Нас
              </h3>
              <div className="flex gap-4">
                {[
                  {
                    name: "Instagram",
                    icon: "IG",
                    color: isUVMode ? "bg-uv-pink" : "bg-zinc-800",
                  },
                  {
                    name: "Twitter",
                    icon: "TW",
                    color: isUVMode ? "bg-uv-cyan" : "bg-zinc-800",
                  },
                  {
                    name: "Pinterest",
                    icon: "PI",
                    color: isUVMode ? "bg-uv-purple" : "bg-zinc-800",
                  },
                  {
                    name: "Telegram",
                    icon: "TG",
                    color: isUVMode ? "bg-blue-500" : "bg-zinc-800",
                    href: "https://t.me/haori_vision_bot",
                  },
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href || "#"}
                    target={social.href ? "_blank" : undefined}
                    rel={social.href ? "noopener noreferrer" : undefined}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={`w-14 h-14 rounded-full ${social.color} flex items-center justify-center text-white font-semibold transition-all`}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Bespoke Orders Info */}
            <div className="bg-zinc-900 rounded-lg p-8">
              <h3
                className={`text-2xl font-display font-bold mb-4 ${
                  isUVMode ? "gradient-text" : "text-white"
                }`}
              >
                Индивидуальные Заказы
              </h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Интересуетесь индивидуальной работой? Мы предлагаем полностью
                кастомизированные творения HAORI VISION, разработанные в
                сотрудничестве с вами. Каждая индивидуальная работа уникальна и
                подписана художником лично.
              </p>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>• Личная консультация с художником</li>
                <li>• Индивидуальный дизайн и выбор цвета</li>
                <li>• Эксклюзивные УФ-узоры</li>
                <li>• Время создания: 4-6 недель</li>
                <li>• Начиная от $8,000</li>
              </ul>
            </div>

            {/* FAQ Section - Interactive */}
            <div className="bg-zinc-900 rounded-lg p-8">
              <h3
                className={`text-xl font-semibold mb-6 ${
                  isUVMode ? "text-uv-cyan" : "text-white"
                }`}
              >
                Часто Задаваемые Вопросы
              </h3>

              <div className="space-y-4">
                {faqItems.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg overflow-hidden transition-colors ${
                        isUVMode ? "border-purple-500/30" : "border-zinc-800"
                      }`}
                    >
                      {/* Question Header */}
                      <button
                        onClick={() => toggleFaq(index)}
                        className={`w-full px-4 py-4 flex items-center justify-between text-left transition-colors ${
                          isUVMode
                            ? "hover:bg-purple-500/10"
                            : "hover:bg-zinc-800/50"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isOpen
                              ? isUVMode
                                ? "text-uv-cyan"
                                : "text-white"
                              : "text-zinc-300"
                          }`}
                        >
                          {item.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={isUVMode ? "text-uv-pink" : "text-white"}
                        >
                          ▼
                        </motion.span>
                      </button>

                      {/* Answer Content */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-4 pb-4">
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              <Link to="/faq">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className={`mt-6 text-sm transition-colors w-full text-center py-2 rounded-lg ${
                    isUVMode
                      ? "text-uv-cyan hover:bg-purple-500/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  Смотреть все FAQ (23 вопроса) →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
