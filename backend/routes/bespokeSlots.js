/**
 * HAORI VISION — Bespoke Slots API Routes (P20)
 *
 * New endpoints for slot management (Add-Only - does not modify existing bespoke routes)
 *
 * Endpoints:
 * - GET    /api/bespoke-slots          → Get all slots
 * - GET    /api/bespoke-slots/available → Get available count
 * - POST   /api/bespoke-slots/:id/hold  → Hold a slot for 24h
 * - POST   /api/bespoke-slots/:id/release → Release held slot
 * - POST   /api/bespoke-slots/:id/book   → Book slot with customer info
 * - GET    /api/bespoke-slots/:id       → Get specific slot
 */

import express from "express";
import bespokeSlots from "../services/bespokeSlots.js";
import authAdmin from "../middlewares/authAdmin.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * GET /api/bespoke-slots
 * Get all slots for current month
 */
router.get("/", async (req, res) => {
  try {
    const slots = await bespokeSlots.getSlots();

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Bespoke Slots] Error getting slots");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bespoke-slots/available
 * Get count of available (free) slots
 */
router.get("/available", async (req, res) => {
  try {
    const count = await bespokeSlots.getAvailableCount();

    res.json({
      success: true,
      data: {
        available: count,
        total: 3, // Fixed capacity per month
      },
    });
  } catch (error) {
    baseLogger.error(
      { err: error },
      "[Bespoke Slots] Error getting available count",
    );
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bespoke-slots/:id
 * Get specific slot by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const slot = await bespokeSlots.getSlotById(req.params.id);

    res.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Bespoke Slots] Error getting slot");
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bespoke-slots/:id/hold
 * Hold a slot for 24 hours
 *
 * Body: { heldBy: "session_id or email" }
 */
router.post("/:id/hold", async (req, res) => {
  try {
    const { heldBy } = req.body;

    if (!heldBy) {
      return res.status(400).json({
        success: false,
        error: "heldBy is required (session ID or email)",
      });
    }

    const slot = await bespokeSlots.holdSlot(req.params.id, heldBy);

    res.json({
      success: true,
      message: "Slot held for 24 hours",
      data: slot,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Bespoke Slots] Error holding slot");
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bespoke-slots/:id/release
 * Release a held slot
 *
 * Body: { heldBy: "session_id or email" } or { heldBy: "ADMIN" }
 */
router.post("/:id/release", async (req, res) => {
  try {
    const { heldBy } = req.body;

    if (!heldBy) {
      return res.status(400).json({
        success: false,
        error: "heldBy is required (session ID or email, or ADMIN)",
      });
    }

    const slot = await bespokeSlots.releaseSlot(req.params.id, heldBy);

    res.json({
      success: true,
      message: "Slot released",
      data: slot,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Bespoke Slots] Error releasing slot");
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bespoke-slots/:id/book
 * Book a slot with customer information
 *
 * Body: {
 *   heldBy: "session_id or email",
 *   customer: {
 *     name: "...",
 *     email: "...",
 *     country: "...",
 *     preferences: "..."
 *   }
 * }
 */
router.post("/:id/book", async (req, res) => {
  try {
    const { heldBy, customer } = req.body;

    if (!heldBy) {
      return res.status(400).json({
        success: false,
        error: "heldBy is required",
      });
    }

    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({
        success: false,
        error: "Customer name and email are required",
      });
    }

    const slot = await bespokeSlots.bookSlot(req.params.id, heldBy, customer);

    res.json({
      success: true,
      message: "Slot booked successfully. Deposit payment required.",
      data: slot,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "[Bespoke Slots] Error booking slot");
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bespoke-slots/:id/mark-paid
 * Mark deposit as paid (admin endpoint)
 *
 * Admin-only endpoint — requires authentication
 */
router.post("/:id/mark-paid", authAdmin, async (req, res) => {
  try {
    const slot = await bespokeSlots.markDepositPaid(req.params.id);

    res.json({
      success: true,
      message: "Deposit marked as paid",
      data: slot,
    });
  } catch (error) {
    baseLogger.error(
      { err: error },
      "[Bespoke Slots] Error marking deposit paid",
    );
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
