import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

/**
 * TikTok Shop Integration Service
 * Handles video uploads, product tagging, and shop integration
 */

class TikTokService {
  constructor() {
    this.accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    this.appKey = process.env.TIKTOK_APP_KEY;
    this.appSecret = process.env.TIKTOK_APP_SECRET;
    this.shopId = process.env.TIKTOK_SHOP_ID;
  }

  /**
   * Upload video to TikTok
   */
  async uploadVideo(videoPath, metadata) {
    try {
      console.log(`📹 Uploading video to TikTok: ${videoPath}`);

      // Step 1: Initialize upload
      const initResponse = await axios.post(
        `${TIKTOK_API_BASE}/post/publish/video/init/`,
        {
          post_info: {
            title: metadata.title,
            description: metadata.description,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: fs.statSync(videoPath).size,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const { upload_url, publish_id } = initResponse.data.data;

      // Step 2: Upload video file
      const formData = new FormData();
      formData.append("video", fs.createReadStream(videoPath));

      await axios.post(upload_url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      console.log(`✅ Video uploaded! Publish ID: ${publish_id}`);

      return {
        success: true,
        publishId: publish_id,
        message: "Video uploaded successfully",
      };
    } catch (error) {
      console.error(
        "❌ TikTok upload error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Tag product in video (TikTok Shop)
   */
  async tagProductInVideo(publishId, productId) {
    try {
      console.log(`🏷️  Tagging product ${productId} in video ${publishId}`);

      const response = await axios.post(
        `${TIKTOK_API_BASE}/shop/video/tag/`,
        {
          publish_id: publishId,
          product_ids: [productId],
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Product tagged successfully");

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "❌ Product tagging error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId) {
    try {
      const response = await axios.get(`${TIKTOK_API_BASE}/video/query/`, {
        params: {
          fields:
            "id,title,video_description,create_time,cover_image_url,share_url,view_count,like_count,comment_count,share_count,download_count",
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        success: true,
        analytics: response.data.data,
      };
    } catch (error) {
      console.error("❌ Analytics fetch error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create TikTok Shop product
   */
  async createShopProduct(productData) {
    try {
      console.log(`🛒 Creating TikTok Shop product: ${productData.title}`);

      const response = await axios.post(
        `https://open-api.tiktokglobalshop.com/api/products`,
        {
          product_name: productData.title,
          description: productData.description,
          category_id: productData.categoryId || "201107", // Fashion category
          brand_id: productData.brandId,
          main_images: productData.images,
          price: {
            currency: "USD",
            original_price: productData.price.toString(),
          },
          stock: productData.stock,
          product_attributes: productData.attributes || [],
          package_dimensions: {
            length: "30",
            width: "20",
            height: "5",
            unit: "CENTIMETER",
          },
          package_weight: {
            value: "0.5",
            unit: "KILOGRAM",
          },
        },
        {
          headers: {
            "x-tts-access-token": this.accessToken,
            "Content-Type": "application/json",
          },
        },
      );

      const productId = response.data.data.product_id;
      console.log(`✅ TikTok Shop product created! ID: ${productId}`);

      return {
        success: true,
        productId: productId,
        data: response.data.data,
      };
    } catch (error) {
      console.error(
        "❌ Product creation error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync product with TikTok Shop
   */
  async syncProduct(product) {
    try {
      // Check if product already exists
      const existingProduct = await this.findProductBySKU(product.id);

      if (existingProduct) {
        // Update existing product
        return await this.updateShopProduct(
          existingProduct.product_id,
          product,
        );
      } else {
        // Create new product
        return await this.createShopProduct({
          title: product.name,
          description: product.description.long,
          price: product.price,
          stock: product.editions.remaining,
          images: [
            product.images.daylight.hero,
            product.images.uv.hero,
            product.images.daylight.haori,
            product.images.uv.haori,
          ],
          attributes: [
            { name: "Collection", value: product.collection },
            { name: "UV Colors", value: product.uvColors.join(", ") },
            {
              name: "Edition",
              value: `Limited to ${product.editions.total} pieces`,
            },
          ],
        });
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
   * Find product by SKU
   */
  async findProductBySKU(sku) {
    try {
      const response = await axios.get(
        `https://open-api.tiktokglobalshop.com/api/products/search`,
        {
          params: {
            seller_sku: sku,
          },
          headers: {
            "x-tts-access-token": this.accessToken,
          },
        },
      );

      const products = response.data.data?.products || [];
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error("❌ Product search error:", error.message);
      return null;
    }
  }

  /**
   * Update shop product
   */
  async updateShopProduct(productId, productData) {
    try {
      console.log(`🔄 Updating TikTok Shop product: ${productId}`);

      const response = await axios.put(
        `https://open-api.tiktokglobalshop.com/api/products/${productId}`,
        {
          product_name: productData.name,
          description: productData.description.long,
          price: {
            currency: "USD",
            original_price: productData.price.toString(),
          },
          stock: productData.editions.remaining,
        },
        {
          headers: {
            "x-tts-access-token": this.accessToken,
            "Content-Type": "application/json",
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
   * Generate hashtags for video
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
    ];

    const collectionHashtags = {
      "Mycelium Dreams": ["#mycelium", "#biomorphic", "#natureart"],
      "Void Bloom": ["#voidbloom", "#cosmic", "#minimalism"],
      "Neon Ancestors": ["#neonancestors", "#calligraphy", "#cyberpunk"],
    };

    const specificHashtags = collectionHashtags[product.collection] || [];

    return [...baseHashtags, ...specificHashtags, "#tiktokshop", "#shopnow"];
  }

  /**
   * Format description with hashtags
   */
  formatDescription(product, customText = "") {
    const hashtags = this.generateHashtags(product);

    const description =
      customText ||
      `
${product.name} — ${product.tagline}

Limited edition ${product.editions.remaining}/${product.editions.total}

✨ Hand-painted UV-reactive art
🎨 Transforms in UV light
💫 One-of-a-kind wearable piece

${hashtags.join(" ")}

Shop now 👇
    `.trim();

    return description;
  }
}

export default new TikTokService();
