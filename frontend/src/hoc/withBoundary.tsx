/**
 * HAORI VISION — withBoundary Higher-Order Component
 *
 * HOC wrapper that adds ErrorBoundary to components.
 * Provides graceful error handling without modifying original components.
 *
 * Usage:
 *   import { withBoundary } from '@/hoc/withBoundary';
 *
 *   // Wrap existing component
 *   const SafeComponent = withBoundary(MyComponent);
 *
 *   // With custom fallback
 *   const SafeCheckout = withBoundary(Checkout, {
 *     fallback: <CheckoutFallback />
 *   });
 */

import React, { ComponentType, ReactNode } from "react";
import ErrorBoundary from "../lib/ErrorBoundary";
import {
  FallbackUI,
  CheckoutFallback,
  ProductFallback,
  CartFallback,
} from "../lib/FallbackUI";
import { logger } from "../lib/logger";

// ============================================================
// Types
// ============================================================

export interface WithBoundaryOptions {
  fallback?: ReactNode;
  fallbackType?: "default" | "checkout" | "product" | "cart";
  name?: string;
  enableLogging?: boolean;
  productId?: string;
}

// ============================================================
// Fallback Component Selection
// ============================================================

function selectFallback(options: WithBoundaryOptions): ReactNode {
  // Custom fallback provided
  if (options.fallback) {
    return options.fallback;
  }

  // Pre-defined fallback types
  switch (options.fallbackType) {
    case "checkout":
      return <CheckoutFallback />;
    case "product":
      return <ProductFallback productId={options.productId} />;
    case "cart":
      return <CartFallback />;
    case "default":
    default:
      return <FallbackUI />;
  }
}

// ============================================================
// withBoundary HOC
// ============================================================

/**
 * Higher-Order Component that wraps component with ErrorBoundary
 */
export function withBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithBoundaryOptions = {},
): ComponentType<P> {
  const {
    name = Component.displayName || Component.name || "Component",
    enableLogging = true,
  } = options;

  const fallback = selectFallback(options);

  const WrappedComponent = (props: P) => {
    const handleError = (error: Error) => {
      if (enableLogging) {
        logger.error(`Error in ${name}`, {
          component: name,
          error: error.message,
          stack: error.stack,
          props: JSON.stringify(props),
        });
      }
    };

    return (
      <ErrorBoundary name={name} fallback={fallback} onError={handleError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withBoundary(${name})`;

  return WrappedComponent;
}

// ============================================================
// Specialized HOCs
// ============================================================

/**
 * Wrap component with Checkout-specific error boundary
 */
export function withCheckoutBoundary<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return withBoundary(Component, {
    fallbackType: "checkout",
    name: `${Component.displayName || Component.name || "Component"}-Checkout`,
    enableLogging: true,
  });
}

/**
 * Wrap component with Product-specific error boundary
 */
export function withProductBoundary<P extends object>(
  Component: ComponentType<P>,
  productId?: string,
): ComponentType<P> {
  return withBoundary(Component, {
    fallbackType: "product",
    name: `${Component.displayName || Component.name || "Component"}-Product`,
    productId,
    enableLogging: true,
  });
}

/**
 * Wrap component with Cart-specific error boundary
 */
export function withCartBoundary<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return withBoundary(Component, {
    fallbackType: "cart",
    name: `${Component.displayName || Component.name || "Component"}-Cart`,
    enableLogging: true,
  });
}

// ============================================================
// Conditional Boundary (feature flag)
// ============================================================

/**
 * Conditionally apply boundary based on feature flag
 */
export function withConditionalBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithBoundaryOptions = {},
): ComponentType<P> {
  const reliabilityEnabled = process.env.REACT_APP_RELIABILITY_KIT === "1";

  if (!reliabilityEnabled) {
    // Return original component if feature disabled
    return Component;
  }

  // Apply boundary if feature enabled
  return withBoundary(Component, options);
}

// ============================================================
// Exports
// ============================================================

export default withBoundary;
