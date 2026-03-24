import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Product Recommender
 * Рекомендует хаори на основе предпочтений клиента
 */

class ProductRecommender {
  constructor() {
    this.products = this.loadProducts();
  }

  /**
   * Загрузить продукты из collections.json
   */
  loadProducts() {
    try {
      const collectionsPath = path.join(
        __dirname,
        "../../data/products/collections.json",
      );
      const data = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
      return data.products || [];
    } catch (error) {
      console.error("Error loading products:", error);
      return [];
    }
  }

  /**
   * Получить рекомендации на основе entities
   */
  recommend(entities, options = {}) {
    const { limit = 3, sortBy = "relevance" } = options;

    let candidates = [...this.products];

    // Фильтровать по коллекции
    if (entities.collection) {
      candidates = candidates.filter(
        (p) => p.collection === entities.collection,
      );
    }

    // Фильтровать по цветам
    if (entities.colors && entities.colors.length > 0) {
      candidates = candidates
        .map((p) => ({
          ...p,
          colorMatch: this.calculateColorMatch(p, entities.colors),
        }))
        .filter((p) => p.colorMatch > 0);
    }

    // Фильтровать по бюджету
    if (entities.budget) {
      candidates = this.filterByBudget(candidates, entities.budget);
    }

    // Фильтровать по стилю
    if (entities.style) {
      candidates = candidates.map((p) => ({
        ...p,
        styleMatch: this.calculateStyleMatch(p, entities.style),
      }));
    }

    // Вычислить relevance score
    candidates = candidates.map((p) => ({
      ...p,
      relevanceScore: this.calculateRelevance(p, entities),
    }));

    // Сортировать
    if (sortBy === "relevance") {
      candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === "price") {
      candidates.sort((a, b) => a.price - b.price);
    } else if (sortBy === "availability") {
      candidates.sort((a, b) => b.editions.remaining - a.editions.remaining);
    }

    // Вернуть топ N
    return candidates.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      collection: p.collection,
      price: p.price,
      tagline: p.tagline,
      uvColors: p.uvColors,
      images: p.images,
      editions: p.editions,
      relevanceScore: p.relevanceScore,
      matchReasons: this.getMatchReasons(p, entities),
    }));
  }

  /**
   * Вычислить совпадение цветов
   */
  calculateColorMatch(product, targetColors) {
    if (!product.uvColors || product.uvColors.length === 0) {
      return 0;
    }

    const productColors = product.uvColors.map((c) => c.toLowerCase());
    let matchCount = 0;

    for (const targetColor of targetColors) {
      for (const productColor of productColors) {
        if (
          productColor.includes(targetColor) ||
          targetColor.includes(productColor)
        ) {
          matchCount++;
        }
      }
    }

    return matchCount / targetColors.length;
  }

  /**
   * Фильтровать по бюджету
   */
  filterByBudget(products, budget) {
    if (typeof budget === "number") {
      return products.filter((p) => p.price <= budget);
    }

    if (budget.max) {
      return products.filter((p) => p.price <= budget.max);
    }

    if (budget.category === "premium") {
      return products.filter((p) => p.price >= 1500);
    }

    if (budget.category === "affordable") {
      return products.filter((p) => p.price <= 1200);
    }

    return products;
  }

  /**
   * Вычислить совпадение стиля
   */
  calculateStyleMatch(product, targetStyle) {
    const styleMap = {
      minimalist: ["Void Bloom"],
      bold: ["Neon Ancestors"],
      organic: ["Mycelium Dreams"],
      cosmic: ["Void Bloom"],
      mystical: ["Mycelium Dreams", "Void Bloom"],
      energetic: ["Neon Ancestors"],
    };

    const matchingCollections = styleMap[targetStyle] || [];
    return matchingCollections.includes(product.collection) ? 1 : 0.3;
  }

  /**
   * Вычислить общий relevance score
   */
  calculateRelevance(product, entities) {
    let score = 0;

    // Базовый score от наличия в стоке
    if (product.editions.remaining > 0) {
      score += 1;
    }

    // Bonus за совпадение коллекции
    if (entities.collection && product.collection === entities.collection) {
      score += 2;
    }

    // Bonus за совпадение цветов
    if (product.colorMatch) {
      score += product.colorMatch * 1.5;
    }

    // Bonus за совпадение стиля
    if (product.styleMatch) {
      score += product.styleMatch;
    }

    // Penalty за высокую цену (если есть budget constraint)
    if (entities.budget && typeof entities.budget === "number") {
      const priceDiff = Math.abs(product.price - entities.budget);
      score -= priceDiff / 1000;
    }

    return Math.max(score, 0);
  }

  /**
   * Получить причины совпадения
   */
  getMatchReasons(product, entities) {
    const reasons = [];

    if (entities.collection && product.collection === entities.collection) {
      reasons.push(`Из коллекции "${entities.collection}"`);
    }

    if (entities.colors && entities.colors.length > 0) {
      const matchingColors = entities.colors.filter((c) =>
        product.uvColors.some((pc) => pc.toLowerCase().includes(c)),
      );
      if (matchingColors.length > 0) {
        reasons.push(`Содержит цвета: ${matchingColors.join(", ")}`);
      }
    }

    if (entities.style) {
      reasons.push(`Подходит под стиль: ${entities.style}`);
    }

    if (product.editions.remaining <= 3) {
      reasons.push(
        `⚡ Осталось всего ${product.editions.remaining} из ${product.editions.total}`,
      );
    }

    return reasons;
  }

  /**
   * Получить продукт по ID
   */
  getProductById(productId) {
    return this.products.find((p) => p.id === productId);
  }

  /**
   * Получить все продукты коллекции
   */
  getProductsByCollection(collectionName) {
    return this.products.filter((p) => p.collection === collectionName);
  }

  /**
   * Получить продукты для Upgrade Ritual
   * Возвращает пару: хаори + matching art print
   */
  getUpgradeRitualPair(haoriId) {
    const haori = this.getProductById(haoriId);
    if (!haori) return null;

    // В будущем здесь будет логика подбора картины
    // Пока возвращаем концепт
    return {
      haori: haori,
      artPrint: {
        id: `print-${haori.id}`,
        name: `${haori.name} — Art Print`,
        type: "UV Reactive Canvas",
        size: "60x90 cm",
        price: 600,
        description: `Оригинальный принт паттерна с хаори ${haori.name}`,
        image: haori.images.uv.hero,
      },
      totalPrice: haori.price + 600,
      discount: 150,
      finalPrice: haori.price + 600 - 150,
      benefits: [
        "💫 Скидка $150 на комплект",
        "🎨 Единый UV-паттерн для хаори и картины",
        "📦 Специальная упаковка Ritual Box",
        "✨ Двойная энергия одного дизайна",
      ],
    };
  }

  /**
   * Получить похожие продукты
   */
  getSimilarProducts(productId, limit = 3) {
    const product = this.getProductById(productId);
    if (!product) return [];

    // Создать entities из продукта
    const entities = {
      collection: product.collection,
      colors: product.uvColors.map((c) => c.toLowerCase()),
      style: this.inferStyleFromProduct(product),
    };

    // Получить рекомендации, исключая сам продукт
    return this.recommend(entities, { limit: limit + 1 })
      .filter((p) => p.id !== productId)
      .slice(0, limit);
  }

  /**
   * Вывести стиль из продукта
   */
  inferStyleFromProduct(product) {
    const collectionStyles = {
      "Mycelium Dreams": "organic",
      "Void Bloom": "minimalist",
      "Neon Ancestors": "bold",
    };

    return collectionStyles[product.collection] || "mystical";
  }

  /**
   * Получить статистику продуктов
   */
  getStats() {
    return {
      total: this.products.length,
      available: this.products.filter((p) => p.editions.remaining > 0).length,
      soldOut: this.products.filter((p) => p.editions.remaining === 0).length,
      collections: [...new Set(this.products.map((p) => p.collection))],
      priceRange: {
        min: Math.min(...this.products.map((p) => p.price)),
        max: Math.max(...this.products.map((p) => p.price)),
        avg: Math.round(
          this.products.reduce((sum, p) => sum + p.price, 0) /
            this.products.length,
        ),
      },
    };
  }
}

export default new ProductRecommender();
