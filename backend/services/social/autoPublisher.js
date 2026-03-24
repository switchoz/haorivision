import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tiktokService from "./tiktokService.js";
import instagramService from "./instagramService.js";
import Product from "../../models/Product.js";
import SocialPost from "../../models/SocialPost.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto Publisher Service
 * Automatically publishes content from /public/media/ to TikTok and Instagram
 */

class AutoPublisher {
  constructor() {
    this.mediaPath = path.join(__dirname, "../../../public/media");
    this.reelsPath = path.join(this.mediaPath, "reels");
    this.postsPath = path.join(this.mediaPath, "posts");
  }

  /**
   * Publish all pending media
   */
  async publishPendingMedia() {
    try {
      console.log("\n🚀 Starting auto-publishing process...\n");

      // Get all media files
      const reels = this.getMediaFiles(this.reelsPath, [".mp4", ".mov"]);
      const posts = this.getMediaFiles(this.postsPath, [".jpg", ".png"]);

      console.log(`Found ${reels.length} reels and ${posts.length} posts`);

      // Publish reels to TikTok and Instagram
      for (const reel of reels) {
        await this.publishReel(reel);
      }

      // Publish posts to Instagram
      for (const post of posts) {
        await this.publishPost(post);
      }

      console.log("\n✅ Auto-publishing complete!\n");
    } catch (error) {
      console.error("❌ Auto-publishing error:", error);
    }
  }

  /**
   * Get media files from directory
   */
  getMediaFiles(directory, extensions) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(directory);

    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext) && !file.startsWith(".");
      })
      .map((file) => ({
        filename: file,
        path: path.join(directory, file),
        productId: this.extractProductId(file),
      }));
  }

  /**
   * Extract product ID from filename
   * Example: "twin-001-mycelium_reel1.mp4" → "twin-001-mycelium"
   */
  extractProductId(filename) {
    const match = filename.match(/^([a-z]+-\d+-[a-z-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Publish reel to TikTok and Instagram
   */
  async publishReel(reel) {
    try {
      console.log(`\n📹 Publishing reel: ${reel.filename}`);

      // Get product data
      const product = reel.productId
        ? await Product.findOne({ id: reel.productId })
        : null;

      if (!product) {
        console.log("⚠️  No product found, skipping...");
        return;
      }

      // Check if already published
      const existingPost = await SocialPost.findOne({
        filename: reel.filename,
        publishedAt: { $ne: null },
      });

      if (existingPost) {
        console.log("⏭️  Already published, skipping...");
        return;
      }

      // Generate content
      const tiktokCaption = tiktokService.formatDescription(product);
      const instagramCaption = instagramService.formatCaption(product);

      console.log("📤 Uploading to TikTok...");
      const tiktokResult = await tiktokService.uploadVideo(reel.path, {
        title: product.name,
        description: tiktokCaption,
      });

      console.log("📤 Uploading to Instagram...");
      const instagramResult = await instagramService.uploadReel(
        reel.path,
        instagramCaption,
        product.tiktokProductId
          ? [
              {
                productId: product.catalogProductId,
                x: 0.5,
                y: 0.8,
              },
            ]
          : [],
      );

      // Tag product in TikTok video
      if (tiktokResult.success && product.tiktokProductId) {
        await tiktokService.tagProductInVideo(
          tiktokResult.publishId,
          product.tiktokProductId,
        );
      }

      // Save to database
      await SocialPost.create({
        filename: reel.filename,
        productId: product.id,
        type: "reel",
        platforms: {
          tiktok: {
            published: tiktokResult.success,
            publishId: tiktokResult.publishId,
            url: tiktokResult.url,
          },
          instagram: {
            published: instagramResult.success,
            mediaId: instagramResult.mediaId,
            url: instagramResult.permalink,
          },
        },
        caption: {
          tiktok: tiktokCaption,
          instagram: instagramCaption,
        },
        publishedAt: new Date(),
      });

      console.log(`✅ Reel published successfully!`);
    } catch (error) {
      console.error(`❌ Error publishing reel: ${error.message}`);
    }
  }

  /**
   * Publish photo to Instagram
   */
  async publishPost(post) {
    try {
      console.log(`\n📸 Publishing post: ${post.filename}`);

      // Get product data
      const product = post.productId
        ? await Product.findOne({ id: post.productId })
        : null;

      if (!product) {
        console.log("⚠️  No product found, skipping...");
        return;
      }

      // Check if already published
      const existingPost = await SocialPost.findOne({
        filename: post.filename,
        publishedAt: { $ne: null },
      });

      if (existingPost) {
        console.log("⏭️  Already published, skipping...");
        return;
      }

      // Generate caption
      const caption = instagramService.formatCaption(product);

      console.log("📤 Uploading to Instagram...");
      const result = await instagramService.uploadPhoto(
        post.path,
        caption,
        product.catalogProductId
          ? [
              {
                productId: product.catalogProductId,
                x: 0.5,
                y: 0.5,
              },
            ]
          : [],
      );

      // Save to database
      await SocialPost.create({
        filename: post.filename,
        productId: product.id,
        type: "post",
        platforms: {
          instagram: {
            published: result.success,
            mediaId: result.mediaId,
            url: result.permalink,
          },
        },
        caption: {
          instagram: caption,
        },
        publishedAt: new Date(),
      });

      console.log(`✅ Post published successfully!`);
    } catch (error) {
      console.error(`❌ Error publishing post: ${error.message}`);
    }
  }

  /**
   * Sync all products to TikTok Shop and Instagram Shopping
   */
  async syncAllProducts() {
    try {
      console.log("\n🔄 Syncing all products to social platforms...\n");

      const products = await Product.find({ status: "available" });

      for (const product of products) {
        console.log(`\nSyncing: ${product.name}`);

        // Sync to TikTok Shop
        const tiktokResult = await tiktokService.syncProduct(product);
        if (tiktokResult.success) {
          product.tiktokProductId = tiktokResult.productId;
          console.log(`✅ TikTok Shop synced`);
        }

        // Sync to Instagram Shopping
        const instagramResult = await instagramService.syncProduct(product);
        if (instagramResult.success) {
          product.catalogProductId = instagramResult.productId;
          console.log(`✅ Instagram Shopping synced`);
        }

        await product.save();
      }

      console.log("\n✅ All products synced!\n");
    } catch (error) {
      console.error("❌ Product sync error:", error);
    }
  }

  /**
   * Schedule automatic publishing (run daily)
   */
  scheduleAutoPublish() {
    // Run every day at 12:00 PM
    const publishTime = { hour: 12, minute: 0 };

    setInterval(() => {
      const now = new Date();
      if (
        now.getHours() === publishTime.hour &&
        now.getMinutes() === publishTime.minute
      ) {
        this.publishPendingMedia();
      }
    }, 60000); // Check every minute

    console.log(
      `📅 Auto-publish scheduled for ${publishTime.hour}:${publishTime.minute} daily`,
    );
  }
}

export default new AutoPublisher();
