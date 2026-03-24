/**
 * HAORI VISION — ProductDetail with Trust Blocks (P16)
 *
 * Enhanced version of ProductDetail that conditionally includes Trust Blocks
 * for new products only (Add-Only principle - old products remain unchanged).
 *
 * Trust Blocks included:
 * - HowMade: Video showing craftsmanship process
 * - MiniReviews: Customer review quotes
 *
 * Usage:
 *   Import this component instead of ProductDetail for new product pages
 *   defined in /configs/trust_blocks.json
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProductDetail from "./ProductDetail";
import HowMade from "../components/HowMade";
import MiniReviews from "../components/MiniReviews";

export default function ProductDetailWithTrustBlocks(props) {
  const { productId } = useParams();
  const [shouldShowTrustBlocks, setShouldShowTrustBlocks] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Load Trust Blocks configuration
    fetch("/configs/trust_blocks.json")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);

        // Check if this product should have Trust Blocks
        const isNewProduct = data.new_products?.includes(productId);
        const isEnabled = data.enabled !== false;

        setShouldShowTrustBlocks(isNewProduct && isEnabled);
      })
      .catch((error) => {
        console.error("[P16] Failed to load Trust Blocks config:", error);
        // Fail gracefully - show product page without Trust Blocks
        setShouldShowTrustBlocks(false);
      });
  }, [productId]);

  return (
    <div className="product-detail-with-trust-blocks">
      {/* Original ProductDetail component (unchanged) */}
      <ProductDetail {...props} />

      {/* Trust Blocks (only for new products) */}
      {shouldShowTrustBlocks && config && (
        <div className="trust-blocks-section">
          {/* How Made Video Block */}
          {config.trust_blocks?.how_made?.enabled && (
            <HowMade
              videoSrc={config.trust_blocks.how_made.video_path}
              title={config.trust_blocks.how_made.title_ru}
              subtitle="Каждое изделие создаётся вручную с вниманием к деталям"
            />
          )}

          {/* Mini Reviews Block */}
          {config.trust_blocks?.mini_reviews?.enabled && (
            <MiniReviews
              productId={productId}
              language="ru"
              limit={config.trust_blocks.mini_reviews.limit || 3}
            />
          )}
        </div>
      )}

      <style jsx>{`
        .product-detail-with-trust-blocks {
          width: 100%;
        }

        .trust-blocks-section {
          width: 100%;
          background: #18181b;
        }

        /* Add subtle divider between product detail and trust blocks */
        .trust-blocks-section::before {
          content: "";
          display: block;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #3f3f46 50%,
            transparent 100%
          );
          margin: 0 auto;
          width: 80%;
          max-width: 1200px;
        }
      `}</style>
    </div>
  );
}
