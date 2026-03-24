/**
 * HAORI VISION — Product CTA Button with A/B Test (P18)
 *
 * Enhanced CTA button component with A/B testing capabilities.
 * Wrapped with withCTAExperiment HOC for automatic variant assignment.
 */

import { motion } from "framer-motion";
import withCTAExperiment from "../ab/withCTAExperiment";

function ProductCTA({
  ctaText,
  variant,
  isExperiment,
  experimentConfig,
  onClick,
  productId,
  disabled,
  isUVMode,
  className = "",
}) {
  const handleClick = (e) => {
    // onClick already wrapped by HOC with tracking
    if (onClick && !disabled) {
      onClick(e);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={`w-full py-5 text-lg font-bold uppercase tracking-wider transition-all relative ${
          disabled
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : isUVMode
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-white text-black hover:bg-zinc-200"
        } ${className}`}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        data-variant={variant}
        data-experiment={isExperiment}
      >
        {ctaText}

        {/* A/B Test Badge (visible in development only) */}
        {isExperiment && process.env.NODE_ENV === "development" && (
          <span className="absolute top-1 right-2 text-xs bg-black/50 px-2 py-0.5 rounded">
            A/B: {variant}
          </span>
        )}
      </motion.button>

      {/* Experiment Info Tooltip (dev only) */}
      {isExperiment && process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-zinc-600 text-center">
          🧪 A/B Test Active • Variant {variant} • Product: {productId}
        </div>
      )}
    </div>
  );
}

// Export wrapped component with A/B test HOC
export default withCTAExperiment(ProductCTA);
