/**
 * HAORI VISION — Bespoke Countdown Component (P20)
 *
 * Displays available bespoke slots with real-time countdown
 * and hold/book functionality.
 *
 * Features:
 * - Real-time slot availability
 * - Countdown timer for slot holds
 * - Hold slot for 24 hours
 * - Book slot with customer info
 * - Auto-refresh expired holds
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Slot {
  slot_id: string;
  slot_number: number;
  status: "free" | "hold" | "booked";
  delivery_window: {
    start: string;
    end: string;
  };
  hold_expires_at: string | null;
  held_by: string | null;
  price_eur: number;
}

interface SlotsData {
  month: string;
  timezone: string;
  slots: Slot[];
  rules: {
    total_slots_per_month: number;
    hold_duration_hours: number;
    minimum_price_eur: number;
  };
}

interface BespokeCountdownProps {
  apiUrl?: string;
}

const BespokeCountdown: React.FC<BespokeCountdownProps> = ({ apiUrl = "" }) => {
  const [slotsData, setSlotsData] = useState<SlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState<string | null>(null);

  // Fetch slots data
  const fetchSlots = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bespoke-slots`);
      const result = await response.json();

      if (result.success) {
        setSlotsData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load slots. Please try again later.");
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSlots();

    // Auto-refresh every 30 seconds to update expired holds
    const interval = setInterval(fetchSlots, 30000);

    return () => clearInterval(interval);
  }, [apiUrl]);

  // Calculate time remaining for hold
  const getTimeRemaining = (expiresAt: string | null): string | null => {
    if (!expiresAt) return null;

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Hold slot
  const handleHoldSlot = async (slotId: string) => {
    try {
      setHoldingSlot(slotId);

      // Use session ID or generate temporary ID
      const sessionId =
        sessionStorage.getItem("bespoke_session") || `session_${Date.now()}`;
      sessionStorage.setItem("bespoke_session", sessionId);

      const response = await fetch(
        `${apiUrl}/api/bespoke-slots/${slotId}/hold`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heldBy: sessionId }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Refresh slots to show updated status
        await fetchSlots();
        setSelectedSlot(slotId);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to hold slot. Please try again.");
      console.error("Error holding slot:", err);
    } finally {
      setHoldingSlot(null);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get available count
  const availableCount =
    slotsData?.slots.filter((s) => s.status === "free").length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">Загрузка слотов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  if (!slotsData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          Bespoke Commission Slots
        </h2>
        <p className="text-zinc-400 text-lg mb-2">
          {slotsData.month} — Limited to {slotsData.rules.total_slots_per_month}{" "}
          Exclusive Commissions
        </p>
        <div className="text-purple-400 text-xl font-semibold">
          {availableCount} / {slotsData.rules.total_slots_per_month} Available
        </div>
      </motion.div>

      {/* Slots Grid */}
      <div className="grid gap-6">
        {slotsData.slots.map((slot, index) => {
          const isFree = slot.status === "free";
          const isHold = slot.status === "hold";
          const isBooked = slot.status === "booked";
          const timeRemaining = isHold
            ? getTimeRemaining(slot.hold_expires_at)
            : null;

          return (
            <motion.div
              key={slot.slot_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-6 rounded-lg border-2 transition-all
                ${isFree ? "border-purple-500 bg-purple-500/10" : ""}
                ${isHold ? "border-yellow-500 bg-yellow-500/10" : ""}
                ${isBooked ? "border-zinc-700 bg-zinc-900/50 opacity-60" : ""}
              `}
            >
              {/* Slot Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Slot #{slot.slot_number}
                  </h3>
                  <div className="text-zinc-400">
                    Delivery: {formatDate(slot.delivery_window.start)} —{" "}
                    {formatDate(slot.delivery_window.end)}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`
                  px-3 py-1 rounded-full text-sm font-semibold uppercase
                  ${isFree ? "bg-purple-500 text-white" : ""}
                  ${isHold ? "bg-yellow-500 text-black" : ""}
                  ${isBooked ? "bg-zinc-700 text-zinc-400" : ""}
                `}
                >
                  {slot.status === "free" && "Available"}
                  {slot.status === "hold" && "On Hold"}
                  {slot.status === "booked" && "Booked"}
                </div>
              </div>

              {/* Price */}
              <div className="text-white text-xl mb-4">
                From €{slot.price_eur.toLocaleString()}
              </div>

              {/* Hold Countdown */}
              {isHold && timeRemaining && timeRemaining !== "Expired" && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded">
                  <div className="text-yellow-400 text-sm font-semibold mb-1">
                    Hold Expires In:
                  </div>
                  <div className="text-white text-2xl font-mono">
                    {timeRemaining}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {isFree && (
                <motion.button
                  onClick={() => handleHoldSlot(slot.slot_id)}
                  disabled={holdingSlot === slot.slot_id}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold uppercase tracking-wider
                    transition-all
                    ${
                      holdingSlot === slot.slot_id
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }
                  `}
                  whileHover={
                    holdingSlot !== slot.slot_id ? { scale: 1.02 } : {}
                  }
                  whileTap={holdingSlot !== slot.slot_id ? { scale: 0.98 } : {}}
                >
                  {holdingSlot === slot.slot_id
                    ? "Holding..."
                    : "Hold This Slot (24h)"}
                </motion.button>
              )}

              {isBooked && (
                <div className="text-center text-zinc-500 font-semibold py-3">
                  This slot is no longer available
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 bg-zinc-900 border border-zinc-700 rounded-lg"
      >
        <h3 className="text-white text-lg font-semibold mb-3">How It Works</h3>
        <div className="text-zinc-400 space-y-2">
          <p>
            <strong className="text-white">1. Hold:</strong> Reserve a slot for
            24 hours to secure your commission window.
          </p>
          <p>
            <strong className="text-white">2. Design:</strong> We'll create a
            mood board based on your energy and send you an initial design
            within 72 hours.
          </p>
          <p>
            <strong className="text-white">3. Confirm:</strong> Review the
            design and confirm with a 50% deposit to start production.
          </p>
          <p>
            <strong className="text-white">4. Receive:</strong> Your bespoke
            piece will be ready within {slotsData.rules.hold_duration_hours}h of
            approval.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-700 text-zinc-500 text-sm">
          <strong className="text-white">Note:</strong> Held slots automatically
          expire after 24 hours. Book early to secure your preferred delivery
          window.
        </div>
      </motion.div>
    </div>
  );
};

export default BespokeCountdown;
