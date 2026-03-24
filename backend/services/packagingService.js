import Packaging from "../models/Packaging.js";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Packaging Service
 * QR-коды, unboxing tracking, печатные карточки
 */

class PackagingService {
  /**
   * Создать упаковку для заказа
   */
  async createPackaging(order, product, customer) {
    try {
      console.log(`📦 Creating packaging for order ${order.orderNumber}`);

      // Generate unique QR code
      const qrCodeData = uuidv4();
      const qrUrl = `https://haorivision.com/unboxing/${qrCodeData}`;

      // Generate QR code image
      const qrImagePath = await this.generateQRCodeImage(qrCodeData, qrUrl);

      // Create packaging record
      const packaging = new Packaging({
        orderId: order._id,
        productId: product._id,
        customerId: customer._id,
        qrCode: {
          code: qrCodeData,
          url: qrUrl,
          imageUrl: `/qr-codes/${qrCodeData}.png`,
        },
        content: {
          nftUrl: order.nft?.openseaUrl || "",
          creationVideoUrl: `https://haorivision.com/stories/${product.slug}/creation`,
          artistStoryUrl: "https://haorivision.com/artist/story",
          careInstructionsUrl: "https://haorivision.com/care-instructions",
        },
        printedCard: {
          edition: `Edition #${order.items[0]?.editionNumber || "?"} of ${product.editions?.total || 50}`,
          message: this.generateCardMessage(product),
          artistSignature: "Painted with light by HAORI VISION",
          qrCodePrintUrl: `/qr-codes/${qrCodeData}.png`,
        },
      });

      await packaging.save();

      console.log(`✅ Packaging created with QR code: ${qrCodeData}`);

      return {
        success: true,
        packaging: packaging,
        qrCode: qrCodeData,
        qrUrl: qrUrl,
      };
    } catch (error) {
      console.error("Create packaging error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate QR code image
   */
  async generateQRCodeImage(code, url) {
    try {
      const qrDir = path.join(__dirname, "../../public/qr-codes");

      // Ensure directory exists
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }

      const filePath = path.join(qrDir, `${code}.png`);

      // Generate QR code
      await QRCode.toFile(filePath, url, {
        width: 500,
        margin: 2,
        color: {
          dark: "#7c3aed", // Purple
          light: "#ffffff",
        },
      });

      return filePath;
    } catch (error) {
      console.error("Generate QR code error:", error);
      return null;
    }
  }

  /**
   * Generate card message
   */
  generateCardMessage(product) {
    const messages = {
      "Phantom Light":
        "Born in darkness, revealed in UV light.\nThis haori carries the essence of transformation.",
      Eclipse:
        "Between light and shadow lies infinite possibility.\nYou now hold that balance.",
      "Neon Dreams":
        "Electric dreams materialized in fabric and fluorescence.\nThe future is wearable.",
      "Void Walker":
        "Navigate the spaces between realities.\nYour journey through darkness begins.",
      Celestial:
        "Hand-painted constellations guide your path.\nYou are written in the stars.",
    };

    return (
      messages[product.collection] ||
      "This garment was painted by hand in the light of darkness.\nYou are now part of the Vision."
    );
  }

  /**
   * Track QR code scan
   */
  async trackQRScan(qrCode, scanData) {
    try {
      const packaging = await Packaging.findOne({ "qrCode.code": qrCode });

      if (!packaging) {
        return {
          success: false,
          error: "QR code not found",
        };
      }

      // Update unboxing data
      packaging.unboxing.scanned = true;
      packaging.unboxing.scannedAt = new Date();
      packaging.unboxing.device = scanData.device;
      packaging.unboxing.userAgent = scanData.userAgent;

      if (scanData.location) {
        packaging.unboxing.location = scanData.location;
      }

      await packaging.save();

      console.log(`✅ QR scan tracked: ${qrCode}`);

      // Trigger post-unboxing email workflow
      await this.sendUnboxingEmail(packaging);

      return {
        success: true,
        packaging: packaging,
      };
    } catch (error) {
      console.error("Track QR scan error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send unboxing email workflow
   */
  async sendUnboxingEmail(packaging) {
    try {
      // Import here to avoid circular dependency
      const emailWorkflowService = (await import("./emailWorkflowService.js"))
        .default;

      const customer = await packaging.populate("customerId");
      const product = await packaging.populate("productId");

      // Send "How does your Light feel?" email
      await emailWorkflowService.sendUnboxingWorkflow(
        customer.customerId,
        product.productId,
        packaging,
      );

      return { success: true };
    } catch (error) {
      console.error("Send unboxing email error:", error);
      return { success: false };
    }
  }

  /**
   * Submit unboxing feedback
   */
  async submitFeedback(qrCode, feedbackData) {
    try {
      const packaging = await Packaging.findOne({ "qrCode.code": qrCode });

      if (!packaging) {
        return {
          success: false,
          error: "Packaging not found",
        };
      }

      packaging.feedback.received = true;
      packaging.feedback.rating = feedbackData.rating;
      packaging.feedback.message = feedbackData.message;
      packaging.feedback.photos = feedbackData.photos || [];
      packaging.feedback.submittedAt = new Date();

      await packaging.save();

      // Analyze sentiment if message provided
      if (feedbackData.message) {
        const sentimentService = (await import("./sentimentAnalysisService.js"))
          .default;

        await sentimentService.analyzeAndSaveReview({
          reviewId: `unboxing_${packaging._id}`,
          productId: packaging.productId,
          clientId: packaging.customerId,
          text: feedbackData.message,
          rating: feedbackData.rating,
          source: "unboxing",
        });
      }

      return {
        success: true,
        packaging: packaging,
      };
    } catch (error) {
      console.error("Submit feedback error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get packaging by QR code
   */
  async getPackagingByQR(qrCode) {
    try {
      const packaging = await Packaging.findOne({ "qrCode.code": qrCode })
        .populate("orderId")
        .populate("productId")
        .populate("customerId");

      return packaging;
    } catch (error) {
      console.error("Get packaging error:", error);
      return null;
    }
  }

  /**
   * Get unboxing stats
   */
  async getUnboxingStats() {
    try {
      const total = await Packaging.countDocuments();
      const scanned = await Packaging.countDocuments({
        "unboxing.scanned": true,
      });
      const withFeedback = await Packaging.countDocuments({
        "feedback.received": true,
      });

      const avgRating = await Packaging.aggregate([
        { $match: { "feedback.received": true } },
        { $group: { _id: null, avgRating: { $avg: "$feedback.rating" } } },
      ]);

      return {
        total: total,
        scanned: scanned,
        scanRate: total > 0 ? ((scanned / total) * 100).toFixed(1) : 0,
        withFeedback: withFeedback,
        feedbackRate:
          scanned > 0 ? ((withFeedback / scanned) * 100).toFixed(1) : 0,
        avgRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(1) : 0,
      };
    } catch (error) {
      console.error("Get unboxing stats error:", error);
      return null;
    }
  }

  /**
   * Generate printable card PDF
   */
  async generatePrintableCard(packaging) {
    try {
      const PDFDocument = (await import("pdfkit")).default;

      await packaging.populate("productId");
      await packaging.populate("customerId");

      const product = packaging.productId;
      const customer = packaging.customerId;

      const fileName = `card-${packaging.qrCode.code}.pdf`;
      const filePath = path.join(__dirname, "../../data/cards", fileName);

      // Ensure directory exists
      const cardsDir = path.join(__dirname, "../../data/cards");
      if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
      }

      // Create PDF
      const doc = new PDFDocument({
        size: [300, 200], // Card size in points (roughly 105mm x 70mm)
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Background
      doc.rect(0, 0, 300, 200).fill("#0a0a0a");

      // Border
      doc.rect(10, 10, 280, 180).lineWidth(1).strokeColor("#7c3aed").stroke();

      // HAORI VISION logo (text)
      doc
        .fontSize(16)
        .fillColor("#a78bfa")
        .font("Helvetica-Bold")
        .text("HAORI VISION", 20, 25, { align: "center", width: 260 });

      // Message
      doc
        .fontSize(9)
        .fillColor("#ffffff")
        .font("Helvetica")
        .text(packaging.printedCard.message, 20, 60, {
          align: "center",
          width: 260,
          lineGap: 3,
        });

      // Edition
      doc
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(packaging.printedCard.edition, 20, 120, {
          align: "center",
          width: 260,
        });

      // QR Code (add as image)
      if (packaging.qrCode.imageUrl) {
        const qrPath = path.join(
          __dirname,
          "../../public",
          packaging.qrCode.imageUrl,
        );
        if (fs.existsSync(qrPath)) {
          doc.image(qrPath, 125, 140, { width: 50, height: 50 });
        }
      }

      // Artist signature
      doc
        .fontSize(7)
        .fillColor("#7c3aed")
        .font("Helvetica-Oblique")
        .text(packaging.printedCard.artistSignature, 20, 170, {
          align: "center",
          width: 260,
        });

      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      console.log(`✅ Printable card generated: ${fileName}`);

      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        url: `/cards/${fileName}`,
      };
    } catch (error) {
      console.error("Generate printable card error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new PackagingService();
