/**
 * HAORI VISION — Shop with Error Boundary
 *
 * Wrapped version of Shop component with cart-specific error boundary.
 * This is the Add-Only approach - original Shop.jsx is unchanged.
 */

import { withCartBoundary } from "../hoc/withBoundary";
import Shop from "./Shop";

// Wrap Shop component with cart error boundary
const ShopSafe = withCartBoundary(Shop);

export default ShopSafe;
