/**
 * HAORI VISION — CTA A/B Test HOC (P18)
 *
 * Higher-Order Component for A/B testing CTA buttons on product pages.
 * Only applies to NEW products defined in experiment config.
 *
 * Usage:
 *   import withCTAExperiment from './ab/withCTAExperiment';
 *
 *   function BuyButton({ ctaText, variant, onClick }) {
 *     return <button onClick={onClick}>{ctaText}</button>;
 *   }
 *
 *   export default withCTAExperiment(BuyButton);
 */

import React, { useState, useEffect } from "react";

// ============================================================
// Configuration
// ============================================================

const EXPERIMENT_CONFIG_URL = "/experiments/cta_v1.json";
const COOKIE_NAME = "cta_experiment_variant";
const COOKIE_DURATION_DAYS = 30;

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get cookie value by name
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
}

/**
 * Set cookie with expiration
 */
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Assign user to variant (A or B) based on experiment configuration
 */
function assignVariant(config) {
  if (!config || !config.variants) {
    return "A"; // Default to control
  }

  const random = Math.random() * 100;
  const splitA = config.distribution.split.A || 50;

  return random < splitA ? "A" : "B";
}

/**
 * Check if product ID is eligible for experiment
 */
function isProductEligible(productId, config) {
  if (!config || !config.targeting || !config.targeting.enabled) {
    return false;
  }

  return config.targeting.product_ids.includes(productId);
}

/**
 * Get CTA text for variant and language
 */
function getCTAText(variant, language, config) {
  if (!config || !config.variants || !config.variants[variant]) {
    return language === "ru" ? "Купить сейчас" : "Buy Now";
  }

  return (
    config.variants[variant].cta_text[language] ||
    config.variants[variant].cta_text.en
  );
}

/**
 * Track event to experiment results
 */
function trackExperimentEvent(eventName, variant, productId) {
  // This would typically send to analytics backend
  // For now, we'll use localStorage for client-side tracking
  try {
    const events = JSON.parse(
      localStorage.getItem("cta_experiment_events") || "[]",
    );
    events.push({
      timestamp: new Date().toISOString(),
      event: eventName,
      variant: variant,
      product_id: productId,
      utm_session_id: getCookie("utm_session_id"),
    });
    localStorage.setItem("cta_experiment_events", JSON.stringify(events));

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[CTA Experiment] Event: ${eventName}, Variant: ${variant}, Product: ${productId}`,
      );
    }
  } catch (error) {
    console.error("[CTA Experiment] Failed to track event:", error);
  }
}

// ============================================================
// HOC Implementation
// ============================================================

/**
 * Higher-Order Component for CTA A/B testing
 *
 * Props passed to wrapped component:
 * - ctaText: string (localized CTA button text based on variant)
 * - variant: string ('A' or 'B')
 * - isExperiment: boolean (true if product is in experiment)
 * - experimentConfig: object (full experiment config)
 * - onCTAClick: function (call this when CTA is clicked)
 * - ...originalProps (all other props passed through)
 */
function withCTAExperiment(WrappedComponent) {
  return function CTAExperimentWrapper(props) {
    const [experimentConfig, setExperimentConfig] = useState(null);
    const [variant, setVariant] = useState("A");
    const [isLoading, setIsLoading] = useState(true);
    const [isExperiment, setIsExperiment] = useState(false);

    const { productId, language = "en" } = props;

    // Load experiment configuration
    useEffect(() => {
      async function loadExperimentConfig() {
        try {
          const response = await fetch(EXPERIMENT_CONFIG_URL);
          if (!response.ok) {
            throw new Error("Failed to load experiment config");
          }
          const config = await response.json();
          setExperimentConfig(config);

          // Check if product is eligible for experiment
          const eligible = isProductEligible(productId, config);
          setIsExperiment(eligible);

          if (eligible) {
            // Check for existing variant assignment (sticky sessions)
            let assignedVariant = getCookie(COOKIE_NAME);

            if (!assignedVariant) {
              // New user - assign variant
              assignedVariant = assignVariant(config);
              setCookie(COOKIE_NAME, assignedVariant, COOKIE_DURATION_DAYS);
            }

            setVariant(assignedVariant);

            // Track view event
            trackExperimentEvent("cta_view", assignedVariant, productId);
          }

          setIsLoading(false);
        } catch (error) {
          console.error("[CTA Experiment] Failed to load config:", error);
          setIsLoading(false);
          setIsExperiment(false);
          setVariant("A"); // Fallback to control
        }
      }

      loadExperimentConfig();
    }, [productId]);

    // Handle CTA click
    const handleCTAClick = (e) => {
      if (isExperiment) {
        trackExperimentEvent("cta_click", variant, productId);
      }

      // Call original onClick handler if provided
      if (props.onClick) {
        props.onClick(e);
      }
    };

    // Get CTA text based on variant
    const ctaText = isExperiment
      ? getCTAText(variant, language, experimentConfig)
      : language === "ru"
        ? "Купить сейчас"
        : "Buy Now";

    // While loading, show default
    if (isLoading) {
      return (
        <WrappedComponent
          {...props}
          ctaText={language === "ru" ? "Купить сейчас" : "Buy Now"}
          variant="A"
          isExperiment={false}
          onClick={handleCTAClick}
        />
      );
    }

    // Render wrapped component with experiment props
    return (
      <WrappedComponent
        {...props}
        ctaText={ctaText}
        variant={variant}
        isExperiment={isExperiment}
        experimentConfig={experimentConfig}
        onClick={handleCTAClick}
        onCTAClick={handleCTAClick}
      />
    );
  };
}

// ============================================================
// Additional Export Functions
// ============================================================

/**
 * Manually track experiment events from other components
 */
export function trackCTAEvent(eventName, productId) {
  const variant = getCookie(COOKIE_NAME) || "A";
  trackExperimentEvent(eventName, variant, productId);
}

/**
 * Get user's current variant assignment
 */
export function getCurrentVariant() {
  return getCookie(COOKIE_NAME) || "A";
}

/**
 * Get all tracked events (for debugging/analytics)
 */
export function getTrackedEvents() {
  try {
    return JSON.parse(localStorage.getItem("cta_experiment_events") || "[]");
  } catch {
    return [];
  }
}

/**
 * Clear tracked events (for testing)
 */
export function clearTrackedEvents() {
  localStorage.removeItem("cta_experiment_events");
}

export default withCTAExperiment;
