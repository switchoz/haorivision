import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import packagingService from "../services/packagingService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads", "feedback"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(
      null,
      `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`,
    );
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

const router = express.Router();

/**
 * POST /api/packaging/create
 * Create packaging for order
 */
router.post("/create", async (req, res) => {
  try {
    const { order, product, customer } = req.body;

    const result = await packagingService.createPackaging(
      order,
      product,
      customer,
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/packaging/qr/:qrCode
 * Get packaging by QR code
 */
router.get("/qr/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;

    const packaging = await packagingService.getPackagingByQR(qrCode);

    if (!packaging) {
      return res.status(404).json({
        success: false,
        error: "Packaging not found",
      });
    }

    res.json({
      success: true,
      packaging: packaging,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/packaging/scan/:qrCode
 * Track QR code scan
 */
router.post("/scan/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;
    const scanData = req.body;

    const result = await packagingService.trackQRScan(qrCode, scanData);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/packaging/feedback/:qrCode
 * Submit unboxing feedback
 */
router.post("/feedback/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;
    const feedbackData = req.body;

    const result = await packagingService.submitFeedback(qrCode, feedbackData);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/packaging/stats
 * Get unboxing statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await packagingService.getUnboxingStats();

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/packaging/card/:packagingId
 * Generate printable card PDF
 */
router.post("/card/:packagingId", async (req, res) => {
  try {
    const { packagingId } = req.params;

    const packaging = await packagingService.getPackagingByQR(packagingId);

    if (!packaging) {
      return res.status(404).json({
        success: false,
        error: "Packaging not found",
      });
    }

    const result = await packagingService.generatePrintableCard(packaging);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/packaging/upload-photo
 * Upload feedback photo
 */
router.post("/upload-photo", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const url = `/uploads/feedback/${req.file.filename}`;
  res.json({ success: true, url });
});

export default router;
