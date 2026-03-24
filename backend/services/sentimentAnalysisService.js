import { ReviewSentiment } from "../models/Analytics.js";

/**
 * Sentiment Analysis Service
 * AI-powered emotion detection для отзывов
 */

class SentimentAnalysisService {
  constructor() {
    // Sentiment keywords для русского и английского
    this.positiveWords = [
      // English
      "amazing",
      "love",
      "beautiful",
      "perfect",
      "excellent",
      "awesome",
      "fantastic",
      "wonderful",
      "incredible",
      "stunning",
      "gorgeous",
      "brilliant",
      "outstanding",
      "great",
      "nice",
      "good",
      "happy",
      "impressed",
      "recommend",
      "best",
      // Russian
      "восхитительно",
      "обожаю",
      "красиво",
      "идеально",
      "отлично",
      "замечательно",
      "волшебно",
      "невероятно",
      "потрясающе",
      "шикарно",
      "люблю",
      "супер",
      "классно",
      "круто",
      "восторг",
      "влюблена",
      "магия",
      "счастлива",
    ];

    this.negativeWords = [
      // English
      "bad",
      "terrible",
      "awful",
      "horrible",
      "poor",
      "disappointing",
      "disappointed",
      "waste",
      "worst",
      "regret",
      "cheap",
      "ugly",
      "hate",
      "broken",
      "defective",
      // Russian
      "плохо",
      "ужасно",
      "разочарование",
      "разочарован",
      "жаль",
      "не понравилось",
      "не рекомендую",
      "худший",
      "отвратительно",
      "некачественно",
      "дешево",
    ];

    this.emotionKeywords = {
      joy: [
        "happy",
        "joy",
        "smile",
        "laugh",
        "fun",
        "радость",
        "счастье",
        "улыбка",
        "весело",
      ],
      love: [
        "love",
        "adore",
        "heart",
        "passion",
        "люблю",
        "обожаю",
        "сердце",
        "любовь",
      ],
      surprise: [
        "wow",
        "amazing",
        "surprised",
        "unexpected",
        "вау",
        "удивительно",
        "неожиданно",
      ],
      sadness: [
        "sad",
        "disappointed",
        "upset",
        "грустно",
        "расстроен",
        "печально",
      ],
      anger: ["angry", "furious", "mad", "hate", "злой", "ярость", "ненавижу"],
    };
  }

  /**
   * Анализировать sentiment текста
   */
  analyzeSentiment(text, rating = null) {
    if (!text) {
      return {
        score: 0,
        label: "neutral",
        emotions: {
          joy: 0,
          love: 0,
          surprise: 0,
          sadness: 0,
          anger: 0,
        },
      };
    }

    const lowerText = text.toLowerCase();

    // Count positive/negative words
    const positiveCount = this.positiveWords.filter((word) =>
      lowerText.includes(word),
    ).length;
    const negativeCount = this.negativeWords.filter((word) =>
      lowerText.includes(word),
    ).length;

    // Calculate base score from words
    let wordScore = 0;
    if (positiveCount + negativeCount > 0) {
      wordScore =
        (positiveCount - negativeCount) / (positiveCount + negativeCount);
    }

    // Adjust with rating if available
    let finalScore = wordScore;
    if (rating !== null) {
      const ratingScore = (rating - 3) / 2; // Convert 1-5 rating to -1 to 1
      finalScore = wordScore * 0.4 + ratingScore * 0.6; // Weight rating more
    }

    // Determine label
    let label = "neutral";
    if (finalScore > 0.2) {
      label = "positive";
    } else if (finalScore < -0.2) {
      label = "negative";
    }

    // Analyze emotions
    const emotions = this.analyzeEmotions(lowerText);

    return {
      score: parseFloat(finalScore.toFixed(2)),
      label: label,
      emotions: emotions,
    };
  }

  /**
   * Анализировать эмоции в тексте
   */
  analyzeEmotions(text) {
    const emotions = {
      joy: 0,
      love: 0,
      surprise: 0,
      sadness: 0,
      anger: 0,
    };

    Object.keys(this.emotionKeywords).forEach((emotion) => {
      const keywords = this.emotionKeywords[emotion];
      const count = keywords.filter((word) => text.includes(word)).length;
      emotions[emotion] = Math.min(count / 3, 1); // Normalize to 0-1
    });

    return emotions;
  }

