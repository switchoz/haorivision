/**
 * Intent Recognizer для AI Sales Assistant
 * Определяет намерение клиента на основе его сообщения
 */

const INTENTS = {
  GREETING: "greeting",
  INSPIRATION: "inspiration",
  PURCHASE: "purchase",
  BESPOKE: "bespoke",
  QUESTION: "question",
  UPGRADE_RITUAL: "upgrade_ritual",
  CONSULTATION: "consultation",
  PRICE: "price",
  DELIVERY: "delivery",
  NFT: "nft",
};

class IntentRecognizer {
  constructor() {
    this.patterns = {
      [INTENTS.GREETING]: [
        /^(привет|здравствуй|добрый|hello|hi|hey)/i,
        /как дела/i,
        /расскаж.*себе/i,
      ],
      [INTENTS.INSPIRATION]: [
        /вдохновени/i,
        /история/i,
        /философия/i,
        /идея/i,
        /смысл/i,
        /почему.*создали/i,
        /что.*означает/i,
        /расскаж.*коллекц/i,
      ],
      [INTENTS.PURCHASE]: [
        /купить/i,
        /заказать/i,
        /хочу.*хаори/i,
        /цена/i,
        /стоимость/i,
        /сколько стоит/i,
        /где купить/i,
        /как приобрести/i,
        /в наличии/i,
        /есть в продаже/i,
        /buy/i,
        /purchase/i,
        /available/i,
      ],
      [INTENTS.BESPOKE]: [
        /индивидуал/i,
        /заказ.*индивидуал/i,
        /своё.*хаори/i,
        /уникальн/i,
        /персональн/i,
        /bespoke/i,
        /custom/i,
        /на заказ/i,
        /хочу.*свой.*дизайн/i,
      ],
      [INTENTS.QUESTION]: [
        /что такое/i,
        /как.*работает/i,
        /почему/i,
        /зачем/i,
        /можно.*узнать/i,
        /расскажи/i,
      ],
      [INTENTS.UPGRADE_RITUAL]: [
        /пара/i,
        /хаори.*картина/i,
        /комплект/i,
        /upgrade/i,
        /ritual/i,
        /две вещи/i,
        /хаори.*и.*арт/i,
      ],
      [INTENTS.CONSULTATION]: [
        /консультаци/i,
        /встреча/i,
        /поговорить.*художник/i,
        /видео.*звонок/i,
        /записаться/i,
        /appointment/i,
        /meeting/i,
        /видеоконсультаци/i,
      ],
      [INTENTS.PRICE]: [
        /цена/i,
        /стоимость/i,
        /сколько/i,
        /price/i,
        /cost/i,
        /дорого/i,
        /дёшево/i,
      ],
      [INTENTS.DELIVERY]: [
        /доставка/i,
        /shipping/i,
        /когда получу/i,
        /сколько.*ждать/i,
        /срок/i,
        /отправка/i,
        /курьер/i,
      ],
      [INTENTS.NFT]: [
        /nft/i,
        /сертификат/i,
        /blockchain/i,
        /opensea/i,
        /цифровой/i,
        /токен/i,
        /крипто/i,
      ],
    };
  }

  /**
   * Определить намерение из сообщения
   */
  recognize(message) {
    const normalizedMessage = message.toLowerCase().trim();

    // Проверить каждый intent
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          return {
            intent: intent,
            confidence: this.calculateConfidence(normalizedMessage, patterns),
            entities: this.extractEntities(normalizedMessage, intent),
          };
        }
      }
    }

    // Default intent
    return {
      intent: INTENTS.QUESTION,
      confidence: 0.5,
      entities: {},
    };
  }

  /**
   * Вычислить уверенность в намерении
   */
  calculateConfidence(message, patterns) {
    let matchCount = 0;

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matchCount++;
      }
    }

    return Math.min(0.5 + matchCount * 0.25, 1.0);
  }

  /**
   * Извлечь сущности из сообщения
   */
  extractEntities(message, intent) {
    const entities = {};

    // Извлечь цвета
    const colors = this.extractColors(message);
    if (colors.length > 0) {
      entities.colors = colors;
    }

    // Извлечь коллекции
    const collection = this.extractCollection(message);
    if (collection) {
      entities.collection = collection;
    }

    // Извлечь бюджет
    const budget = this.extractBudget(message);
    if (budget) {
      entities.budget = budget;
    }

    // Извлечь стиль/энергию
    const style = this.extractStyle(message);
    if (style) {
      entities.style = style;
    }

    return entities;
  }

  /**
   * Извлечь цвета из сообщения
   */
  extractColors(message) {
    const colorPatterns = {
      purple: /фиолетов|purple|violet|сиреневый/i,
      blue: /синий|blue|голубой|azure/i,
      pink: /розовый|pink|пурпурный/i,
      green: /зелёный|green|изумрудный/i,
      yellow: /жёлтый|yellow|золотой/i,
      orange: /оранжевый|orange/i,
      red: /красный|red|алый/i,
      white: /белый|white/i,
      neon: /неон|neon|флуо|fluor/i,
    };

    const found = [];
    for (const [color, pattern] of Object.entries(colorPatterns)) {
      if (pattern.test(message)) {
        found.push(color);
      }
    }

    return found;
  }

  /**
   * Извлечь коллекцию
   */
  extractCollection(message) {
    const collections = {
      "Mycelium Dreams": /mycelium|мицели|грибн/i,
      "Void Bloom": /void|bloom|космос|цвет.*пустот/i,
      "Neon Ancestors": /neon|ancestor|предки|неон.*предк/i,
      "Twin Souls": /twin|soul|близнец|душ/i,
    };

    for (const [name, pattern] of Object.entries(collections)) {
      if (pattern.test(message)) {
        return name;
      }
    }

    return null;
  }

  /**
   * Извлечь бюджет из сообщения
   */
  extractBudget(message) {
    // Ищем числа
    const priceMatch = message.match(/(\d+)\s*[$€₽]/);
    if (priceMatch) {
      return parseInt(priceMatch[1]);
    }

    // Ищем диапазоны
    const rangeMatch = message.match(/до\s*(\d+)/i);
    if (rangeMatch) {
      return { max: parseInt(rangeMatch[1]) };
    }

    // Категории бюджета
    if (/дорог|premium|люкс|luxury/i.test(message)) {
      return { category: "premium" };
    }
    if (/недорог|бюджет|доступн|affordable/i.test(message)) {
      return { category: "affordable" };
    }

    return null;
  }

  /**
   * Извлечь стиль/энергию
   */
  extractStyle(message) {
    const styles = {
      minimalist: /минимализм|простой|минималист|clean/i,
      bold: /яркий|смелый|bold|bright|выразительн/i,
      organic: /органич|природн|natural|биоморф/i,
      cosmic: /космич|cosmic|звёзд|галактик/i,
      mystical: /мистич|мистик|mystical|духовн/i,
      energetic: /энергичн|энерги|энергия|dynamic/i,
    };

    for (const [style, pattern] of Object.entries(styles)) {
      if (pattern.test(message)) {
        return style;
      }
    }

    return null;
  }

  /**
   * Получить все возможные intents
   */
  getAllIntents() {
    return INTENTS;
  }
}

export default new IntentRecognizer();
export { INTENTS };
