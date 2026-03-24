import mongoose from "mongoose";

/**
 * Bespoke Commission Model
 * Индивидуальные заказы HAORI VISION
 */

const bespokeCommissionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  // Номер заказа
  commissionNumber: {
    type: String,
    unique: true,
    required: true,
  },

  // Статус
  status: {
    type: String,
    enum: [
      "submitted", // Заявка подана
      "moodboard_created", // Moodboard сгенерирован
      "consultation_scheduled", // Консультация назначена
      "consultation_completed", // Консультация прошла
      "approved", // Дизайн утверждён
      "in_progress", // В работе
      "completed", // Завершено
      "delivered", // Доставлено
      "cancelled", // Отменено
    ],
    default: "submitted",
  },

  // Клиентский запрос
  brief: {
    energy: String, // "Calm and mysterious"
    colors: [String], // ["Deep purple", "Electric blue"]
    emotions: [String], // ["Peace", "Wonder", "Power"]
    style: String, // "Minimalist" / "Bold" / "Ethereal"
    inspiration: String, // "Night sky, bioluminescence"
    story: String, // Personal story behind the commission
    referenceImages: [String], // URLs to inspiration images
  },

  // AI-generated moodboard
  moodboard: {
    generated: {
      type: Boolean,
      default: false,
    },
    generatedAt: Date,
    imageUrl: String,
    colorPalette: [
      {
        hex: String,
        name: String,
        uvReactive: Boolean,
      },
    ],
    visualReferences: [String],
    aiAnalysis: String, // Claude's interpretation
    aiSuggestions: [String], // Design suggestions
  },

  // Консультация
  consultation: {
    requested: {
      type: Boolean,
      default: false,
    },
    scheduledDate: Date,
    duration: Number, // minutes
    type: {
      type: String,
      enum: ["video", "in_person"],
      default: "video",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: String,
    recordingUrl: String,
  },

  // Спецификация заказа
  specifications: {
    garmentType: {
      type: String,
      enum: ["haori", "haori_set", "painting", "custom"],
      default: "haori",
    },
    size: String, // S, M, L, XL, Custom
    customMeasurements: {
      chest: Number,
      shoulders: Number,
      length: Number,
      sleeves: Number,
    },
    fabric: {
      type: String,
      base: String, // "Black silk"
      texture: String, // "Smooth" / "Textured"
      weight: String, // "Light" / "Medium" / "Heavy"
    },
    uvColors: [String],
    designElements: [String], // ["Geometric patterns", "Organic flows"]
    additionalItems: [
      {
        type: String, // "matching_pants", "artwork", "tote_bag"
        quantity: Number,
        price: Number,
      },
    ],
  },

  // Pricing
  pricing: {
    basePrice: Number,
    complexityMultiplier: Number, // 1.0 - 3.0
    additionalItemsPrice: Number,
    discount: Number,
    totalPrice: Number,
    currency: {
      type: String,
      default: "USD",
    },
    depositRequired: Number, // 50% upfront
    depositPaid: {
      type: Boolean,
      default: false,
    },
    depositPaidAt: Date,
  },

  // Timeline
  timeline: {
    estimatedDuration: Number, // days
    startDate: Date,
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
    milestones: [
      {
        name: String,
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
        },
        completedAt: Date,
      },
    ],
  },

  // Artist notes
  artistNotes: {
    designNotes: String,
    technicalNotes: String,
    progressUpdates: [
      {
        date: Date,
        update: String,
        images: [String],
      },
    ],
  },

  // Final delivery
  delivery: {
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    shippingMethod: String,
    trackingNumber: String,
    deliveredAt: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

bespokeCommissionSchema.index({ customerId: 1 });
bespokeCommissionSchema.index({ status: 1 });
bespokeCommissionSchema.index({ "consultation.scheduledDate": 1 });
bespokeCommissionSchema.index({ createdAt: -1 });

// Auto-update updatedAt
bespokeCommissionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const BespokeCommission = mongoose.model(
  "BespokeCommission",
  bespokeCommissionSchema,
);

export default BespokeCommission;