  /**
   * Определить язык текста (упрощённо)
   */
  detectLanguage(text) {
    // Simple detection based on Cyrillic characters
    const cyrillicPattern = /[а-яА-ЯёЁ]/;
    return cyrillicPattern.test(text) ? "ru" : "en";
  }

  /**
   * Сохранить анализ отзыва
   */
  async analyzeAndSaveReview(reviewData) {
    try {
      const {
        reviewId,
        productId,
        clientId,
        text,
        rating,
        source = "website",
      } = reviewData;

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(text, rating);

      // Detect language
      const language = this.detectLanguage(text);

      // Save to database
      const review = new ReviewSentiment({
        reviewId: reviewId,
        productId: productId,
        clientId: clientId,
        text: text,
        rating: rating,
        sentiment: sentiment,
        language: language,
        source: source,
      });

      await review.save();

      console.log(
        `✅ Review sentiment analyzed: ${sentiment.label} (${sentiment.score})`,
      );

      return {
        success: true,
        sentiment: sentiment,
        reviewId: review._id,
      };
    } catch (error) {
      console.error("Analyze review error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch анализ отзывов
   */
  async batchAnalyzeReviews(reviews) {
    const results = [];

    for (const review of reviews) {
      const result = await this.analyzeAndSaveReview(review);
      results.push(result);
    }

    return {
      success: true,
      analyzed: results.filter((r) => r.success).length,
      total: reviews.length,
    };
  }

  /**
   * Получить sentiment статистику по продукту
   */
  async getProductSentiment(productId) {
    try {
      const reviews = await ReviewSentiment.find({ productId: productId });

      if (reviews.length === 0) {
        return {
          avgScore: 0,
          totalReviews: 0,
          distribution: { positive: 0, neutral: 0, negative: 0 },
          avgRating: 0,
        };
      }

      const avgScore =
        reviews.reduce((sum, r) => sum + r.sentiment.score, 0) / reviews.length;
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      const distribution = {
        positive: reviews.filter((r) => r.sentiment.label === "positive")
          .length,
        neutral: reviews.filter((r) => r.sentiment.label === "neutral").length,
        negative: reviews.filter((r) => r.sentiment.label === "negative")
          .length,
      };

      return {
        avgScore: avgScore.toFixed(2),
        avgRating: avgRating.toFixed(1),
        totalReviews: reviews.length,
        distribution: distribution,
      };
    } catch (error) {
      console.error("Get product sentiment error:", error);
      return null;
    }
  }

  /**
   * Получить топ позитивные отзывы
   */
  async getTopPositiveReviews(limit = 10) {
    try {
      const reviews = await ReviewSentiment.find({
        "sentiment.label": "positive",
      })
        .sort({ "sentiment.score": -1 })
        .limit(limit)
        .populate("productId")
        .populate("clientId");

      return reviews;
    } catch (error) {
      console.error("Get top positive reviews error:", error);
      return [];
    }
  }

  /**
   * Получить негативные отзывы (для обработки)
   */
  async getNegativeReviews() {
    try {
      const reviews = await ReviewSentiment.find({
        "sentiment.label": "negative",
      })
        .sort({ timestamp: -1 })
        .populate("productId")
        .populate("clientId");

      return reviews;
    } catch (error) {
      console.error("Get negative reviews error:", error);
      return [];
    }
  }

  /**
   * Получить emotion trends
   */
  async getEmotionTrends(productId = null) {
    try {
      const query = productId ? { productId: productId } : {};
      const reviews = await ReviewSentiment.find(query);

      if (reviews.length === 0) {
        return {
          joy: 0,
          love: 0,
          surprise: 0,
          sadness: 0,
          anger: 0,
        };
      }

      const emotionSums = {
        joy: 0,
        love: 0,
        surprise: 0,
        sadness: 0,
        anger: 0,
      };

      reviews.forEach((review) => {
        Object.keys(emotionSums).forEach((emotion) => {
          emotionSums[emotion] += review.sentiment.emotions[emotion] || 0;
        });
      });

      const avgEmotions = {};
      Object.keys(emotionSums).forEach((emotion) => {
        avgEmotions[emotion] = (emotionSums[emotion] / reviews.length).toFixed(
          2,
        );
      });

      return avgEmotions;
    } catch (error) {
      console.error("Get emotion trends error:", error);
      return null;
    }
  }
}

export default new SentimentAnalysisService();
