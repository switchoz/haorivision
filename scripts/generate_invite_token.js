#!/usr/bin/env node

/**
 * HAORI VISION — Invite Token Generator
 *
 * Генерация invite tokens для байеров.
 *
 * Features:
 * - Генерация уникальных токенов
 * - Сохранение в /data/buyer_invites.json
 * - Email байера и дата выдачи
 * - Статус (active/used/revoked)
 *
 * Usage:
 *   node scripts/generate_invite_token.js
 *   node scripts/generate_invite_token.js --email buyer@company.com --company "Fashion House"
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// ============================================================
// Configuration
// ============================================================

const INVITES_PATH = join(PROJECT_ROOT, "data", "buyer_invites.json");

// ============================================================
// Helper Functions
// ============================================================

function loadInvites() {
  if (!existsSync(INVITES_PATH)) {
    return { invites: [] };
  }

  try {
    const data = readFileSync(INVITES_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { invites: [] };
  }
}

function saveInvites(data) {
  writeFileSync(INVITES_PATH, JSON.stringify(data, null, 2));
}

function generateToken() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `BUYER-${year}-${random.toString().padStart(3, "0")}`;
}

function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ============================================================
// Token Generation
// ============================================================

async function generateInvite(email, company, notes = "") {
  const invites = loadInvites();

  // Check if email already has active invite
  const existing = invites.invites.find(
    (inv) => inv.email === email && inv.status === "active",
  );

  if (existing) {
    console.log(`\n⚠️  Active invite already exists for ${email}`);
    console.log(`Token: ${existing.token}`);
    console.log(`Issued: ${existing.createdAt}\n`);

    const override = await prompt("Generate new token anyway? (y/n): ");

    if (override.toLowerCase() !== "y") {
      console.log("\n❌ Cancelled\n");
      return null;
    }
  }

  // Generate token
  const token = generateToken();

  const invite = {
    token,
    email,
    company,
    notes,
    status: "active",
    createdAt: new Date().toISOString(),
    usedAt: null,
    revokedAt: null,
  };

  invites.invites.push(invite);
  saveInvites(invites);

  return invite;
}

// ============================================================
// List Invites
// ============================================================

function listInvites(status = null) {
  const invites = loadInvites();

  let filtered = invites.invites;

  if (status) {
    filtered = filtered.filter((inv) => inv.status === status);
  }

  if (filtered.length === 0) {
    console.log("\n📋 No invites found.\n");
    return;
  }

  console.log("\n📋 Buyer Invites:\n");

  filtered.forEach((invite) => {
    const statusIcon =
      {
        active: "✅",
        used: "✔️",
        revoked: "❌",
      }[invite.status] || "❓";

    console.log(`${statusIcon} ${invite.token}`);
    console.log(`   Email: ${invite.email}`);
    console.log(`   Company: ${invite.company || "N/A"}`);
    console.log(`   Status: ${invite.status}`);
    console.log(`   Created: ${new Date(invite.createdAt).toLocaleString()}`);

    if (invite.usedAt) {
      console.log(`   Used: ${new Date(invite.usedAt).toLocaleString()}`);
    }

    if (invite.notes) {
      console.log(`   Notes: ${invite.notes}`);
    }

    console.log("");
  });
}

// ============================================================
// Revoke Token
// ============================================================

function revokeToken(token) {
  const invites = loadInvites();

  const invite = invites.invites.find((inv) => inv.token === token);

  if (!invite) {
    console.log(`\n❌ Token not found: ${token}\n`);
    return false;
  }

  if (invite.status === "revoked") {
    console.log(`\n⚠️  Token already revoked: ${token}\n`);
    return false;
  }

  invite.status = "revoked";
  invite.revokedAt = new Date().toISOString();

  saveInvites(invites);

  console.log(`\n✅ Token revoked: ${token}\n`);
  return true;
}

// ============================================================
// CLI
// ============================================================

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║       HAORI VISION — Invite Token Generator          ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const args = process.argv.slice(2);

  // List invites
  if (args.includes("--list")) {
    const statusIndex = args.indexOf("--status");
    const status = statusIndex !== -1 ? args[statusIndex + 1] : null;
    listInvites(status);
    return;
  }

  // Revoke token
  if (args.includes("--revoke")) {
    const tokenIndex = args.indexOf("--revoke");
    const token = args[tokenIndex + 1];

    if (!token) {
      console.log("❌ Missing token. Usage: --revoke BUYER-2025-001\n");
      process.exit(1);
    }

    revokeToken(token);
    return;
  }

  // Generate invite
  let email = null;
  let company = null;
  let notes = null;

  const emailIndex = args.indexOf("--email");
  if (emailIndex !== -1) {
    email = args[emailIndex + 1];
  }

  const companyIndex = args.indexOf("--company");
  if (companyIndex !== -1) {
    company = args[companyIndex + 1];
  }

  const notesIndex = args.indexOf("--notes");
  if (notesIndex !== -1) {
    notes = args[notesIndex + 1];
  }

  // Interactive mode if no email provided
  if (!email) {
    email = await prompt("Buyer email: ");
  }

  if (!company) {
    company = await prompt("Company name: ");
  }

  if (!notes) {
    notes = await prompt("Notes (optional): ");
  }

  if (!email) {
    console.log("\n❌ Email is required\n");
    process.exit(1);
  }

  const invite = await generateInvite(email, company, notes);

  if (invite) {
    console.log("\n✅ Invite token generated!\n");
    console.log(`Token:   ${invite.token}`);
    console.log(`Email:   ${invite.email}`);
    console.log(`Company: ${invite.company || "N/A"}`);
    console.log(`Status:  ${invite.status}`);
    console.log(`Created: ${new Date(invite.createdAt).toLocaleString()}`);
    console.log("");
    console.log("📧 Send this token to the buyer to access the Buyers Lounge.");
    console.log("");
  }
}

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
});
