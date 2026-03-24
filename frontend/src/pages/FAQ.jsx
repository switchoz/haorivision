import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useState } from "react";

const FAQ = () => {
  const { isUVMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      category: "О Продукции",
      questions: [
        {
          question: "Как ухаживать за моей работой HAORI VISION?",
          answer:
            "Хаори: Только химчистка. Хранить вдали от прямых солнечных лучей. Избегать длительного воздействия UV света (рекомендуется макс. 1-2 часа за раз). Хранить в тёмном прохладном месте в оригинальной упаковке.\n\nХолст: Хранить вдали от прямых солнечных лучей. Не подвергать воздействию влаги. Периодически протирать мягкой сухой тканью. UV лампу использовать на расстоянии минимум 50см от холста.",
        },
        {
          question: "Что такое Twin Artwork Set?",
          answer:
            "Twin Artwork Set — это уникальная концепция HAORI VISION: одно произведение искусства в двух физических формах. Хаори (носимое) и холст (настенное) расписаны в одном стиле одновременно, с идентичными UV паттернами. Это позволяет вам носить искусство и показывать его дома.",
        },
        {
          question: "Можно ли купить хаори и холст отдельно?",
          answer:
            'Да! Мы предлагаем некоторые работы как "Haori Only" или "Canvas Only" по более низким ценам. Однако Twin Sets — это наша основная концепция, и они содержат дополнительные элементы (UV лампа премиум качества, подпись художника LiZa).',
        },
        {
          question: "Как работает UV эффект?",
          answer:
            'Мы используем профессиональные UV-реактивные флуоресцентные пигменты, которые поглощают ультрафиолетовый свет (365нм) и переизлучают его как видимый цвет. При дневном свете эти пигменты невидимы или очень бледные. Под UV светом они "загораются" яркими неоновыми цветами. Каждая работа включает портативную UV лампу.',
        },
        {
          question:
            "Насколько яркий UV эффект? Работает ли он при дневном свете?",
          answer:
            "UV эффект работает ТОЛЬКО в темноте или при слабом освещении с UV лампой. Чем темнее окружающая среда, тем ярче эффект. При ярком дневном свете UV паттерны не видны. Мы рекомендуем создать тёмную зону для максимального эффекта.",
        },
      ],
    },
    {
      category: "Подлинность",
      questions: [
        {
          question: "Как подтверждается подлинность работы?",
          answer:
            "Каждая работа HAORI VISION подписана художником LiZa лично и включает:\n\n• Подпись и нумерация на изделии\n• Номер издания (например, 3/8)\n• Фотографии высокого разрешения (дневной свет + UV)\n• Закулисное видео создания\n• Аудио комментарий художника\n• AR фильтр эксклюзивный",
        },
        {
          question: "Могу ли я перепродать мою работу?",
          answer:
            "Абсолютно! Это искусство, а не масс-продукция. Вы можете:\n\n• Перепродать физическую работу новому владельцу\n• Новый владелец получает весь пакет аутентификации с подписью художника",
        },
        {
          question: "Что если физическая работа повреждена?",
          answer:
            "Если физическая работа повреждена/утрачена при доставке, свяжитесь с нами в течение 48 часов с фотографиями. Мы организуем замену или полный возврат средств. Каждая работа также имеет NFC чип для дополнительной аутентификации.",
        },
      ],
    },
    {
      category: "Доставка и Возврат",
      questions: [
        {
          question: "Вы доставляете по всему миру?",
          answer:
            "Да! Мы отправляем по всему миру через DHL Express с полным отслеживанием и страховкой.\n\nСроки доставки:\n• Россия / СНГ: 7-14 рабочих дней\n• Европа: 5-10 рабочих дней\n• Азия: 3-7 рабочих дней\n• США / Канада: 7-12 рабочих дней\n\nДоставка БЕСПЛАТНАЯ для всех заказов. Страховка на полную стоимость включена.",
        },
        {
          question: "Что насчёт таможенных пошлин?",
          answer:
            "Покупатель несёт ответственность за импортные пошлины и налоги в своей стране. Мы декларируем полную стоимость произведения искусства. Обычно произведения искусства имеют льготное налогообложение или освобождение в большинстве стран, но это зависит от местного законодательства.",
        },
        {
          question: "Какова ваша политика возврата?",
          answer:
            'Из-за уникальной природы произведений искусства, мы НЕ принимаем возвраты по причине "передумал".\n\nМы принимаем возвраты только если:\n• Работа повреждена при доставке (требуется фото в течение 48 часов)\n• Работа значительно отличается от описания\n• UV эффект не работает (производственный дефект)\n\nВ этих случаях мы предложим полный возврат или замену.',
        },
        {
          question: "Как упакована работа?",
          answer:
            'Каждая работа поставляется в индивидуальной "Twin Box":\n\n• Жёсткая коробка премиум качества\n• UV-реактивная внутренняя подкладка\n• Хаори в защитной ткани + кислотонейтральная бумага\n• Холст в пузырчатой плёнке + картонная защита\n• UV лампа в собственном отсеке\n• Белые перчатки, инструкции\n\nКоробка сама по себе — произведение искусства!',
        },
      ],
    },
    {
      category: "Студия и Посещение",
      questions: [
        {
          question: "Могу ли я посетить мастерскую художника?",
          answer:
            "Да! Домашняя мастерская художника в Москве открыта для посещения ТОЛЬКО по предварительной записи. Запишитесь минимум за 2 недели через contact@haorivision.art.\n\nВы сможете:\n• Увидеть текущие работы в процессе\n• Встретиться с художником\n• Испытать UV эффекты в нашей тёмной комнате\n• Обсудить индивидуальные заказы\n\nПосещения бесплатные, но ограничены 2 человека максимум.",
        },
        {
          question: "Кто художник за HAORI VISION?",
          answer:
            'За HAORI VISION стоит художник Елизавета Федькина (LiZa) с опытом в:\n\n• Традиционном текстильном искусстве\n• UV/флуоресцентной живописи\n• Современном дизайне одежды\n\nФилософия: "Носи Свет. Стань Искусством."',
        },
        {
          question: "Сколько времени занимает создание одной работы?",
          answer:
            'В среднем:\n\n• Twin Set: 40-60 часов (хаори + холст)\n• Haori Only: 25-35 часов\n• Canvas Only: 15-25 часов\n\nЭто включает:\n• Выбор ткани/холста\n• Медитацию и планирование дизайна\n• Нанесение базовых слоёв (3-4 слоя)\n• UV флуоресцентные слои (4-8 слоёв)\n• Время высыхания (72-96 часов между слоями)\n• Финальный контроль качества под UV\n\nПремиум работы типа "Восхождение Дракона" могут занимать 120+ часов.',
        },
      ],
    },
    {
      category: "Индивидуальные Заказы",
      questions: [
        {
          question: "Принимаете ли вы индивидуальные заказы?",
          answer:
            "Да! Мы принимаем ограниченное количество индивидуальных заказов (максимум 2 в месяц).\n\nПроцесс:\n1. Консультация (видео звонок, 30 минут) — обсуждаем вашу концепцию\n2. Предложение и эскизы — мы создаём мудборд и концепт-арт\n3. Депозит 50% — начинаем работу\n4. Обновления прогресса — фото каждые 2 недели\n5. Финальные 50% — доставка\n\nСроки: 6-10 недель от консультации до доставки\nЦена: от $8,000 (зависит от сложности)",
        },
        {
          question: "Могу ли я выбрать свои собственные UV цвета?",
          answer:
            "Да, для индивидуальных заказов вы можете выбрать из нашей палитры UV пигментов:\n\n• Неоново-зелёный (#39FF14)\n• Электрический фиолетовый (#B026FF)\n• Ярко-розовый (#FF10F0)\n• Голубой взрыв (#00D4FF)\n• Кибер-оранжевый (#FF6600)\n• UV жёлтый (#FFFF00)\n\nМы можем использовать до 5 цветов в одной работе. Некоторые комбинации работают лучше других — художник проконсультирует.",
        },
        {
          question: "Могу ли я заказать работу на основе фотографии?",
          answer:
            'Частично, да. Мы можем использовать вашу фотографию как вдохновение, но НЕ создаём точные копии (это не наш стиль).\n\nМы превратим вашу концепцию в HAORI VISION стиль:\n• Абстрагируем формы\n• Добавляем UV слои для "скрытого измерения"\n• Интегрируем японские эстетические принципы\n\nНапример: фото вашего питомца → стилизованный духовный силуэт с UV "аурой"',
        },
      ],
    },
    {
      category: "Оплата и Цены",
      questions: [
        {
          question: "Почему работы HAORI VISION такие дорогие?",
          answer:
            "Наши работы — это не масс-продукция, а настоящее искусство:\n\n• 40-120 часов ручной работы на произведение\n• Премиум материалы (японский шёлк, льняной холст)\n• Профессиональные UV пигменты (очень дорогие)\n• Лимитированные издания (3-20 штук)\n• Включает UV лампу премиум качества ($200 стоимость)\n• Подпись художника LiZa\n• Индивидуальная упаковка и доставка\n\nСравнимо с ценами галерей современного искусства, но с добавленной носимостью и UV технологией.",
        },
        {
          question: "Какие способы оплаты вы принимаете?",
          answer:
            "Мы принимаем:\n\n• Банковские карты (Visa, Mastercard, Amex) через Stripe\n• Банковский перевод (для заказов $10,000+)\n• PayPal (доступно по запросу)\n\nВсе платежи безопасны и зашифрованы. Мы НЕ храним данные карт.",
        },
        {
          question: "Предлагаете ли вы рассрочку?",
          answer:
            "Да! Для заказов от $5,000 мы предлагаем:\n\n• Рассрочка на 3 месяца (0% процентов)\n• Рассрочка на 6 месяцев (+5% от суммы)\n• Индивидуальный план для корпоративных клиентов\n\nРаботу отправляем после первого платежа. Свяжитесь с нами для настройки плана.",
        },
        {
          question: "Растут ли работы HAORI VISION в цене?",
          answer:
            "Исторически — да. Наши первые работы 2024 года:\n\n• Начальная цена: $4,500-6,000\n• Цена перепродажи: $8,000-12,000\n• ROI: 50-100% за 6-12 месяцев\n\nПричины роста:\n• Лимитированные издания (когда sold out, цена растёт)\n• Растущее признание бренда\n• Уникальная UV технология\n• Ручная работа привлекает коллекционеров\n\nЭто искусство, не инвестиция, но value appreciation возможен.",
        },
      ],
    },
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">
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
            Часто Задаваемые Вопросы
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Ответы на все ваши вопросы о HAORI VISION, UV искусстве и процессе
            заказа
          </p>
        </motion.div>

        {/* FAQ Categories */}
        {faqCategories.map((category, categoryIndex) => (
          <motion.div
            key={categoryIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="mb-12"
          >
            {/* Category Title */}
            <h2
              className={`text-2xl font-display font-bold mb-6 ${
                isUVMode ? "text-uv-cyan" : "text-white"
              }`}
            >
              {category.category}
            </h2>

            {/* Questions */}
            <div className="space-y-4">
              {category.questions.map((item, questionIndex) => {
                const isOpen =
                  openIndex === `${categoryIndex}-${questionIndex}`;

                return (
                  <motion.div
                    key={questionIndex}
                    className={`border rounded-lg transition-all ${
                      isUVMode
                        ? "border-uv-pink/30 bg-zinc-900/50"
                        : "border-zinc-800 bg-zinc-900/30"
                    }`}
                  >
                    {/* Question */}
                    <button
                      onClick={() =>
                        toggleQuestion(categoryIndex, questionIndex)
                      }
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <span
                        className={`text-lg font-semibold ${
                          isUVMode ? "text-white" : "text-white"
                        }`}
                      >
                        {item.question}
                      </span>
                      <motion.svg
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`w-6 h-6 flex-shrink-0 ml-4 ${
                          isUVMode ? "text-uv-pink" : "text-zinc-400"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </motion.svg>
                    </button>

                    {/* Answer */}
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center bg-zinc-900 rounded-lg p-12"
        >
          <h3
            className={`text-3xl font-display font-bold mb-4 ${
              isUVMode ? "gradient-text" : "text-white"
            }`}
          >
            Не нашли ответ?
          </h3>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Наша команда готова ответить на любые вопросы о произведениях
            искусства, индивидуальных заказах или процессе покупки.
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-12 py-5 rounded-full btn-gradient text-white text-lg font-semibold"
          >
            Связаться с Нами
          </motion.a>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <a
            href="/products"
            className={`p-6 rounded-lg border transition-colors ${
              isUVMode
                ? "border-uv-pink/30 hover:bg-uv-pink/10"
                : "border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <div className="text-3xl mb-3">🎨</div>
            <h4 className="text-white font-semibold mb-2">
              Посмотреть Каталог
            </h4>
            <p className="text-zinc-400 text-sm">
              Изучите все доступные работы
            </p>
          </a>

          <a
            href="/experience"
            className={`p-6 rounded-lg border transition-colors ${
              isUVMode
                ? "border-uv-pink/30 hover:bg-uv-pink/10"
                : "border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <div className="text-3xl mb-3">✨</div>
            <h4 className="text-white font-semibold mb-2">Процесс Создания</h4>
            <p className="text-zinc-400 text-sm">
              Как создаются UV произведения
            </p>
          </a>

          <a
            href="/about"
            className={`p-6 rounded-lg border transition-colors ${
              isUVMode
                ? "border-uv-pink/30 hover:bg-uv-pink/10"
                : "border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <div className="text-3xl mb-3">🌟</div>
            <h4 className="text-white font-semibold mb-2">
              О HIKARI Collective
            </h4>
            <p className="text-zinc-400 text-sm">Философия и команда</p>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
