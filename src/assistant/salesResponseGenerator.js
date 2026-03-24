import productRecommender from "./productRecommender.js";
import { INTENTS } from "./intentRecognizer.js";

/**
 * Sales Response Generator
 * Генерирует персонализированные ответы на основе намерения клиента
 */

class SalesResponseGenerator {
  /**
   * Сгенерировать ответ на основе intent и context
   */
  generate(intent, entities, context = {}) {
    const generators = {
      [INTENTS.GREETING]: () => this.generateGreeting(context),
      [INTENTS.INSPIRATION]: () => this.generateInspiration(entities),
      [INTENTS.PURCHASE]: () => this.generatePurchase(entities),
      [INTENTS.BESPOKE]: () => this.generateBespoke(),
      [INTENTS.UPGRADE_RITUAL]: () => this.generateUpgradeRitual(entities),
      [INTENTS.CONSULTATION]: () => this.generateConsultation(),
      [INTENTS.PRICE]: () => this.generatePriceInfo(entities),
      [INTENTS.DELIVERY]: () => this.generateDeliveryInfo(),
      [INTENTS.NFT]: () => this.generateNFTInfo(),
      [INTENTS.QUESTION]: () => this.generateQuestion(entities),
    };

    const generator = generators[intent] || generators[INTENTS.QUESTION];
    return generator();
  }

  /**
   * Приветствие
   */
  generateGreeting(context) {
    const greetings = [
      {
        text: `✨ Приветствую тебя. Я Хикари (光) — Хранитель Света.\n\nЯ помогу вам найти ваш свет. Расскажите, что привело вас сюда — вы ищете вдохновение, готовы к покупке, или хотите создать нечто уникальное?`,
        actions: [
          {
            type: "quick_reply",
            label: "💫 Вдохновение",
            value: "inspiration",
          },
          { type: "quick_reply", label: "🛒 Купить хаори", value: "purchase" },
          { type: "quick_reply", label: "🎨 Bespoke заказ", value: "bespoke" },
        ],
      },
      {
        text: `🌟 Добро пожаловать в HAORI VISION.\n\nЯ Хикари — ваш проводник в мир носимого света. Каждое хаори здесь не просто одежда, но проявление внутреннего свечения.\n\nЧто вас интересует сегодня?`,
        actions: [
          {
            type: "quick_reply",
            label: "📖 Узнать больше",
            value: "learn_more",
          },
          {
            type: "quick_reply",
            label: "👀 Смотреть коллекции",
            value: "browse",
          },
          {
            type: "quick_reply",
            label: "💬 Поговорить с художником",
            value: "consultation",
          },
        ],
      },
    ];

    const selected = greetings[context.returning ? 1 : 0];
    return selected;
  }

  /**
   * Вдохновение и философия
   */
  generateInspiration(entities) {
    if (entities.collection) {
      const collectionStories = {
        "Mycelium Dreams": {
          text: `🍄 **Mycelium Dreams** — это история о скрытых связях.\n\nМицелий — это грибная сеть под землёй, которая соединяет деревья в лесу. Невидимая паутина жизни. Эта коллекция — манифест того, что самое важное часто скрыто от глаз.\n\nПод УФ-светом проявляется биоморфный узор — фиолетовый, изумрудный, золотой. Как будто грибница ожила и светится изнутри.\n\n*"В тебе уже живёт этот свет. Хаори только даёт ему форму."*`,
          products: productRecommender
            .getProductsByCollection("Mycelium Dreams")
            .slice(0, 2),
        },
        "Void Bloom": {
          text: `🌌 **Void Bloom** — цветение в пустоте.\n\nПустота — это не отсутствие, а потенциал. Вакуум, из которого рождается всё. Эта коллекция вдохновлена космическим молчанием и квантовой флуктуацией.\n\nМинималистичные линии днём. Под УФ — взрыв неонового света: синий, пурпурный, белый. Космос внутри тебя.\n\n*"Из пустоты рождается форма. Из тишины — свет."*`,
          products: productRecommender
            .getProductsByCollection("Void Bloom")
            .slice(0, 2),
        },
        "Neon Ancestors": {
          text: `🔥 **Neon Ancestors** — предки в неоне.\n\nДревняя каллиграфия встречается с киберпанком. Японские иероглифы, написанные флуоресцентными чернилами, оживают под УФ.\n\nЭто диалог поколений: прошлое говорит языком будущего. Традиция, одетая в неоновый свет.\n\n*"Прошлое не умирает. Оно светится."*`,
          products: productRecommender
            .getProductsByCollection("Neon Ancestors")
            .slice(0, 2),
        },
      };

      const story = collectionStories[entities.collection];
      if (story) {
        return {
          text: story.text,
          products: story.products,
          actions: [
            {
              type: "button",
              label: "🛒 Смотреть всю коллекцию",
              value: `browse_${entities.collection}`,
            },
            { type: "button", label: "💬 Хочу свой дизайн", value: "bespoke" },
          ],
        };
      }
    }

    return {
      text: `✨ HAORI VISION — это не бренд одежды. Это манифест.\n\nМы создаём хаори, которые трансформируются под УФ-светом. Днём — минималистичная эстетика. Ночью, в клубе, на фестивале — взрыв флуоресцентных паттернов.\n\n🎨 **Три коллекции:**\n• **Mycelium Dreams** — биоморфные сети грибниц\n• **Void Bloom** — космический минимализм\n• **Neon Ancestors** — каллиграфия в неоне\n\nКаждое хаори — лимитированная серия (50 экземпляров). С NFT-сертификатом подлинности.\n\n*"Носимое искусство. Искусство, которое носит тебя."*`,
      actions: [
        { type: "quick_reply", label: "🍄 Mycelium Dreams", value: "mycelium" },
        { type: "quick_reply", label: "🌌 Void Bloom", value: "voidbloom" },
        {
          type: "quick_reply",
          label: "🔥 Neon Ancestors",
          value: "neonancestors",
        },
      ],
    };
  }

