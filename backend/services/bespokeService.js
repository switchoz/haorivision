import BespokeCommission from "../models/BespokeCommission.js";
import Anthropic from "@anthropic-ai/sdk";
import { baseLogger } from "../middlewares/logger.js";

/**
 * Bespoke Service
 * AI-powered индивидуальные заказы
 */

class BespokeService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Pricing tiers
    this.basePrices = {
      haori: 800, // Base haori price
      haori_set: 1200, // Haori + matching piece
      painting: 600, // Standalone artwork
      custom: 500, // Base for custom items
    };

    // Complexity multipliers
    this.complexityFactors = {
      simple: 1.0, // Minimal design, 1-2 colors
      moderate: 1.5, // Medium complexity, 3-4 colors
      complex: 2.0, // High detail, 5+ colors
      masterpiece: 3.0, // Maximum complexity, special techniques
    };
  }

  /**
   * Create new bespoke commission
   */
  async createCommission(customerId, briefData) {
    try {
      baseLogger.info({ customerId }, "Creating bespoke commission");

      // Generate commission number
      const commissionNumber = this.generateCommissionNumber();

      // Create commission
      const commission = new BespokeCommission({
        customerId: customerId,
        commissionNumber: commissionNumber,
        brief: {
          energy: briefData.energy,
          colors: briefData.colors || [],
          emotions: briefData.emotions || [],
          style: briefData.style,
          inspiration: briefData.inspiration,
          story: briefData.story,
          referenceImages: briefData.referenceImages || [],
        },
        specifications: {
          garmentType: briefData.garmentType || "haori",
          size: briefData.size,
        },
      });

      await commission.save();

      baseLogger.info(`Commission created: ${commissionNumber}`);

      // Generate moodboard with AI
      await this.generateMoodboard(commission);

      // Calculate initial pricing
      await this.calculatePricing(commission);

      // Notify artist
      await this.notifyArtist(commission);

      return {
        success: true,
        commission: commission,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Create commission error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate commission number
   */
  generateCommissionNumber() {
    const prefix = "BC";
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Generate AI moodboard
   */
  async generateMoodboard(commission) {
    try {
      baseLogger.info(
        `Generating moodboard for ${commission.commissionNumber}`,
      );

      const brief = commission.brief;

      // Build prompt for Claude
      const prompt = `You are an expert fashion designer and artist specializing in UV-reactive wearable art for HAORI VISION brand.

A client has requested a bespoke commission with the following brief:

**Energy:** ${brief.energy}
**Colors:** ${brief.colors.join(", ")}
**Emotions:** ${brief.emotions.join(", ")}
**Style:** ${brief.style}
**Inspiration:** ${brief.inspiration}
**Personal Story:** ${brief.story}

Based on this brief, please provide:

1. **Color Palette** (5-7 colors with hex codes and names, indicate which are UV-reactive)
2. **Design Analysis** (interpret the client's vision)
3. **Design Suggestions** (3-5 specific design recommendations)
4. **Visual References** (describe what imagery/patterns would work)

Format as JSON:
{
  "colorPalette": [
    {"hex": "#...", "name": "...", "uvReactive": true/false}
  ],
  "aiAnalysis": "...",
  "aiSuggestions": ["...", "..."],
  "visualReferences": ["...", "..."]
}`;

      // Call Claude API
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

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const moodboardData = JSON.parse(jsonMatch[0]);

      // Update commission with moodboard
      commission.moodboard = {
        generated: true,
        generatedAt: new Date(),
        colorPalette: moodboardData.colorPalette,
        visualReferences: moodboardData.visualReferences,
        aiAnalysis: moodboardData.aiAnalysis,
        aiSuggestions: moodboardData.aiSuggestions,
      };

      commission.status = "moodboard_created";
      await commission.save();

      baseLogger.info(`Moodboard generated for ${commission.commissionNumber}`);

      return {
        success: true,
        moodboard: commission.moodboard,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Generate moodboard error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate pricing
   */
  async calculatePricing(commission) {
    try {
      const specs = commission.specifications;

      // Base price
      const basePrice =
        this.basePrices[specs.garmentType] || this.basePrices.haori;

      // Determine complexity
      const complexity = this.determineComplexity(commission);
      const complexityMultiplier = this.complexityFactors[complexity];

      // Additional items
      const additionalItemsPrice = (specs.additionalItems || []).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Total price
      const subtotal = basePrice * complexityMultiplier + additionalItemsPrice;
      const discount = 0; // Apply discounts if VIP, loyalty points, etc.
      const totalPrice = subtotal - discount;

      // Deposit (50% upfront)
      const depositRequired = totalPrice * 0.5;

      // Update commission
      commission.pricing = {
        basePrice: basePrice,
        complexityMultiplier: complexityMultiplier,
        additionalItemsPrice: additionalItemsPrice,
        discount: discount,
        totalPrice: totalPrice,
        depositRequired: depositRequired,
      };

      await commission.save();

      baseLogger.info(
        `Pricing calculated: $${totalPrice} (${complexity} complexity)`,
      );

      return {
        success: true,
        pricing: commission.pricing,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Calculate pricing error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Determine complexity level
   */
  determineComplexity(commission) {
    const brief = commission.brief;
    const colors = brief.colors || [];
    const designElements = commission.specifications.designElements || [];

    // Simple scoring
    let score = 0;

    // Color count
    if (colors.length <= 2) score += 1;
    else if (colors.length <= 4) score += 2;
    else score += 3;

    // Design elements count
    if (designElements.length <= 2) score += 1;
    else if (designElements.length <= 4) score += 2;
    else score += 3;

    // Map score to complexity
    if (score <= 2) return "simple";
    if (score <= 4) return "moderate";
    if (score <= 6) return "complex";
    return "masterpiece";
  }

  /**
   * Schedule consultation
   */
  async scheduleConsultation(commissionId, consultationData) {
    try {
      const commission = await BespokeCommission.findById(commissionId);

      if (!commission) {
        return { success: false, error: "Commission not found" };
      }

      commission.consultation = {
        requested: true,
        scheduledDate: new Date(consultationData.date),
        duration: consultationData.duration || 60,
        type: consultationData.type || "video",
        status: "confirmed",
      };

      commission.status = "consultation_scheduled";
      await commission.save();

      // Send confirmation email
      await this.sendConsultationConfirmation(commission);

      baseLogger.info(
        `Consultation scheduled for ${commission.commissionNumber}`,
      );

      return {
        success: true,
        consultation: commission.consultation,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Schedule consultation error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send consultation confirmation
   */
  async sendConsultationConfirmation(commission) {
    try {
      const emailService = (await import("./emailService.js")).default;
      const customer = await commission.populate("customerId");

      const html = `
        <h1>✅ Consultation Scheduled</h1>
        <p>Hi ${customer.customerId.name},</p>
        <p>Your consultation for bespoke commission <strong>${commission.commissionNumber}</strong> has been scheduled!</p>
        <p><strong>Date:</strong> ${commission.consultation.scheduledDate.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${commission.consultation.duration} minutes</p>
        <p><strong>Type:</strong> ${commission.consultation.type}</p>
        <p>We'll discuss your vision in detail and finalize the design.</p>
      `;

      await emailService.sendCustomEmail(
        customer.customerId.email,
        `✅ Consultation Scheduled — ${commission.commissionNumber}`,
        html,
      );

      return { success: true };
    } catch (error) {
      baseLogger.error({ err: error }, "Send consultation confirmation error");
      return { success: false };
    }
  }

  /**
   * Notify artist about new commission
   */
  async notifyArtist(commission) {
    try {
      const emailService = (await import("./emailService.js")).default;
      const customer = await commission.populate("customerId");

      const ARTIST_EMAIL = process.env.ARTIST_EMAIL || "artist@haorivision.com";

      const html = `
        <h1>🎨 New Bespoke Commission</h1>
        <p><strong>Commission:</strong> ${commission.commissionNumber}</p>
        <p><strong>Customer:</strong> ${customer.customerId.name} (${customer.customerId.email})</p>

        <h2>Brief:</h2>
        <ul>
          <li><strong>Energy:</strong> ${commission.brief.energy}</li>
          <li><strong>Colors:</strong> ${commission.brief.colors.join(", ")}</li>
          <li><strong>Emotions:</strong> ${commission.brief.emotions.join(", ")}</li>
          <li><strong>Style:</strong> ${commission.brief.style}</li>
          <li><strong>Inspiration:</strong> ${commission.brief.inspiration}</li>
        </ul>

        <h2>Story:</h2>
        <p>${commission.brief.story}</p>

        <h2>Specifications:</h2>
        <p><strong>Type:</strong> ${commission.specifications.garmentType}</p>
        <p><strong>Size:</strong> ${commission.specifications.size}</p>

        <h2>Pricing:</h2>
        <p><strong>Total:</strong> $${commission.pricing?.totalPrice || "TBD"}</p>

        <p><a href="https://haorivision.com/admin/commissions/${commission._id}">View in Admin Panel</a></p>
      `;

      await emailService.sendCustomEmail(
        ARTIST_EMAIL,
        `🎨 New Bespoke Commission — ${commission.commissionNumber}`,
        html,
      );

      baseLogger.info(`Artist notified about ${commission.commissionNumber}`);

      return { success: true };
    } catch (error) {
      baseLogger.error({ err: error }, "Notify artist error");
      return { success: false };
    }
  }

  /**
   * Update commission status
   */
  async updateStatus(commissionId, status, notes = "") {
    try {
      const commission = await BespokeCommission.findById(commissionId);

      if (!commission) {
        return { success: false, error: "Commission not found" };
      }

      commission.status = status;

      if (notes) {
        if (!commission.artistNotes.progressUpdates) {
          commission.artistNotes.progressUpdates = [];
        }

        commission.artistNotes.progressUpdates.push({
          date: new Date(),
          update: notes,
        });
      }

      await commission.save();

      // Notify customer
      await this.notifyCustomerStatusUpdate(commission);

      return {
        success: true,
        commission: commission,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Update status error");
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Notify customer about status update
   */
  async notifyCustomerStatusUpdate(commission) {
    try {
      const emailService = (await import("./emailService.js")).default;
      const customer = await commission.populate("customerId");

      const statusMessages = {
        approved:
          "Your design has been approved! We're starting work on your bespoke piece.",
        in_progress: "Your bespoke commission is now in progress.",
        completed: "Your bespoke piece is complete! Preparing for delivery.",
        delivered: "Your bespoke piece has been delivered!",
      };

      const message = statusMessages[commission.status] || "Status updated";

      const html = `
        <h1>✨ Commission Update</h1>
        <p>Hi ${customer.customerId.name},</p>
        <p>${message}</p>
        <p><strong>Commission:</strong> ${commission.commissionNumber}</p>
        <p><a href="https://haorivision.com/commissions/${commission._id}">View Commission</a></p>
      `;

      await emailService.sendCustomEmail(
        customer.customerId.email,
        `✨ Commission Update — ${commission.commissionNumber}`,
        html,
      );

      return { success: true };
    } catch (error) {
      baseLogger.error({ err: error }, "Notify customer error");
      return { success: false };
    }
  }

  /**
   * Get available consultation slots
   */
  async getAvailableSlots(startDate, endDate) {
    try {
      // Get existing consultations
      const existingConsultations = await BespokeCommission.find({
        "consultation.scheduledDate": {
          $gte: startDate,
          $lte: endDate,
        },
        "consultation.status": { $ne: "cancelled" },
      }).select("consultation.scheduledDate consultation.duration");

      // Generate all possible slots (9 AM - 6 PM, 1-hour intervals)
      const slots = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        for (let hour = 9; hour <= 17; hour++) {
          const slotTime = new Date(current);
          slotTime.setHours(hour, 0, 0, 0);

          // Skip weekends
          if (slotTime.getDay() === 0 || slotTime.getDay() === 6) {
            continue;
          }

          // Check if slot is taken
          const isTaken = existingConsultations.some((cons) => {
            const consDate = new Date(cons.consultation.scheduledDate);
            const consEnd = new Date(
              consDate.getTime() + cons.consultation.duration * 60000,
            );
            const slotEnd = new Date(slotTime.getTime() + 60 * 60000);

            return (
              (slotTime >= consDate && slotTime < consEnd) ||
              (slotEnd > consDate && slotEnd <= consEnd)
            );
          });

          if (!isTaken) {
            slots.push({
              time: slotTime,
              available: true,
            });
          }
        }

        current.setDate(current.getDate() + 1);
      }

      return slots;
    } catch (error) {
      baseLogger.error({ err: error }, "Get available slots error");
      return [];
    }
  }

  /**
   * Get commission stats
   */
  async getStats() {
    try {
      const total = await BespokeCommission.countDocuments();
      const byStatus = await BespokeCommission.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const avgPrice = await BespokeCommission.aggregate([
        {
          $match: { "pricing.totalPrice": { $exists: true } },
        },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$pricing.totalPrice" },
          },
        },
      ]);

      return {
        total: total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        avgPrice: avgPrice.length > 0 ? avgPrice[0].avgPrice : 0,
      };
    } catch (error) {
      baseLogger.error({ err: error }, "Get stats error");
      return null;
    }
  }
}

export default new BespokeService();
