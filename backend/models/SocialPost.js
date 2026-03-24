import mongoose from "mongoose";

const socialPostSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["reel", "post", "story"],
      required: true,
    },
    platforms: {
      tiktok: {
        published: Boolean,
        publishId: String,
        url: String,
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        addToCart: { type: Number, default: 0 },
      },
      instagram: {
        published: Boolean,
        mediaId: String,
        url: String,
        impressions: { type: Number, default: 0 },
        reach: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        saved: { type: Number, default: 0 },
        productClicks: { type: Number, default: 0 },
      },
    },
    caption: {
      tiktok: String,
      instagram: String,
    },
    hashtags: [String],
    publishedAt: {
      type: Date,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
socialPostSchema.index({ productId: 1, publishedAt: -1 });
socialPostSchema.index({ filename: 1 }, { unique: true });

export const SocialPost = mongoose.model("SocialPost", socialPostSchema);
export default SocialPost;
