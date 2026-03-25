import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true }, // % or fixed amount
    currency: { type: String, default: "USD" },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ active: 1, expiresAt: 1 });

export default mongoose.model("PromoCode", promoCodeSchema);
