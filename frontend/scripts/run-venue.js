#!/usr/bin/env node

/**
 * 🎬 RUN VENUE SCRIPT
 *
 * Запуск с профилем площадки
 * Usage: npm run show:venue=triple_wall_projection
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse venue from args
const venueArg = process.argv.find((arg) => arg.includes("="));
const venueId = venueArg ? venueArg.split("=")[1] : "default_venue";

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║                                                           ║");
console.log("║        HAORI VISION SHOW — VENUE MODE                     ║");
console.log("║                                                           ║");
console.log("╚═══════════════════════════════════════════════════════════╝");
console.log("");
console.log(`[◇] Venue Profile: ${venueId}`);
console.log(`[◆] Loading configuration...`);
console.log("");

// Set environment variable
process.env.VITE_VENUE_ID = venueId;
process.env.VITE_MODE = "venue";

// Start Vite with venue config
const vite = spawn("vite", ["--mode", "production", "--open"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    VITE_VENUE_ID: venueId,
    VITE_MODE: "venue",
  },
});

vite.on("close", (code) => {
  console.log(`[✓] Vite exited with code ${code}`);
  process.exit(code);
});

vite.on("error", (error) => {
  console.error("[!] Failed to start Vite:", error);
  process.exit(1);
});