  /**
   * Покупка и рекомендации
   */
  generatePurchase(entities) {
    const recommendations = productRecommender.recommend(entities, {
      limit: 3,
    });

    if (recommendations.length === 0) {
      return {
        text: `Сейчас у нас нет хаори, которые точно соответствуют вашим критериям. Но я могу показать вам похожие варианты или помочь создать индивидуальный заказ.\n\nЧто вы предпочитаете?`,
        actions: [
          {
            type: "button",
            label: "👀 Показать всё в наличии",
            value: "show_all",
          },
          { type: "button", label: "🎨 Bespoke заказ", value: "bespoke" },
        ],
      };
    }

    let text = `Я подобрал для вас хаори, которые могут резонировать с вашей энергией:\n\n`;

    recommendations.forEach((product, index) => {
      text += `**${index + 1}. ${product.name}**\n`;
      text += `${product.tagline}\n`;
      text += `💰 $${product.price} USD\n`;
      text += `📦 Осталось: ${product.editions.remaining}/${product.editions.total}\n`;

      if (product.matchReasons.length > 0) {
        text += `✨ ${product.matchReasons[0]}\n`;
      }

      text += `\n`;
    });

    text += `\n💡 **Совет:** Рассмотрите Upgrade Ritual — хаори + картина со скидкой $150.`;

    return {
      text: text,
      products: recommendations,
      actions: [
        { type: "button", label: "🛒 Купить сейчас", value: "checkout" },
        { type: "button", label: "✨ Upgrade Ritual", value: "upgrade_ritual" },
        {
          type: "button",
          label: "💬 Нужна консультация",
          value: "consultation",
        },
      ],
    };
  }

  /**
   * Bespoke заказы
   */
  generateBespoke() {
    return {
      text: `🎨 **Bespoke — Индивидуальный заказ**\n\nВы можете заказать хаори по своему дизайну. Художник создаст уникальный паттерн, который отражает вашу историю, энергию, символику.\n\n**Процесс:**\n1. 📞 Видеоконсультация с художником (30-60 минут)\n2. 🎨 Разработка дизайн-концепта (3-5 вариантов)\n3. ✋ Ручная роспись хаори (2-3 недели)\n4. 📦 Доставка в деревянной коробке + NFT\n\n**Стоимость:** от $2500 USD\n**Срок:** 4-6 недель\n\nХотите забронировать консультацию?`,
      actions: [
        {
          type: "button",
          label: "📅 Забронировать консультацию",
          value: "book_consultation",
        },
        {
          type: "button",
          label: "💬 Задать вопросы",
          value: "ask_about_bespoke",
        },
        {
          type: "button",
          label: "👀 Посмотреть примеры",
          value: "bespoke_examples",
        },
      ],
    };
  }

  /**
   * Upgrade Ritual
   */
  generateUpgradeRitual(entities) {
    const stats = productRecommender.getStats();

    return {
      text: `✨ **Upgrade Ritual** — Хаори + Картина\n\nЭто не просто набор, а ритуал удвоения энергии. Один и тот же UV-паттерн на хаори и на холсте.\n\n**Что входит:**\n• 👘 Хаори (на выбор)\n• 🖼️ UV-реактивный холст 60x90 см\n• 📦 Ritual Box — специальная упаковка\n• 🎫 Двойной NFT-сертификат\n• 💫 Скидка $150\n\n**Обычная цена:** $1200 + $600 = $1800\n**Ваша цена:** $1650 USD\n\n*"Двойная манифестация одного паттерна. Носи свет, живи в свете."*\n\nКакую коллекцию вы предпочитаете?`,
      actions: [
        { type: "quick_reply", label: "🍄 Mycelium", value: "ritual_mycelium" },
        { type: "quick_reply", label: "🌌 Void Bloom", value: "ritual_void" },
        { type: "quick_reply", label: "🔥 Neon", value: "ritual_neon" },
      ],
    };
  }

