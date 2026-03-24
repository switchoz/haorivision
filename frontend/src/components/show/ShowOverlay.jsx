/**
 * 🎭 SHOW OVERLAY
 *
 * Overlay-модуль для текстовых наложений:
 * - Цитаты из manifesto.md
 * - Live captions из script.md
 * - Минималистичный UI с neon подсветкой
 */

import React, { useState, useEffect } from "react";
import "./ShowOverlay.css";

// Brand quotes из manifesto
const BRAND_QUOTES = [
  {
    id: "wear_light",
    text: "WEAR THE LIGHT.\nBECOME THE ART.",
    author: "HAORI VISION",
  },
  {
    id: "eclipse",
    text: "In the eclipse between darkness and light,\nwe find our truth.",
    author: "Eclipse of Light",
  },
  {
    id: "mycelium",
    text: "Like mycelium beneath the surface,\nwe are all connected.",
    author: "Mycelium Dreams",
  },
  {
    id: "void_bloom",
    text: "In the void, flowers bloom.\nIn darkness, light emerges.",
    author: "Void Bloom",
  },
  {
    id: "ancestors",
    text: "Our ancestors speak through light.\nTheir wisdom illuminates our path.",
    author: "Neon Ancestors",
  },
  {
    id: "unity",
    text: "We are not observers.\nWe are the light itself.",
    author: "HAORI VISION",
  },
];

export default function ShowOverlay({
  currentScene,
  liveCaptions,
  showQuotes = true,
}) {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!showQuotes) return;

    // Показывать цитату при смене сцены
    if (currentScene) {
      // Выбрать цитату по сцене
      let quote = null;

      switch (currentScene.id) {
        case "intro_dark":
          quote = BRAND_QUOTES.find((q) => q.id === "eclipse");
          break;
        case "light_awaken":
          quote = BRAND_QUOTES.find((q) => q.id === "mycelium");
          break;
        case "eclipse_phase":
          quote = BRAND_QUOTES.find((q) => q.id === "void_bloom");
          break;
        case "bloom_ascend":
          quote = BRAND_QUOTES.find((q) => q.id === "ancestors");
          break;
        case "finale":
          quote = BRAND_QUOTES.find((q) => q.id === "wear_light");
          break;
        default:
          quote = BRAND_QUOTES.find((q) => q.id === "unity");
      }

      if (quote) {
        setCurrentQuote(quote);
        setIsVisible(true);

        // Fade out после 8 секунд
        setTimeout(() => {
          setIsVisible(false);
        }, 8000);
      }
    }
  }, [currentScene, showQuotes]);

  return (
    <div className="show-overlay">
      {/* Brand Quotes */}
      {showQuotes && currentQuote && (
        <div className={`overlay-quote ${isVisible ? "visible" : ""}`}>
          <div className="quote-content">
            <p className="quote-text">{currentQuote.text}</p>
            <p className="quote-author">— {currentQuote.author}</p>
          </div>
        </div>
      )}

      {/* Live Captions */}
      {liveCaptions && liveCaptions.length > 0 && (
        <div className="overlay-captions">
          {liveCaptions.map((caption, index) => (
            <div
              key={caption.id || index}
              className={`caption ${caption.type || "default"}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {caption.speaker && (
                <span className="caption-speaker">{caption.speaker}:</span>
              )}
              <span className="caption-text">{caption.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Live Caption Controller
 * Управление live captions из script.md
 */
export function useLiveCaptions() {
  const [captions, setCaptions] = useState([]);

  const addCaption = (speaker, text, type = "default", duration = 5000) => {
    const caption = {
      id: Date.now(),
      speaker,
      text,
      type,
      timestamp: Date.now(),
    };

    setCaptions((prev) => [...prev, caption]);

    // Auto-remove после duration
    setTimeout(() => {
      setCaptions((prev) => prev.filter((c) => c.id !== caption.id));
    }, duration);
  };

  const clearCaptions = () => {
    setCaptions([]);
  };

  return {
    captions,
    addCaption,
    clearCaptions,
  };
}
