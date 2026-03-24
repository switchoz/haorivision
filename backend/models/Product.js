import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    productCollection: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
      required: true,
    },
    description: {
      short: String,
      long: String,
      story: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    cryptoPrice: {
      eth: Number,
      btc: Number,
    },
    images: {
      daylight: {
        hero: String,
        haori: String,
        canvas: String,
        detail1: String,
        detail2: String,
      },
      uv: {
        hero: String,
        haori: String,
        canvas: String,
        detail1: String,
        detail2: String,
      },
    },
    editions: {
      total: {
        type: Number,
        required: true,
      },
      remaining: {
        type: Number,
        required: true,
      },
      sold: {
        type: Number,
        default: 0,
      },
    },
    uvColors: [String],
    techniques: [String],
    materials: [String],
    dimensions: {
      length: String,
      width: String,
      sleeves: String,
    },
    weight: String,
    status: {
      type: String,
      enum: ["coming-soon", "available", "low-stock", "sold-out", "archived"],
      default: "available",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    artist: {
      name: String,
      signature: String,
      bio: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Update status based on remaining editions
productSchema.pre("save", function (next) {
  if (this.editions.remaining === 0) {
    this.status = "sold-out";
  } else if (this.editions.remaining <= 2) {
    this.status = "low-stock";
  } else {
    this.status = "available";
  }
  next();
});

productSchema.index({ status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ productCollection: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
