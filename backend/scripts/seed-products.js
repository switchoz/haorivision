/**
 * Seed products into MongoDB from gallery-products.json
 * Usage: node backend/scripts/seed-products.js
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import Product from "../models/Product.js";

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/haorivision";

// Extract category from product ID: "real-haori-001" → "haori"
function extractCategory(id) {
  const match = id.match(/^real-(\w+)-\d+$/);
  return match ? match[1] : "other";
}

// Map status to model enum
function mapStatus(status, remaining) {
  if (remaining === 0) return "sold-out";
  if (status === "upcoming") return "coming-soon";
  if (status === "limited" || remaining <= 2) return "low-stock";
  return "available";
}

async function seed() {
  console.log(`Connecting to MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  const galleryPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "data",
    "gallery-products.json",
  );
  const data = JSON.parse(readFileSync(galleryPath, "utf-8"));

  const products = data.products.map((p) => {
    const specs = p.specifications || {};
    const haoriSpec = specs.haori || {};
    const canvasSpec = specs.canvas || {};

    return {
      id: p.id,
      name: p.name,
      productCollection: p.collection,
      category: extractCategory(p.id),
      tagline: p.tagline,
      description: {
        short: p.description?.short,
        long: p.description?.full,
        story: p.description?.full,
      },
      price: p.price,
      currency: p.currency || "USD",
      images: p.images,
      editions: {
        total: p.editions?.total || 1,
        remaining: p.editions?.remaining ?? 1,
        sold: (p.editions?.total || 1) - (p.editions?.remaining ?? 1),
      },
      uvColors: p.uvColors || [],
      techniques: [haoriSpec.technique, canvasSpec.technique].filter(Boolean),
      materials: [haoriSpec.material, canvasSpec.material].filter(Boolean),
      dimensions: haoriSpec.dimensions
        ? {
            length: haoriSpec.dimensions.length,
            width: haoriSpec.dimensions.width,
            sleeves: haoriSpec.dimensions.sleeve,
          }
        : undefined,
      weight: haoriSpec.weight,
      status: mapStatus(p.status, p.editions?.remaining ?? 1),
      featured: p.featured || false,
      artist: {
        name: "Елизавета Федькина (LiZa)",
        signature: "LiZa",
        bio: "Интуитивная живопись — «Картины из будущего». Ручная роспись UV-реактивными красками.",
      },
    };
  });

  // Clear existing products
  const deleted = await Product.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing products.`);

  // Insert all at once for speed
  for (const p of products) {
    const doc = new Product(p);
    await doc.save();
  }

  // Summary by category
  const cats = {};
  products.forEach((p) => {
    cats[p.category] = (cats[p.category] || 0) + 1;
  });
  console.log(`\nSeeded ${products.length} products:`);
  Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
