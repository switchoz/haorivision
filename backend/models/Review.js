import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    productId: { type: String, default: null },
    productName: { type: String, default: null },
    photo: { type: String, default: null },
    approved: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ approved: 1, featured: -1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
