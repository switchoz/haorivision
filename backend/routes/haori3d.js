/**
 * HAORI 3D — API для загрузки фото и генерации 3D-превью
 *
 * Загрузка: перёд, спина, UV-перёд, UV-спина
 * Результат: набор текстур для 3D-визуализации
 */

import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { baseLogger } from "../middlewares/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "haori-3d");

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const itemDir = path.join(UPLOAD_DIR, req.params.itemId || "temp");
    if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
    cb(null, itemDir);
  },
  filename: (req, file, cb) => {
    // front.jpg, back.jpg, front_uv.jpg, back_uv.jpg
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${file.fieldname}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP images allowed"));
    }
  },
});

const uploadFields = upload.fields([
  { name: "front", maxCount: 1 },
  { name: "back", maxCount: 1 },
  { name: "front_uv", maxCount: 1 },
  { name: "back_uv", maxCount: 1 },
]);

/**
 * POST /api/haori-3d/:itemId/upload
 * Загрузка фотографий хаори для 3D визуализации
 */
router.post("/:itemId/upload", uploadFields, (req, res) => {
  try {
    const { itemId } = req.params;
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res
        .status(400)
        .json({ error: "No files uploaded. Send at least front image." });
    }

    const result = {
      itemId,
      textures: {},
    };

    for (const [field, fileArr] of Object.entries(files)) {
      const file = fileArr[0];
      result.textures[field] = `/uploads/haori-3d/${itemId}/${file.filename}`;
    }

    res.json({ success: true, ...result });
  } catch (error) {
    baseLogger.error({ err: error }, "Haori 3D upload error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/haori-3d/:itemId
 * Получить текстуры для 3D-модели
 */
router.get("/:itemId", (req, res) => {
  const { itemId } = req.params;
  const itemDir = path.join(UPLOAD_DIR, itemId);

  if (!fs.existsSync(itemDir)) {
    return res.status(404).json({ error: "Item not found" });
  }

  const files = fs.readdirSync(itemDir);
  const textures = {};

  for (const file of files) {
    const name = path.parse(file).name; // front, back, front_uv, back_uv
    textures[name] = `/uploads/haori-3d/${itemId}/${file}`;
  }

  res.json({ itemId, textures });
});

/**
 * GET /api/haori-3d
 * Список всех загруженных хаори
 */
router.get("/", (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return res.json({ items: [] });
  }

  const dirs = fs
    .readdirSync(UPLOAD_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const files = fs.readdirSync(path.join(UPLOAD_DIR, d.name));
      const textures = {};
      for (const file of files) {
        textures[path.parse(file).name] = `/uploads/haori-3d/${d.name}/${file}`;
      }
      return { itemId: d.name, textures };
    });

  res.json({ items: dirs });
});

/**
 * DELETE /api/haori-3d/:itemId
 * Удалить хаори и все текстуры
 */
router.delete("/:itemId", (req, res) => {
  const { itemId } = req.params;
  const itemDir = path.join(UPLOAD_DIR, itemId);

  if (!fs.existsSync(itemDir)) {
    return res.status(404).json({ error: "Item not found" });
  }

  fs.rmSync(itemDir, { recursive: true });
  res.json({ success: true });
});

export default router;
