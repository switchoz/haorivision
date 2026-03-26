import PageMeta from "../components/PageMeta";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const Privacy = () => {
  const { isUVMode } = useTheme();

  const sections = [
    {
      title: "1. Какие данные мы собираем",
      content:
        "При оформлении заказа мы собираем следующие персональные данные:\n\n" +
        "\u2022 Имя и фамилия\n" +
        "\u2022 Адрес электронной почты\n" +
        "\u2022 Номер телефона\n" +
        "\u2022 Адрес доставки (улица, город, почтовый индекс, страна)\n\n" +
        "При оформлении bespoke-заказа дополнительно могут запрашиваться: рост, обхват груди, предпочтения по цветам и энергии.",
    },
    {
      title: "2. Как мы используем ваши данные",
      content:
        "Ваши персональные данные используются исключительно для:\n\n" +
        "\u2022 Обработки и выполнения заказов\n" +
        "\u2022 Связи с вами по вопросам заказа\n" +
        "\u2022 Доставки товаров\n" +
        "\u2022 Отправки уведомлений о статусе заказа\n" +
        "\u2022 Улучшения качества обслуживания",
    },
    {
      title: "3. Обработка платежей",
      content:
        "Все платежи обрабатываются через Stripe \u2014 сертифицированного платёжного провайдера (PCI DSS Level 1). " +
        "Мы НЕ храним данные вашей банковской карты на наших серверах. " +
        "Вся платёжная информация передаётся напрямую в Stripe через зашифрованное соединение (SSL/TLS).",
    },
    {
      title: "4. Файлы cookie",
      content:
        "Наш сайт использует минимальное количество cookie-файлов:\n\n" +
        "\u2022 Технические cookie \u2014 необходимы для работы сайта (корзина, сессия)\n" +
        "\u2022 Аналитические cookie \u2014 помогают нам понимать, как вы используете сайт (анонимно)\n\n" +
        "Мы не используем рекламные cookie и не передаём данные рекламным сетям.",
    },
    {
      title: "5. Передача данных третьим лицам",
      content:
        "Мы НЕ продаём, не сдаём в аренду и не передаём ваши персональные данные третьим лицам, за исключением:\n\n" +
        "\u2022 Stripe \u2014 для обработки платежей\n" +
        "\u2022 Службы доставки (DHL, СДЭК) \u2014 для отправки заказов\n\n" +
        "Эти партнёры имеют доступ только к информации, необходимой для выполнения своих функций, и обязаны защищать ваши данные.",
    },
    {
      title: "6. Безопасность данных",
      content:
        "Мы принимаем все разумные меры для защиты ваших персональных данных:\n\n" +
        "\u2022 Шифрование данных при передаче (SSL/TLS)\n" +
        "\u2022 Ограниченный доступ к персональным данным\n" +
        "\u2022 Регулярное обновление систем безопасности\n" +
        "\u2022 Аудит доступа к данным",
    },
    {
      title: "7. Ваши права",
      content:
        "Вы имеете право:\n\n" +
        "\u2022 Запросить доступ к вашим персональным данным\n" +
        "\u2022 Потребовать исправления неточных данных\n" +
        "\u2022 Потребовать удаления ваших данных\n" +
        "\u2022 Отозвать согласие на обработку данных\n\n" +
        "Для реализации этих прав свяжитесь с нами: contact@haorivision.art",
    },
    {
      title: "8. Изменения политики",
      content:
        "Мы можем обновлять эту политику конфиденциальности. Актуальная версия всегда доступна на этой странице. " +
        "При существенных изменениях мы уведомим вас по электронной почте.",
    },
  ];

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Политика конфиденциальности"
        description="Политика конфиденциальности HAORI VISION. Узнайте, как мы собираем, используем и защищаем ваши персональные данные."
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className={`text-4xl md:text-6xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Политика конфиденциальности
          </h1>
          <p className="text-zinc-400 text-sm">
            Последнее обновление: март 2026
          </p>
        </motion.div>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-6 md:p-8 ${
                isUVMode
                  ? "border-purple-900/30 bg-zinc-900/50"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isUVMode ? "text-purple-300" : "text-white"
                }`}
              >
                {section.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">
            Если у вас есть вопросы о нашей политике конфиденциальности,
            свяжитесь с нами.
          </p>
          <Link
            to="/contact"
            className={`inline-block text-sm transition-colors ${
              isUVMode
                ? "text-purple-400 hover:text-purple-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Связаться с нами &rarr;
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
