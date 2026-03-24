import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const INSTAGRAM_API_BASE = "https://graph.instagram.com/v18.0";
const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v18.0";

/**
 * Instagram Shopping Integration Service
 * Handles posts, reels, product tagging, and Instagram Shopping
 */

class InstagramService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.catalogId = process.env.FACEBOOK_CATALOG_ID;
  }

  /**
   * Upload photo to Instagram
   */
  async uploadPhoto(imagePath, caption, productTags = []) {
    try {
      console.log(`📸 Uploading photo to Instagram: ${imagePath}`);

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${INSTAGRAM_API_BASE}/${this.businessAccountId}/media`,
        {
          image_url: imagePath, // Must be publicly accessible URL
          caption: caption,
          product_tags: productTags.map((tag) => ({
            product_id: tag.productId,
            x: tag.x || 0.5,
            y: tag.y || 0.5,
          })),
        },
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish media
      const publishResponse = await axios.post(
        `${INSTAGRAM_API_BASE}/${this.businessAccountId}/media_publish`,
        {
          creation_id: containerId,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      const mediaId = publishResponse.data.id;
      console.log(`✅ Photo posted! Media ID: ${mediaId}`);

      return {
        success: true,
        mediaId: mediaId,
        permalink: await this.getMediaPermalink(mediaId),
      };
    } catch (error) {
      console.error(
        "❌ Instagram photo upload error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Upload Reel to Instagram
   */
  async uploadReel(videoPath, caption, productTags = [], coverImageUrl = null) {
    try {
      console.log(`🎬 Uploading Reel to Instagram: ${videoPath}`);

      // Step 1: Create reel container
      const containerData = {
        media_type: "REELS",
        video_url: videoPath, // Must be publicly accessible URL
        caption: caption,
        share_to_feed: true,
      };

      if (coverImageUrl) {
        containerData.cover_url = coverImageUrl;
      }

      if (productTags.length > 0) {
        containerData.product_tags = productTags.map((tag) => ({
          product_id: tag.productId,
          x: tag.x || 0.5,
          y: tag.y || 0.5,
        }));
      }

      const containerResponse = await axios.post(
        `${INSTAGRAM_API_BASE}/${this.businessAccountId}/media`,
        containerData,
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      const containerId = containerResponse.data.id;

      // Step 2: Wait for processing (poll status)
      await this.waitForMediaProcessing(containerId);

      // Step 3: Publish reel
      const publishResponse = await axios.post(
        `${INSTAGRAM_API_BASE}/${this.businessAccountId}/media_publish`,
        {
          creation_id: containerId,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      const mediaId = publishResponse.data.id;
      console.log(`✅ Reel posted! Media ID: ${mediaId}`);

      return {
        success: true,
        mediaId: mediaId,
        permalink: await this.getMediaPermalink(mediaId),
      };
    } catch (error) {
      console.error(
        "❌ Instagram Reel upload error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Wait for media processing (for videos)
   */
  async waitForMediaProcessing(containerId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${INSTAGRAM_API_BASE}/${containerId}`,
          {
            params: {
              fields: "status_code",
              access_token: this.accessToken,
            },
          },
        );

        const statusCode = response.data.status_code;

        if (statusCode === "FINISHED") {
          console.log("✅ Media processing complete");
          return true;
        } else if (statusCode === "ERROR") {
          throw new Error("Media processing failed");
        }

        // Wait 2 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error checking media status:", error.message);
      }
    }

    throw new Error("Media processing timeout");
  }

  /**
   * Get media permalink
   */
  async getMediaPermalink(mediaId) {
    try {
      const response = await axios.get(`${INSTAGRAM_API_BASE}/${mediaId}`, {
        params: {
          fields: "permalink",
          access_token: this.accessToken,
        },
      });

      return response.data.permalink;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get media insights (analytics)
   */
  async getMediaInsights(mediaId) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_API_BASE}/${mediaId}/insights`,
        {
          params: {
            metric:
              "impressions,reach,engagement,saved,video_views,likes,comments,shares",
            access_token: this.accessToken,
          },
        },
      );

      const insights = {};
      response.data.data.forEach((metric) => {
        insights[metric.name] = metric.values[0].value;
      });

      return {
        success: true,
        insights: insights,
      };
    } catch (error) {
      console.error("❌ Insights fetch error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create product in Facebook Catalog (for Instagram Shopping)
   */
  async createCatalogProduct(productData) {
    try {
      console.log(`🛍️  Creating catalog product: ${productData.name}`);

      const response = await axios.post(
        `${FACEBOOK_GRAPH_API}/${this.catalogId}/products`,
        {
          retailer_id: productData.id, // Your internal product ID
          name: productData.name,
          description: productData.description,
          url: `https://haorivision.com/product/${productData.id}`,
          image_url: productData.imageUrl,
          brand: "HAORI VISION",
          price: productData.price * 100, // Price in cents
          currency: "USD",
          availability: productData.stock > 0 ? "in stock" : "out of stock",
          condition: "new",
          custom_label_0: productData.collection,
          custom_label_1: productData.uvColors?.join(", ") || "",
          inventory: productData.stock,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      const productId = response.data.id;
      console.log(`✅ Catalog product created! ID: ${productId}`);

      return {
        success: true,
        productId: productId,
      };
    } catch (error) {
      console.error(
        "❌ Catalog product creation error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update catalog product
   */
  async updateCatalogProduct(productId, updates) {
    try {
      console.log(`🔄 Updating catalog product: ${productId}`);

      const response = await axios.post(
        `${FACEBOOK_GRAPH_API}/${productId}`,
        updates,
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

      console.log("✅ Product updated successfully");

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Product update error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync product with Instagram Shopping
   */
  async syncProduct(product) {
    try {
      // Check if product exists in catalog
      const existingProduct = await this.findCatalogProduct(product.id);

      const productData = {
        id: product.id,
        name: product.name,
        description: product.description.short,
        imageUrl: product.images.uv.hero,
        price: product.price,
        stock: product.editions.remaining,
        collection: product.collection,
        uvColors: product.uvColors,
      };

      if (existingProduct) {
        // Update existing
        return await this.updateCatalogProduct(existingProduct.id, {
          name: productData.name,
          price: productData.price * 100,
          inventory: productData.stock,
          availability: productData.stock > 0 ? "in stock" : "out of stock",
        });
      } else {
        // Create new
        return await this.createCatalogProduct(productData);
      }
    } catch (error) {
      console.error("❌ Product sync error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find product in catalog by retailer_id
   */
  async findCatalogProduct(retailerId) {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.catalogId}/products`,
        {
          params: {
            filter: JSON.stringify({ retailer_id: { eq: retailerId } }),
            access_token: this.accessToken,
          },
        },
      );

      const products = response.data.data || [];
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error("❌ Product search error:", error.message);
      return null;
    }
  }

  /**
   * Generate hashtags for Instagram
   */
  generateHashtags(product) {
    const baseHashtags = [
      "#haorivision",
      "#wearlight",
      "#fluoglow",
      "#artfashion2025",
      "#wearableart",
      "#uvart",
      "#neonart",
      "#haori",
      "#japanesefashion",
      "#artfashion",
    ];

    const collectionHashtags = {
      "Mycelium Dreams": ["#myceliumart", "#biomorphic", "#natureinspired"],
      "Void Bloom": ["#voidbloom", "#cosmicart", "#minimalistart"],
      "Neon Ancestors": ["#neonvibes", "#calligraphyart", "#cyberpunkfashion"],
    };

    const specificHashtags = collectionHashtags[product.collection] || [];

    const instagramSpecific = [
      "#instagramshopping",
      "#shopnow",
      "#limitededition",
      "#handmade",
      "#uniquefashion",
    ];

    return [...baseHashtags, ...specificHashtags, ...instagramSpecific];
  }

  /**
   * Format caption with hashtags
   */
  formatCaption(product, customText = "") {
    const hashtags = this.generateHashtags(product);

    const caption =
      customText ||
      `
✨ ${product.name} ✨

${product.tagline}

Limited edition ${product.editions.remaining}/${product.editions.total}

🎨 Hand-painted UV-reactive art
💫 Transforms under UV light
🌟 One-of-a-kind wearable masterpiece

Tap to shop 👆

${hashtags.join(" ")}
    `.trim();

    return caption;
  }

  /**
   * Schedule post (using Creator Studio API)
   */
  async schedulePost(mediaData, publishTime) {
    // Note: This requires Facebook Creator Studio API access
    // Implementation depends on specific requirements
    console.log(
      "📅 Post scheduling feature - requires Creator Studio integration",
    );

    return {
      success: false,
      message: "Scheduling requires Creator Studio API - see documentation",
    };
  }
}

export default new InstagramService();
