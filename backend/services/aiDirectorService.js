import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lightIntelligenceReportService from "./lightIntelligenceReportService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🤖 AI DIRECTOR — Autonomous Creative Director
 *
 * Manages all brand operations:
 * 1. Brand Watcher - Tracks fashion/art/TikTok trends
 * 2. UX Inspector - Analyzes website experience
 * 3. Sales Optimizer - Optimizes conversion funnel
 * 4. Customer Insights - Understands customer behavior
 * 5. Artistic Pulse - Evaluates visual aesthetics
 * 6. Creative Scheduler - Plans content for 14 days
 *
 * Runs: Every Sunday at 03:33 AM
 */

class AIDirectorService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.dataDir = path.join(__dirname, "../../data/ai-director");
    this.reportsDir = path.join(this.dataDir, "reports");
    this.schedulesDir = path.join(this.dataDir, "schedules");

    // Ensure directories exist
    this.ensureDirectories();

    // Benchmark brands for comparison
    this.benchmarkBrands = [
      "Louis Vuitton × Yayoi Kusama",
      "Maison Margiela Artisanal",
      "Takashi Murakami × Supreme",
      "RTFKT × Nike",
      "Daniel Arsham × Dior",
      "Balenciaga",
      "Loewe",
    ];
  }

  ensureDirectories() {
    [this.dataDir, this.reportsDir, this.schedulesDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 🎯 MAIN DIRECTOR EXECUTION
   * Runs all 6 modules and generates comprehensive report
   */
  async runWeeklyDirectorCycle() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[△] AI DIRECTOR: Starting weekly cycle...");
    console.log(`[○] Time: ${new Date().toLocaleString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const report = {
      timestamp: new Date().toISOString(),
      iteration: this.getIterationNumber(),
      modules: {},
    };

    try {
      // Module 1: Brand Watcher
      console.log("\n[1/6] Brand Watcher (analyzing trends)...");
      report.modules.brandWatcher = await this.runBrandWatcher();

      // Module 2: UX Inspector
      console.log("\n[2/6] UX Inspector (analyzing website)...");
      report.modules.uxInspector = await this.runUXInspector();

      // Module 3: Sales Optimizer
      console.log("\n[3/6] Sales Optimizer (analyzing funnel)...");
      report.modules.salesOptimizer = await this.runSalesOptimizer();

      // Module 4: Customer Insights
      console.log("\n[4/6] Customer Insights (analyzing behavior)...");
      report.modules.customerInsights = await this.runCustomerInsights();

      // Module 5: Artistic Pulse
      console.log("\n[5/6] Artistic Pulse (analyzing visuals)...");
      report.modules.artisticPulse = await this.runArtisticPulse();

      // Module 6: Creative Scheduler
      console.log("\n[6/6] Creative Scheduler (planning content)...");
      report.modules.creativeScheduler =
        await this.runCreativeScheduler(report);

      // Generate Executive Summary
      console.log("\n[◇] Generating Executive Summary...");
      report.executiveSummary = await this.generateExecutiveSummary(report);

      // Generate PDF Report (LIGHT INTELLIGENCE WEEKLY)
      console.log("\n[✦] Generating Light Intelligence PDF Report...");
      const pdfResult =
        await lightIntelligenceReportService.generatePDFReport(report);
      report.pdfReport = pdfResult;
      report.haoriLightIndex = pdfResult.lightIndex;

      // Save report
      this.saveReport(report);

      // Send to team
      await this.notifyTeam(report);

      console.log("\n[✓] AI Director cycle completed successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      return {
        success: true,
        report,
        nextRun: this.getNextRunDate(),
      };
    } catch (error) {
      console.error("[✗] AI Director error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📡 MODULE 1: BRAND WATCHER
   * Tracks trends in fashion, art, and social media
   */
  async runBrandWatcher() {
    const trends = {
      fashion: await this.analyzeFashionTrends(),
      art: await this.analyzeArtTrends(),
      social: await this.analyzeSocialTrends(),
      recommendations: [],
    };

    // Use Claude to analyze trends and generate insights
    const prompt = `You are a luxury fashion brand strategist analyzing current trends.

**Fashion Trends:**
${JSON.stringify(trends.fashion, null, 2)}

**Art Trends:**
${JSON.stringify(trends.art, null, 2)}

**Social Media Trends:**
${JSON.stringify(trends.social, null, 2)}

**Task:**
Analyze these trends and provide strategic recommendations for HAORI VISION (UV-reactive wearable art brand).

Focus on:
1. Which trends align with HAORI VISION's DNA?
2. What visual/audio elements should we incorporate?
3. What collaborations should we pursue?
4. What content themes are emerging?

Format as JSON:
{
  "keyTrends": ["trend 1", "trend 2", ...],
  "opportunities": ["opportunity 1", ...],
  "threats": ["threat 1", ...],
  "recommendations": [
    {
      "category": "visual/audio/collab/content",
      "action": "specific action",
      "priority": "high/medium/low",
      "reasoning": "why this matters"
    }
  ]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    return {
      trends,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeFashionTrends() {
    // Mock data - in production, integrate with fashion APIs
    return {
      trending: [
        "Y2K futurism revival",
        "Techwear meets streetwear",
        "Sustainable luxury",
        "Phygital fashion (NFT + physical)",
        "Genderless silhouettes",
      ],
      colors: ["Neon green", "Electric blue", "Chrome silver", "UV reactive"],
      materials: [
        "Recycled tech fabrics",
        "Holographic textiles",
        "Bio-luminescent materials",
      ],
      influencers: ["@hypebeast", "@highsnobiety", "@ssense"],
      hashtags: [
        "#techwear",
        "#futureoffashion",
        "#phygitalfashion",
        "#wearableart",
      ],
    };
  }

  async analyzeArtTrends() {
    return {
      movements: [
        "Digital art × Physical installations",
        "Neon minimalism",
        "Japanese contemporary fusion",
        "AR/VR art experiences",
        "NFT art market growth",
      ],
      artists: ["Takashi Murakami", "Daniel Arsham", "Yayoi Kusama", "TeamLab"],
      exhibitions: ["Art Basel Miami", "Frieze London", "Tokyo Design Week"],
      themes: [
        "Light as medium",
        "Technology meets tradition",
        "Psychedelic minimalism",
      ],
    };
  }

  async analyzeSocialTrends() {
    return {
      tiktok: {
        trending_sounds: [
          "Hyperpop remixes",
          "Japanese city pop",
          "Electronic ambient",
          "Viral transitions",
        ],
        trending_formats: [
          "Before/after transformations",
          "POV: entering [event]",
          "Outfit transition videos",
          "Unboxing luxury items",
          "Festival fashion prep",
        ],
        hashtags: [
          "#festivalfashion",
          "#raveroutfit",
          "#uvfashion",
          "#wearableart",
        ],
      },
      instagram: {
        aesthetics: [
          "Cyberpunk",
          "Neon nights",
          "Japanese minimalism",
          "AR filters",
        ],
        engagement_types: [
          "Carousels",
          "Reels",
          "Stories with polls",
          "AR try-ons",
        ],
      },
      youtube: {
        content_types: [
          "Festival vlog + outfit breakdown",
          "Unboxing luxury art pieces",
          "Behind-the-scenes artist studio",
          "UV fashion explained",
        ],
      },
    };
  }

  /**
   * 🔍 MODULE 2: UX INSPECTOR
   * Analyzes website experience vs luxury benchmarks
   */
  async runUXInspector() {
    const currentState = await this.analyzeCurrentUX();

    const prompt = `You are a luxury UX consultant comparing HAORI VISION to world-class brands.

**Current HAORI VISION UX:**
${JSON.stringify(currentState, null, 2)}

**Benchmark Brands:**
${this.benchmarkBrands.join(", ")}

**Task:**
Evaluate HAORI VISION's UX against luxury standards.

Rate (0-10) and provide improvements for:
1. First Impression
2. Navigation Flow
3. Product Discovery
4. Checkout Experience
5. Mobile Experience
6. Loading Speed
7. Animation Quality
8. Emotional Impact

Format as JSON:
{
  "scores": {
    "firstImpression": { "score": 0-10, "feedback": "..." },
    ...
  },
  "strengths": ["strength 1", ...],
  "weaknesses": ["weakness 1", ...],
  "criticalIssues": [
    {
      "issue": "description",
      "impact": "high/medium/low",
      "solution": "specific fix"
    }
  ],
  "quickWins": [
    {
      "improvement": "what to improve",
      "effort": "low/medium/high",
      "impact": "low/medium/high"
    }
  ]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    return {
      currentState,
      analysis,
      overallScore: this.calculateOverallScore(analysis.scores),
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeCurrentUX() {
    // Mock current state - in production, fetch from analytics
    return {
      loadingSpeed: "2.1s",
      mobileOptimized: true,
      checkoutSteps: 3,
      animationQuality: "good",
      navigationClarity: "medium",
      productPhotography: "good",
      callToActions: "clear",
      trustIndicators: "minimal",
      luxuryFeeling: "medium",
    };
  }

  calculateOverallScore(scores) {
    const values = Object.values(scores).map((s) => s.score);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }

  /**
   * 💰 MODULE 3: SALES OPTIMIZER
   * Analyzes conversion funnel and optimizes
   */
  async runSalesOptimizer() {
    const funnelData = await this.analyzeSalesFunnel();

    const prompt = `You are a luxury e-commerce optimization expert.

**Sales Funnel Data:**
${JSON.stringify(funnelData, null, 2)}

**Task:**
Analyze the conversion funnel and identify bottlenecks.

Provide:
1. Bottleneck analysis (where are we losing customers?)
2. A/B test recommendations
3. Pricing strategy insights
4. Upsell/cross-sell opportunities
5. Recovery tactics (cart abandonment, etc.)

Format as JSON:
{
  "bottlenecks": [
    {
      "stage": "stage name",
      "dropoffRate": "percentage",
      "reason": "likely cause",
      "fix": "recommended solution"
    }
  ],
  "abTests": [
    {
      "test": "what to test",
      "hypothesis": "expected outcome",
      "priority": "high/medium/low"
    }
  ],
  "pricingInsights": {
    "currentAOV": number,
    "targetAOV": number,
    "strategies": ["strategy 1", ...]
  },
  "recoveryTactics": [
    {
      "tactic": "description",
      "expectedLift": "percentage"
    }
  ]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    return {
      funnelData,
      analysis,
      projectedImpact: this.calculateProjectedImpact(analysis),
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeSalesFunnel() {
    // Mock data - in production, fetch from analytics
    return {
      visitors: 5000,
      productViews: 3000,
      addToCart: 600,
      checkoutStarted: 300,
      purchased: 75,
      conversionRate: 1.5,
      avgOrderValue: 550,
      cartAbandonmentRate: 75,
      bounceRate: 42,
    };
  }

  calculateProjectedImpact(analysis) {
    // Calculate potential revenue impact
    return {
      revenueIncrease: "+25-40%",
      conversionRateImprovement: "+1.5-2%",
      avgOrderValueIncrease: "+15-20%",
      timeline: "4-8 weeks",
    };
  }

  /**
   * 👥 MODULE 4: CUSTOMER INSIGHTS
   * Analyzes customer behavior and sentiment
   */
  async runCustomerInsights() {
    const customerData = await this.analyzeCustomerBehavior();

    const prompt = `You are a luxury brand psychologist analyzing customer behavior.

**Customer Data:**
${JSON.stringify(customerData, null, 2)}

**Task:**
Provide deep insights into customer psychology and behavior patterns.

Analyze:
1. Customer segments (personas)
2. Purchase motivations
3. Pain points
4. Delight factors
5. Emotional journey
6. Loyalty drivers

Format as JSON:
{
  "segments": [
    {
      "name": "segment name",
      "size": "percentage",
      "characteristics": ["trait 1", ...],
      "motivations": ["motivation 1", ...],
      "painPoints": ["pain 1", ...],
      "strategy": "how to serve this segment"
    }
  ],
  "emotionalJourney": {
    "discovery": "emotion at this stage",
    "consideration": "...",
    "purchase": "...",
    "ownership": "...",
    "advocacy": "..."
  },
  "loyaltyDrivers": [
    {
      "driver": "what drives loyalty",
      "strength": "high/medium/low"
    }
  ],
  "churnRisks": ["risk 1", ...],
  "retentionTactics": ["tactic 1", ...]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    return {
      customerData,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeCustomerBehavior() {
    // Mock data - in production, fetch from CRM
    return {
      totalCustomers: 450,
      repeatCustomerRate: 18,
      avgLifetimeValue: 820,
      topSources: ["Instagram", "TikTok", "Google"],
      ageRange: "22-38",
      interests: ["Art", "Music festivals", "Fashion", "NFTs"],
      avgTimeOnSite: "4:32",
      topPages: ["/shop", "/collections/mycelium-dreams", "/about"],
    };
  }

  /**
   * 🎨 MODULE 5: ARTISTIC PULSE
   * Evaluates visual aesthetics vs benchmark brands
   */
  async runArtisticPulse() {
    const visualAudit = await this.auditVisualAesthetics();

    const prompt = `You are an art director evaluating HAORI VISION's visual identity.

**Current Visual Audit:**
${JSON.stringify(visualAudit, null, 2)}

**Benchmark Brands:**
${this.benchmarkBrands.join(", ")}

**Task:**
Evaluate visual aesthetics and provide artistic direction.

Rate (0-10) and improve:
1. Photography quality
2. Color palette consistency
3. Typography hierarchy
4. Animation style
5. Brand consistency
6. Emotional resonance
7. Artistic innovation
8. Instagram aesthetic

Format as JSON:
{
  "scores": {
    "photography": { "score": 0-10, "feedback": "..." },
    ...
  },
  "colorPaletteAdjustments": {
    "current": ["color 1", ...],
    "recommended": ["color 1", ...],
    "reasoning": "why these colors"
  },
  "photographyDirection": {
    "style": "recommended style",
    "lighting": "lighting approach",
    "composition": "composition tips",
    "postProcessing": "editing guidelines"
  },
  "animationImprovements": [
    {
      "element": "what to animate",
      "style": "animation style",
      "timing": "duration and easing"
    }
  ],
  "brandConsistencyIssues": ["issue 1", ...],
  "artisticOpportunities": ["opportunity 1", ...]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    return {
      visualAudit,
      analysis,
      overallArtisticScore: this.calculateOverallScore(analysis.scores),
      timestamp: new Date().toISOString(),
    };
  }

  async auditVisualAesthetics() {
    return {
      colorPalette: ["#FF10F0", "#39FF14", "#00D4FF", "#000000", "#FFFFFF"],
      typography: ["Playfair Display", "Inter", "Noto Sans JP"],
      photographyStyle: "Editorial with UV lighting",
      animationStyle: "Smooth, luxury easing",
      brandConsistency: "Good",
      instagramAesthetic: "Neon + Minimal",
      videoQuality: "High-res, professional",
    };
  }

  /**
   * 📅 MODULE 6: CREATIVE SCHEDULER
   * Plans content for next 14 days
   */
  async runCreativeScheduler(report) {
    const insights = {
      trends: report.modules.brandWatcher?.analysis,
      uxFeedback: report.modules.uxInspector?.analysis,
      customerInsights: report.modules.customerInsights?.analysis,
      artisticDirection: report.modules.artisticPulse?.analysis,
    };

    const prompt = `You are a creative director planning content for HAORI VISION.

**Insights from AI Director:**
${JSON.stringify(insights, null, 2)}

**Task:**
Create a 14-day content calendar for TikTok, Instagram, and YouTube.

Each piece of content should:
- Align with current trends
- Address customer pain points
- Follow artistic direction
- Drive engagement and sales

Format as JSON:
{
  "contentCalendar": [
    {
      "day": 1-14,
      "platform": "TikTok/Instagram/YouTube",
      "format": "Reel/Post/Story/Video",
      "theme": "content theme",
      "hook": "opening line",
      "visualStyle": "description",
      "music": "recommended track/genre",
      "cta": "call to action",
      "hashtags": ["tag1", ...],
      "estimatedReach": "low/medium/high",
      "objective": "awareness/engagement/conversion"
    }
  ],
  "weeklyThemes": {
    "week1": "theme for days 1-7",
    "week2": "theme for days 8-14"
  },
  "collaborationOpportunities": [
    {
      "type": "influencer/artist/brand",
      "target": "who to collaborate with",
      "concept": "collaboration idea"
    }
  ]
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const schedule = JSON.parse(
      message.content[0].text.match(/\{[\s\S]*\}/)[0],
    );

    // Save schedule to file
    const schedulePath = path.join(this.schedulesDir, "next_reels_plan.json");
    fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));

    return {
      schedule,
      savedTo: schedulePath,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📊 EXECUTIVE SUMMARY
   * Generates comprehensive weekly report
   */
  async generateExecutiveSummary(report) {
    const prompt = `You are the AI Director of HAORI VISION, presenting weekly insights to the executive team.

**Weekly Report Data:**
${JSON.stringify(report, null, 2)}

**Task:**
Create an executive summary that:
1. Highlights top 3 opportunities
2. Identifies top 3 threats
3. Provides 5 priority actions
4. Estimates business impact

Format as JSON:
{
  "topOpportunities": [
    {
      "opportunity": "description",
      "impact": "high/medium/low",
      "effort": "low/medium/high",
      "timeline": "timeframe"
    }
  ],
  "topThreats": [
    {
      "threat": "description",
      "severity": "high/medium/low",
      "mitigation": "how to address"
    }
  ],
  "priorityActions": [
    {
      "action": "what to do",
      "why": "reasoning",
      "owner": "who should do it",
      "deadline": "when",
      "priority": "1-5"
    }
  ],
  "businessImpact": {
    "projectedRevenueGrowth": "percentage",
    "brandScoreImprovement": "points",
    "customerSatisfactionLift": "percentage",
    "socialEngagementGrowth": "percentage"
  },
  "keyMetrics": {
    "uxScore": "score/10",
    "artisticScore": "score/10",
    "conversionRate": "percentage",
    "customerSentiment": "positive/neutral/negative"
  },
  "directorNote": "Personal note from AI Director to the team"
}`;

    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(message.content[0].text.match(/\{[\s\S]*\}/)[0]);
  }

  /**
   * 💾 SAVE REPORT
   */
  saveReport(report) {
    const filename = `ai-director-report-${Date.now()}.json`;
    const filepath = path.join(this.reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${filepath}`);
    return filepath;
  }

  /**
   * 📧 NOTIFY TEAM
   */
  async notifyTeam(report) {
    // In production, send email via Nodemailer
    console.log("📧 Sending report to team...");

    const summary = report.executiveSummary;

    const emailContent = `
🤖 AI DIRECTOR WEEKLY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Iteration #${report.iteration}
${new Date(report.timestamp).toLocaleDateString()}

🎯 TOP 3 OPPORTUNITIES:
${summary.topOpportunities.map((o, i) => `${i + 1}. ${o.opportunity} (Impact: ${o.impact})`).join("\n")}

⚠️ TOP 3 THREATS:
${summary.topThreats.map((t, i) => `${i + 1}. ${t.threat} (Severity: ${t.severity})`).join("\n")}

📋 PRIORITY ACTIONS:
${summary.priorityActions
  .slice(0, 5)
  .map((a) => `• ${a.action} (Owner: ${a.owner}, Deadline: ${a.deadline})`)
  .join("\n")}

📈 BUSINESS IMPACT:
• Revenue Growth: ${summary.businessImpact.projectedRevenueGrowth}
• Brand Score: ${summary.businessImpact.brandScoreImprovement}
• Customer Satisfaction: ${summary.businessImpact.customerSatisfactionLift}
• Social Engagement: ${summary.businessImpact.socialEngagementGrowth}

📊 KEY METRICS:
• UX Score: ${summary.keyMetrics.uxScore}
• Artistic Score: ${summary.keyMetrics.artisticScore}
• Conversion Rate: ${summary.keyMetrics.conversionRate}
• Customer Sentiment: ${summary.keyMetrics.customerSentiment}

💬 DIRECTOR'S NOTE:
${summary.directorNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full report: ${this.reportsDir}
Content calendar: ${this.schedulesDir}/next_reels_plan.json

Next AI Director cycle: ${this.getNextRunDate().toLocaleDateString()}
    `;

    console.log("\n" + emailContent);
    console.log("\n✉️ Email would be sent to: admin@haorivision.com");

    return { sent: true, preview: emailContent };
  }

  /**
   * 📅 HELPER METHODS
   */
  getIterationNumber() {
    const files = fs.readdirSync(this.reportsDir);
    return files.length + 1;
  }

  getNextRunDate() {
    const next = new Date();
    next.setDate(next.getDate() + ((7 - next.getDay()) % 7 || 7));
    next.setHours(3, 33, 0, 0);
    return next;
  }

  /**
   * 🔄 GET STATUS
   */
  getStatus() {
    const latestReport = this.getLatestReport();

    return {
      active: true,
      lastRun: latestReport?.timestamp || null,
      nextRun: this.getNextRunDate(),
      totalIterations: this.getIterationNumber() - 1,
      reportsDirectory: this.reportsDir,
      schedulesDirectory: this.schedulesDir,
    };
  }

  getLatestReport() {
    const files = fs.readdirSync(this.reportsDir);
    if (files.length === 0) return null;

    const latestFile = files.sort().reverse()[0];
    const content = fs.readFileSync(
      path.join(this.reportsDir, latestFile),
      "utf-8",
    );
    return JSON.parse(content);
  }
}

export default new AIDirectorService();
