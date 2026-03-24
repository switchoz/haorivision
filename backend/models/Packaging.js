import mongoose from "mongoose";

/**
 * Packaging Model - QR код и unboxing tracking
 */

const packagingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  // QR Code
  qrCode: {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    url: String, // URL для QR кода
    imageUrl: String, // Изображение QR кода
  },

  // Unboxing tracking
  unboxing: {
    scanned: {
      type: Boolean,
      default: false,
    },
    scannedAt: Date,
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    device: String,
    userAgent: String,
  },

  // Content links
  content: {
    nftUrl: String,
    creationVideoUrl: String,
    artistStoryUrl: String,
    careInstructionsUrl: String,
  },

  // Printed card
  printedCard: {
    edition: String, // "Edition #42 of 50"
    message: String,
    artistSignature: String,
    qrCodePrintUrl: String, // URL для печати QR
  },

  // Post-unboxing
  feedback: {
    received: {
      type: Boolean,
      default: false,
    },
    rating: Number,
    message: String,
    photos: [String],
    submittedAt: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

packagingSchema.index({ "qrCode.code": 1 });
packagingSchema.index({ orderId: 1 });
packagingSchema.index({ customerId: 1 });

const Packaging = mongoose.model("Packaging", packagingSchema);

export default Packaging;
