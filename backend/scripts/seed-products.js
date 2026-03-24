/**
 * Seed products into MongoDB from demo-products-ru.json
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

// Map demo status to model enum
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

  const demoPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "data",
    "demo-products-ru.json",
  );
  const demo = JSON.parse(readFileSync(demoPath, "utf-8"));

  const products = demo.products.map((p) => {
    const specs = p.specifications || {};
    const haoriSpec = specs.haori || {};
    const canvasSpec = specs.canvas || {};

    return {
      id: p.id,
      name: p.name,
      productCollection: p.collection,
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
        total: p.editions.total,
        remaining: p.editions.remaining,
        sold: p.editions.total - p.editions.remaining,
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
      status: mapStatus(p.status, p.editions.remaining),
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

  // Insert new
  for (const p of products) {
    const doc = new Product(p);
    await doc.save(); // triggers pre-save hook for status
    console.log(`  + ${doc.id} — ${doc.name} [${doc.status}]`);
  }

  console.log(`\nSeeded ${products.length} products.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
