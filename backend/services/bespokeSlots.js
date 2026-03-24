/**
 * HAORI VISION — Bespoke Slots Service (P20)
 *
 * Manages bespoke commission slots with hold/release/book operations.
 *
 * Features:
 * - Load current month's slots
 * - Hold slot for 24 hours
 * - Release held slot
 * - Book slot with customer info
 * - Auto-expire holds
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../../data/bespoke");

/**
 * Get current month's slots file path
 */
function getCurrentSlotsFile() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return path.join(DATA_DIR, `slots_${year}${month}.json`);
}

/**
 * Load slots data from JSON file
 */
async function loadSlots() {
  try {
    const filePath = getCurrentSlotsFile();
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Slots file not found for current month. Run: npm run bespoke:init_month",
      );
    }
    throw error;
  }
}

/**
 * Save slots data to JSON file
 */
async function saveSlots(slotsData) {
  const filePath = getCurrentSlotsFile();
  await fs.writeFile(filePath, JSON.stringify(slotsData, null, 2), "utf-8");
}

/**
 * Auto-release expired holds
 */
function releaseExpiredHolds(slotsData) {
  const now = new Date();
  let changed = false;

  slotsData.slots.forEach((slot) => {
    if (slot.status === "hold" && slot.hold_expires_at) {
      const expiresAt = new Date(slot.hold_expires_at);
      if (now > expiresAt) {
        // Release expired hold
        slot.status = "free";
        slot.hold_expires_at = null;
        slot.held_by = null;
        changed = true;
      }
    }
  });

  return changed;
}

/**
 * Get all slots with auto-release of expired holds
 */
export async function getSlots() {
  const slotsData = await loadSlots();

  // Auto-release expired holds
  const changed = releaseExpiredHolds(slotsData);
  if (changed) {
    await saveSlots(slotsData);
  }

  return {
    month: slotsData.month,
    timezone: slotsData.timezone,
    slots: slotsData.slots,
    rules: slotsData.rules,
  };
}

/**
 * Get available (free) slots count
 */
export async function getAvailableCount() {
  const slotsData = await loadSlots();
  releaseExpiredHolds(slotsData);

  return slotsData.slots.filter((slot) => slot.status === "free").length;
}

/**
 * Hold a slot for 24 hours
 *
 * @param {string} slotId - Slot ID (e.g., "BESPOKE-202510-01")
 * @param {string} heldBy - Session ID or email
 * @returns {object} Updated slot
 */
export async function holdSlot(slotId, heldBy) {
  const slotsData = await loadSlots();

  // Auto-release expired holds first
  releaseExpiredHolds(slotsData);

  // Find slot
  const slot = slotsData.slots.find((s) => s.slot_id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Check if slot is available
  if (slot.status !== "free") {
    throw new Error(`Slot is ${slot.status}, cannot hold`);
  }

  // Hold slot for 24 hours
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

  slot.status = "hold";
  slot.held_by = heldBy;
  slot.hold_expires_at = expiresAt.toISOString();

  await saveSlots(slotsData);

  return slot;
}

/**
 * Release a held slot
 *
 * @param {string} slotId - Slot ID
 * @param {string} heldBy - Session ID or email (must match holder)
 * @returns {object} Updated slot
 */
export async function releaseSlot(slotId, heldBy) {
  const slotsData = await loadSlots();

  // Find slot
  const slot = slotsData.slots.find((s) => s.slot_id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Check if slot is on hold
  if (slot.status !== "hold") {
    throw new Error("Slot is not on hold");
  }

  // Verify holder (optional - can be relaxed for admin release)
  if (slot.held_by !== heldBy && heldBy !== "ADMIN") {
    throw new Error("You are not the holder of this slot");
  }

  // Release hold
  slot.status = "free";
  slot.held_by = null;
  slot.hold_expires_at = null;

  await saveSlots(slotsData);

  return slot;
}

/**
 * Book a slot with customer information
 *
 * @param {string} slotId - Slot ID
 * @param {string} heldBy - Session ID or email (must match holder)
 * @param {object} customerInfo - Customer details
 * @returns {object} Updated slot
 */
export async function bookSlot(slotId, heldBy, customerInfo) {
  const slotsData = await loadSlots();

  // Find slot
  const slot = slotsData.slots.find((s) => s.slot_id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Check if slot is on hold by this user
  if (slot.status !== "hold") {
    throw new Error("Slot must be on hold before booking");
  }

  if (slot.held_by !== heldBy) {
    throw new Error("You are not the holder of this slot");
  }

  // Validate customer info
  if (!customerInfo.name || !customerInfo.email) {
    throw new Error("Customer name and email are required");
  }

  // Book slot
  slot.status = "booked";
  slot.booked_at = new Date().toISOString();
  slot.customer = customerInfo;
  slot.deposit_paid = false; // Will be updated after payment
  slot.hold_expires_at = null; // No longer needed

  await saveSlots(slotsData);

  return slot;
}

/**
 * Mark deposit as paid (admin function)
 *
 * @param {string} slotId - Slot ID
 * @returns {object} Updated slot
 */
export async function markDepositPaid(slotId) {
  const slotsData = await loadSlots();

  const slot = slotsData.slots.find((s) => s.slot_id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  if (slot.status !== "booked") {
    throw new Error("Slot must be booked to mark deposit as paid");
  }

  slot.deposit_paid = true;

  await saveSlots(slotsData);

  return slot;
}

/**
 * Get slot by ID
 */
export async function getSlotById(slotId) {
  const slotsData = await loadSlots();
  releaseExpiredHolds(slotsData);

  const slot = slotsData.slots.find((s) => s.slot_id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  return slot;
}

export default {
  getSlots,
  getAvailableCount,
  holdSlot,
  releaseSlot,
  bookSlot,
  markDepositPaid,
  getSlotById,
};
