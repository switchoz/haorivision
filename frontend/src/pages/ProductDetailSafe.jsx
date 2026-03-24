/**
 * HAORI VISION — ProductDetail with Error Boundary
 *
 * Wrapped version of ProductDetail component with product-specific error boundary.
 * This is the Add-Only approach - original ProductDetail.jsx is unchanged.
 */

import { withProductBoundary } from "../hoc/withBoundary";
import { useParams } from "react-router-dom";
import ProductDetail from "./ProductDetail";

// Wrapper component to pass productId to boundary
const ProductDetailWithId = (props) => {
  const { productId } = useParams();

  // Wrap with product boundary including productId context
  const SafeProductDetail = withProductBoundary(ProductDetail, productId);

  return <SafeProductDetail {...props} />;
};

export default ProductDetailWithId;
