import Anthropic from "@anthropic-ai/sdk";

/**
 * Brand Analysis Service
 * Анализирует HAORI VISION по 3 уровням против мировых лидеров
 */

class BrandAnalysisService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Референсные бренды для сравнения
    this.benchmarkBrands = {
      techArt: {
        name: "Runway AI",
        strengths: [
          "Cutting-edge AI technology",
          "Clean minimalist UI/UX",
          "Creator-first approach",
          "Viral marketing campaigns",
          "Strong community engagement",
        ],
        metrics: {
          brandRecognition: 9.2,
          technicalExecution: 9.8,
          userExperience: 9.5,
          viralPotential: 9.0,
          emotionalConnection: 8.5,
        },
      },
      luxuryFashion: {
        name: "Balenciaga",
        strengths: [
          "Bold experimental designs",
          "High fashion prestige",
          "Controversial marketing (attention-grabbing)",
          "Celebrity endorsements",
          "Luxury pricing psychology",
        ],
        metrics: {
          brandRecognition: 9.8,
          technicalExecution: 9.0,
          userExperience: 8.5,
          viralPotential: 9.5,
          emotionalConnection: 9.0,
        },
      },
      viralArt: {
        name: "MSCHF",
        strengths: [
          "Shock value and controversy",
          "Limited drops create scarcity",
          "Masterful social media strategy",
          "Blurs art/commerce/activism",
          "Gen-Z language and humor",
        ],
        metrics: {
          brandRecognition: 8.5,
          technicalExecution: 8.0,
          userExperience: 8.8,
          viralPotential: 10.0,
          emotionalConnection: 9.2,
        },
      },
    };

    // Критерии оценки HAORI VISION
    this.evaluationCriteria = {
      level1_foundation: {
        technicalExecution: [
          "Website performance (load time, animations)",
          "NFT integration stability",
          "AI assistant intelligence",
          "E-commerce flow smoothness",
          "Mobile responsiveness",
        ],
        brandIdentity: [
          "Visual consistency",
          "Tone of voice uniqueness",
          "Story clarity",
          "UV concept execution",
          "Artist persona strength",
        ],
        userExperience: [
          "Navigation intuitiveness",
          "Checkout simplicity",
          "Customer support quality",
          "Packaging experience",
          "Post-purchase journey",
        ],
      },
      level2_emotional: {
        storytelling: [
          "Origin story power",
          "Product narratives",
          "Customer testimonials impact",
          "Social proof strength",
          "Community building",
        ],
        adaptation: [
          "TikTok/Reels readiness",
          "Trend integration speed",
          "Influencer appeal",
          "Meme potential",
          "Viral content creation",
        ],
        customerJourney: [
          "First impression impact",
          "Discovery excitement",
          "Purchase confidence",
          "Unboxing wow-factor",
          "Brand loyalty triggers",
        ],
      },
      level3_innovation: {
        techLeadership: [
          "AI moodboard generation",
          "Blockchain integration",
          "Analytics sophistication",
          "Automation level",
          "Future-ready architecture",
        ],
        culturalRelevance: [
          "Gen-Z appeal",
          "Sustainability messaging",
          "Inclusivity",
          "Art world recognition",
          "Fashion industry positioning",
        ],
        marketDisruption: [
          "Unique value proposition",
          "Competition differentiation",
          "Price innovation",
          "Distribution novelty",
          "Brand philosophy boldness",
        ],
      },
    };
  }

  /**
   * Полный анализ бренда HAORI VISION
   */
  async analyzeBrand(currentMetrics = {}) {
    try {
      console.log("🔍 Starting comprehensive brand analysis...");

      // 1. Технический анализ
      const technicalAnalysis =
        await this.analyzeTechnicalExecution(currentMetrics);

      // 2. Эмоциональный анализ
      const emotionalAnalysis =
        await this.analyzeEmotionalImpact(currentMetrics);

      // 3. Инновационный анализ
      const innovationAnalysis = await this.analyzeInnovation(currentMetrics);

      // 4. Бенчмарк против конкурентов
      const benchmarkAnalysis = await this.benchmarkAgainstLeaders(
        technicalAnalysis,
        emotionalAnalysis,
        innovationAnalysis,
      );

      // 5. AI insights и рекомендации
      const aiInsights = await this.generateAIInsights({
        technicalAnalysis,
        emotionalAnalysis,
        innovationAnalysis,
        benchmarkAnalysis,
      });

      // 6. Общая оценка
      const overallScore = this.calculateOverallScore({
        technicalAnalysis,
        emotionalAnalysis,
        innovationAnalysis,
      });

      // 7. Gap analysis
      const gaps = this.identifyGaps(benchmarkAnalysis);

      // 8. Приоритетные действия
      const actionPlan = await this.generateActionPlan(gaps, aiInsights);

      return {
        success: true,
        analysis: {
          timestamp: new Date(),
          overallScore,
          technicalAnalysis,
          emotionalAnalysis,
          innovationAnalysis,
          benchmarkAnalysis,
          gaps,
          aiInsights,
          actionPlan,
        },
      };
    } catch (error) {
      console.error("Brand analysis error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Level 1: Технический анализ
   */
  async analyzeTechnicalExecution(metrics) {
    const scores = {
      websitePerformance: this.scoreWebsitePerformance(metrics),
      nftIntegration: this.scoreNFTIntegration(metrics),
      aiAssistant: this.scoreAIAssistant(metrics),
      ecommerce: this.scoreEcommerce(metrics),
      mobileExperience: this.scoreMobileExperience(metrics),
    };

    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s, 0) /
      Object.keys(scores).length;

    return {
      category: "Technical Execution",
      level: 1,
      scores,
      averageScore: avgScore,
      grade: this.getGrade(avgScore),
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores),
    };
  }

  scoreWebsitePerformance(metrics) {
    const loadTime = metrics.loadTime || 2000; // ms
    const animationSmoothness = metrics.animationSmoothness || 7;
    const responsiveness = metrics.responsiveness || 8;

    let score = 10;

    // Penalize slow load times
    if (loadTime > 3000) score -= 3;
    else if (loadTime > 2000) score -= 1.5;
    else if (loadTime < 1000) score += 0.5;

    // Animation smoothness (1-10)
    score += (animationSmoothness - 7) * 0.3;

    // Responsiveness (1-10)
    score += (responsiveness - 7) * 0.2;

    return Math.max(0, Math.min(10, score));
  }

  scoreNFTIntegration(metrics) {
    const mintSpeed = metrics.nftMintSpeed || 5000; // ms
    const successRate = metrics.nftSuccessRate || 0.95;
    const certificateQuality = metrics.certificateQuality || 8;

    let score = 10;

    // Mint speed
    if (mintSpeed > 10000) score -= 2;
    else if (mintSpeed < 3000) score += 1;

    // Success rate
    score += (successRate - 0.95) * 20;

    // Certificate quality
    score += (certificateQuality - 8) * 0.3;

    return Math.max(0, Math.min(10, score));
  }

  scoreAIAssistant(metrics) {
    const responseQuality = metrics.aiResponseQuality || 8;
    const personalization = metrics.aiPersonalization || 7;
    const empathy = metrics.aiEmpathy || 7;
    const conversionRate = metrics.aiConversionRate || 0.25;

    let score = 0;
    score += responseQuality * 0.3;
    score += personalization * 0.25;
    score += empathy * 0.25;
    score += (conversionRate / 0.3) * 2; // Max 2 points

    return Math.max(0, Math.min(10, score));
  }

  scoreEcommerce(metrics) {
    const checkoutSteps = metrics.checkoutSteps || 3;
    const cartAbandonmentRate = metrics.cartAbandonmentRate || 0.7;
    const checkoutSpeed = metrics.checkoutSpeed || 120; // seconds

    let score = 10;

    // Fewer steps is better
    score -= (checkoutSteps - 2) * 1.5;

    // Lower abandonment is better
    score -= (cartAbandonmentRate - 0.5) * 10;

    // Faster is better
    if (checkoutSpeed > 180) score -= 2;
    else if (checkoutSpeed < 60) score += 1;

    return Math.max(0, Math.min(10, score));
  }

  scoreMobileExperience(metrics) {
    const mobileTraffic = metrics.mobileTrafficShare || 0.6;
    const mobileConversion = metrics.mobileConversionRate || 0.02;
    const touchOptimization = metrics.touchOptimization || 7;

    let score = 0;
    score += (mobileTraffic / 0.7) * 3; // Max 3 points
    score += (mobileConversion / 0.03) * 4; // Max 4 points
    score += touchOptimization * 0.3;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Level 2: Эмоциональный анализ
   */
  async analyzeEmotionalImpact(metrics) {
    const scores = {
      storytelling: this.scoreStorytelling(metrics),
      viralPotential: this.scoreViralPotential(metrics),
      customerJourney: this.scoreCustomerJourney(metrics),
      communityStrength: this.scoreCommunityStrength(metrics),
      brandVoice: this.scoreBrandVoice(metrics),
    };

    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s, 0) /
      Object.keys(scores).length;

    return {
      category: "Emotional Impact",
      level: 2,
      scores,
      averageScore: avgScore,
      grade: this.getGrade(avgScore),
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores),
    };
  }

  scoreStorytelling(metrics) {
    const originStoryClarity = metrics.originStoryClarity || 7;
    const productNarratives = metrics.productNarratives || 8;
    const testimonialImpact = metrics.testimonialImpact || 6;

    return (
      originStoryClarity * 0.4 +
      productNarratives * 0.35 +
      testimonialImpact * 0.25
    );
  }

  scoreViralPotential(metrics) {
    const tiktokOptimization = metrics.tiktokOptimization || 6;
    const shareability = metrics.shareability || 7;
    const memePotential = metrics.memePotential || 5;
    const influencerAppeal = metrics.influencerAppeal || 6;

    return (
      (tiktokOptimization + shareability + memePotential + influencerAppeal) / 4
    );
  }

  scoreCustomerJourney(metrics) {
    const firstImpression = metrics.firstImpression || 8;
    const purchaseConfidence = metrics.purchaseConfidence || 7;
    const unboxingWow = metrics.unboxingWow || 9; // Haori Vision сильная сторона
    const loyaltyTriggers = metrics.loyaltyTriggers || 6;

    return (
      (firstImpression + purchaseConfidence + unboxingWow + loyaltyTriggers) / 4
    );
  }

  scoreCommunityStrength(metrics) {
    const engagement = metrics.communityEngagement || 0.05;
    const ugcVolume = metrics.ugcVolume || 10;
    const brandAdvocates = metrics.brandAdvocates || 5;

    let score = 0;
    score += (engagement / 0.08) * 4;
    score += (ugcVolume / 50) * 3;
    score += (brandAdvocates / 20) * 3;

    return Math.max(0, Math.min(10, score));
  }

  scoreBrandVoice(metrics) {
    const consistency = metrics.voiceConsistency || 8;
    const uniqueness = metrics.voiceUniqueness || 7;
    const resonance = metrics.voiceResonance || 7;

    return (consistency + uniqueness + resonance) / 3;
  }

  /**
   * Level 3: Инновационный анализ
   */
  async analyzeInnovation(metrics) {
    const scores = {
      aiInnovation: this.scoreAIInnovation(metrics),
      blockchainIntegration: this.scoreBlockchainIntegration(metrics),
      culturalRelevance: this.scoreCulturalRelevance(metrics),
      marketDisruption: this.scoreMarketDisruption(metrics),
      futureReadiness: this.scoreFutureReadiness(metrics),
    };

    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s, 0) /
      Object.keys(scores).length;

    return {
      category: "Innovation Leadership",
      level: 3,
      scores,
      averageScore: avgScore,
      grade: this.getGrade(avgScore),
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores),
    };
  }

  scoreAIInnovation(metrics) {
    const moodboardQuality = metrics.aiMoodboardQuality || 8;
    const assistantIntelligence = metrics.aiAssistantIntelligence || 7;
    const sentimentAnalysis = metrics.aiSentimentAnalysis || 7;
    const personalization = metrics.aiPersonalization || 7;

    return (
      (moodboardQuality +
        assistantIntelligence +
        sentimentAnalysis +
        personalization) /
      4
    );
  }

  scoreBlockchainIntegration(metrics) {
    const nftUtility = metrics.nftUtility || 7;
    const smartContracts = metrics.smartContracts || 6;
    const web3Experience = metrics.web3Experience || 6;

    return (nftUtility + smartContracts + web3Experience) / 3;
  }

  scoreCulturalRelevance(metrics) {
    const genZAppeal = metrics.genZAppeal || 7;
    const sustainability = metrics.sustainability || 6;
    const inclusivity = metrics.inclusivity || 7;
    const artWorldRecognition = metrics.artWorldRecognition || 5;

    return (
      (genZAppeal + sustainability + inclusivity + artWorldRecognition) / 4
    );
  }

  scoreMarketDisruption(metrics) {
    const uvUniqueness = metrics.uvUniqueness || 9; // Strong USP
    const pricingInnovation = metrics.pricingInnovation || 7;
    const distributionNovelty = metrics.distributionNovelty || 6;
    const philosophyBoldness = metrics.philosophyBoldness || 8;

    return (
      (uvUniqueness +
        pricingInnovation +
        distributionNovelty +
        philosophyBoldness) /
      4
    );
  }

  scoreFutureReadiness(metrics) {
    const scalability = metrics.scalability || 7;
    const adaptability = metrics.adaptability || 8;
    const techStack = metrics.techStack || 8;
    const dataInfrastructure = metrics.dataInfrastructure || 7;

    return (scalability + adaptability + techStack + dataInfrastructure) / 4;
  }

  /**
   * Бенчмарк против лидеров
   */
  async benchmarkAgainstLeaders(technical, emotional, innovation) {
    const haoriScore = {
      brandRecognition: 5.0, // Starting brand
      technicalExecution: technical.averageScore,
      userExperience:
        (technical.scores.ecommerce + technical.scores.mobileExperience) / 2,
      viralPotential: emotional.scores.viralPotential,
      emotionalConnection: emotional.scores.customerJourney,
    };

    const comparisons = {};

    for (const [key, brand] of Object.entries(this.benchmarkBrands)) {
      comparisons[key] = {
        brandName: brand.name,
        gaps: {},
        opportunities: [],
      };

      for (const [metric, benchmarkScore] of Object.entries(brand.metrics)) {
        const gap = benchmarkScore - (haoriScore[metric] || 0);
        comparisons[key].gaps[metric] = {
          benchmark: benchmarkScore,
          haori: haoriScore[metric] || 0,
          gap: gap.toFixed(1),
          percentageBehind: ((gap / benchmarkScore) * 100).toFixed(1) + "%",
        };

        if (gap > 2.0) {
          comparisons[key].opportunities.push({
            metric,
            gap: gap.toFixed(1),
            priority: gap > 3.0 ? "HIGH" : "MEDIUM",
            learnFrom: brand.strengths[0],
          });
        }
      }
    }

    return {
      haoriCurrentScore: haoriScore,
      benchmarkBrands: this.benchmarkBrands,
      comparisons,
    };
  }

  /**
   * AI insights через Claude
   */
  async generateAIInsights(analysisData) {
    try {
      const prompt = `You are a world-class brand strategist analyzing HAORI VISION, a UV-reactive wearable art brand.

**Current Analysis:**

Technical Execution: ${analysisData.technicalAnalysis.averageScore.toFixed(1)}/10
Emotional Impact: ${analysisData.emotionalAnalysis.averageScore.toFixed(1)}/10
Innovation Leadership: ${analysisData.innovationAnalysis.averageScore.toFixed(1)}/10

**Benchmark Comparison:**
- Runway AI (Tech Art): High technical execution, clean UX
- Balenciaga (Luxury Fashion): Brand prestige, viral marketing
- MSCHF (Viral Art): Maximum viral potential, scarcity tactics

**Task:**
Provide strategic insights on how HAORI VISION can reach world-class level:

1. **Biggest Opportunity** (1 sentence)
2. **Critical Weakness** (1 sentence)
3. **Quick Wins** (3 actions, can be done in 1-2 weeks)
4. **Long-term Vision** (1 bold move to create global hype)
5. **Viral Strategy** (specific TikTok/Instagram content ideas)
6. **Brand Evolution** (how to position for luxury + tech + art markets)

Be specific, actionable, and bold. Think like a CMO at a top tech-fashion brand.

Format as JSON:
{
  "biggestOpportunity": "...",
  "criticalWeakness": "...",
  "quickWins": ["...", "...", "..."],
  "longTermVision": "...",
  "viralStrategy": {
    "tiktokIdeas": ["...", "..."],
    "instagramIdeas": ["...", "..."]
  },
  "brandEvolution": "..."
}`;

      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Failed to parse AI insights");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("AI insights generation error:", error);
      return {
        biggestOpportunity: "Leverage UV uniqueness for viral TikTok content",
        criticalWeakness:
          "Low brand recognition compared to established players",
        quickWins: [
          'Create "Before/After UV" reveal videos for TikTok',
          "Launch influencer seeding program with 20 micro-influencers",
          "Add social proof testimonials to homepage",
        ],
        longTermVision:
          'Position as "the Tesla of wearable art" - tech-forward luxury',
        viralStrategy: {
          tiktokIdeas: [
            "UV transformation videos",
            "Artist creation process timelapse",
          ],
          instagramIdeas: [
            "Behind-the-scenes stories",
            "Celebrity wearing haori",
          ],
        },
        brandEvolution: "Bridge gap between tech innovation and luxury fashion",
      };
    }
  }

  /**
   * Идентификация gaps
   */
  identifyGaps(benchmarkAnalysis) {
    const allGaps = [];

    for (const [brand, comparison] of Object.entries(
      benchmarkAnalysis.comparisons,
    )) {
      for (const opportunity of comparison.opportunities) {
        allGaps.push({
          benchmark: comparison.brandName,
          metric: opportunity.metric,
          gap: parseFloat(opportunity.gap),
          priority: opportunity.priority,
          learnFrom: opportunity.learnFrom,
        });
      }
    }

    // Sort by gap size
    allGaps.sort((a, b) => b.gap - a.gap);

    return {
      total: allGaps.length,
      high: allGaps.filter((g) => g.priority === "HIGH").length,
      medium: allGaps.filter((g) => g.priority === "MEDIUM").length,
      gaps: allGaps.slice(0, 10), // Top 10
    };
  }

  /**
   * Генерация action plan
   */
  async generateActionPlan(gaps, aiInsights) {
    const actions = [];

    // Quick wins from AI
    aiInsights.quickWins.forEach((win, i) => {
      actions.push({
        priority: "HIGH",
        timeframe: "1-2 weeks",
        category: "Quick Win",
        action: win,
        impact: "Medium",
        effort: "Low",
      });
    });

    // Gap-based actions
    gaps.gaps.slice(0, 5).forEach((gap) => {
      let action = "";

      if (gap.metric === "brandRecognition") {
        action = "Launch PR campaign targeting fashion-tech media outlets";
      } else if (gap.metric === "viralPotential") {
        action = 'Create daily TikTok content series: "UV Art Process"';
      } else if (gap.metric === "technicalExecution") {
        action = "Optimize website performance: target <1s load time";
      } else {
        action = `Improve ${gap.metric} by studying ${gap.learnFrom}`;
      }

      actions.push({
        priority: gap.priority,
        timeframe: gap.priority === "HIGH" ? "2-4 weeks" : "1-2 months",
        category: "Gap Closure",
        action,
        benchmark: gap.benchmark,
        currentGap: gap.gap.toFixed(1),
        impact: "High",
        effort: "Medium",
      });
    });

    // Long-term vision
    actions.push({
      priority: "STRATEGIC",
      timeframe: "3-6 months",
      category: "Vision",
      action: aiInsights.longTermVision,
      impact: "Very High",
      effort: "High",
    });

    return actions;
  }

  /**
   * Helper: Calculate overall score
   */
  calculateOverallScore(analysis) {
    const weights = {
      technical: 0.3,
      emotional: 0.4,
      innovation: 0.3,
    };

    const weighted =
      analysis.technicalAnalysis.averageScore * weights.technical +
      analysis.emotionalAnalysis.averageScore * weights.emotional +
      analysis.innovationAnalysis.averageScore * weights.innovation;

    return {
      score: weighted.toFixed(1),
      outOf: 10,
      grade: this.getGrade(weighted),
      breakdown: {
        technical: analysis.technicalAnalysis.averageScore.toFixed(1),
        emotional: analysis.emotionalAnalysis.averageScore.toFixed(1),
        innovation: analysis.innovationAnalysis.averageScore.toFixed(1),
      },
    };
  }

  /**
   * Helper: Get grade
   */
  getGrade(score) {
    if (score >= 9.0) return "A+";
    if (score >= 8.5) return "A";
    if (score >= 8.0) return "A-";
    if (score >= 7.5) return "B+";
    if (score >= 7.0) return "B";
    if (score >= 6.5) return "B-";
    if (score >= 6.0) return "C+";
    if (score >= 5.5) return "C";
    return "C-";
  }

  /**
   * Helper: Identify strengths
   */
  identifyStrengths(scores) {
    return Object.entries(scores)
      .filter(([_, score]) => score >= 8.0)
      .map(([name, score]) => ({
        area: name,
        score: score.toFixed(1),
        status: "Strong",
      }));
  }

  /**
   * Helper: Identify weaknesses
   */
  identifyWeaknesses(scores) {
    return Object.entries(scores)
      .filter(([_, score]) => score < 7.0)
      .map(([name, score]) => ({
        area: name,
        score: score.toFixed(1),
        status: score < 5.0 ? "Critical" : "Needs Improvement",
      }));
  }
}

export default new BrandAnalysisService();
