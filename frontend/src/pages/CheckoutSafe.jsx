/**
 * HAORI VISION — Checkout with Error Boundary
 *
 * Wrapped version of Checkout component with checkout-specific error boundary.
 * This is the Add-Only approach - original Checkout.jsx is unchanged.
 */

import { withCheckoutBoundary } from "../hoc/withBoundary";
import Checkout from "./Checkout";

// Wrap Checkout component with checkout error boundary
const CheckoutSafe = withCheckoutBoundary(Checkout);

export default CheckoutSafe;