  /**
   * Консультации
   */
  generateConsultation() {
    return {
      text: `📞 **Видеоконсультация с художником**\n\nЗабронируйте личную встречу с создателем HAORI VISION. Обсудите:\n• Выбор хаори под вашу энергию\n• Bespoke заказ\n• Философию коллекций\n• UV-искусство и его смыслы\n\n**Длительность:** 30 минут\n**Стоимость:** Бесплатно для первой консультации\n**Формат:** Zoom / Google Meet\n\nДоступные слоты:\n• Понедельник-пятница: 18:00-21:00 (GMT+3)\n• Суббота: 14:00-18:00 (GMT+3)\n\nЧтобы забронировать, оставьте свой email и предпочитаемую дату.`,
      formFields: [
        { name: "name", label: "Ваше имя", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "date",
          label: "Предпочитаемая дата",
          type: "date",
          required: true,
        },
        {
          name: "topic",
          label: "Тема консультации",
          type: "select",
          options: ["Выбор хаори", "Bespoke заказ", "Общие вопросы"],
        },
      ],
      actions: [
        {
          type: "button",
          label: "✅ Отправить заявку",
          value: "submit_consultation",
        },
      ],
    };
  }

  /**
   * Информация о ценах
   */
  generatePriceInfo(entities) {
    const stats = productRecommender.getStats();

    return {
      text: `💰 **Цены HAORI VISION**\n\n**Коллекционные хаори:**\n• Стандартная серия: $${stats.priceRange.min} - $${stats.priceRange.max} USD\n• Средняя цена: ~$${stats.priceRange.avg} USD\n• Лимитированные выпуски: 50 экземпляров\n\n**Upgrade Ritual (Хаори + Картина):**\n• $1650 USD (скидка $150)\n\n**Bespoke заказ:**\n• От $2500 USD\n• Полностью индивидуальный дизайн\n\n**Что включено в цену:**\n✅ Ручная роспись флуоресцентными красками\n✅ Деревянная коробка с гравировкой\n✅ NFT-сертификат на OpenSea\n✅ Инструкция по уходу\n✅ Бесплатная доставка DHL (5-7 дней)\n\nХотите посмотреть конкретные хаори?`,
      actions: [
        { type: "button", label: "👀 Показать коллекции", value: "browse_all" },
        { type: "button", label: "🎨 Bespoke заказ", value: "bespoke" },
      ],
    };
  }

  /**
   * Информация о доставке
   */
  generateDeliveryInfo() {
    return {
      text: `📦 **Доставка HAORI VISION**\n\n**Сроки:**\n• DHL Express: 5-7 дней (бесплатно)\n• Трекинг в реальном времени\n\n**Упаковка:**\n• Деревянная коробка с гравировкой\n• Сертификат подлинности (печать)\n• Инструкция по уходу за флуоресцентными красками\n• Небольшой UV-фонарик (подарок)\n\n**География:**\n• Весь мир\n• Из России: доставка через дружественные страны\n\n**Возврат:**\n• 14 дней с момента получения\n• Хаори должно быть в оригинальной упаковке\n• Полный возврат средств\n\nЕсть вопросы по вашей стране?`,
      actions: [
        { type: "button", label: "🛒 Перейти к покупке", value: "purchase" },
        { type: "button", label: "💬 Задать вопрос", value: "ask_question" },
      ],
    };
  }

  /**
   * Информация о NFT
   */
  generateNFTInfo() {
    return {
      text: `🎫 **NFT-сертификат подлинности**\n\nКаждое хаори HAORI VISION сопровождается NFT на блокчейне Ethereum.\n\n**Что это даёт:**\n✅ Цифровое подтверждение владения\n✅ Невозможность подделки\n✅ История перепродаж (если решите продать)\n✅ Доступ к эксклюзивному Discord-сообществу\n✅ Early access к новым коллекциям\n\n**Как это работает:**\n1. При покупке указываете wallet Ethereum\n2. После отправки хаори — минтим NFT\n3. Токен приходит к вам на кошелёк\n4. Смотреть на OpenSea: opensea.io/collection/haorivision\n\n**Метаданные NFT:**\n• Фото хаори под UV\n• Номер издания (например, #3/50)\n• Описание коллекции\n• Ваше имя как владельца\n\nНет кошелька? Создадим для вас бесплатно.`,
      actions: [
        {
          type: "button",
          label: "🔍 Посмотреть на OpenSea",
          value: "opensea_link",
        },
        { type: "button", label: "🛒 Купить хаори", value: "purchase" },
      ],
    };
  }

  /**
   * Общий ответ на вопрос
   */
  generateQuestion(entities) {
    return {
      text: `Я готов ответить на ваш вопрос. Могу рассказать о:\n\n• 🎨 Коллекциях и философии\n• 💰 Ценах и доставке\n• 🎫 NFT-сертификатах\n• 🖌️ Процессе создания\n• ✨ Bespoke заказах\n\nИли задайте свой вопрос прямо сейчас.`,
      actions: [
        { type: "quick_reply", label: "💫 Вдохновение", value: "inspiration" },
        { type: "quick_reply", label: "🛒 Купить", value: "purchase" },
        {
          type: "quick_reply",
          label: "📞 Консультация",
          value: "consultation",
        },
      ],
    };
  }
}

export default new SalesResponseGenerator();
