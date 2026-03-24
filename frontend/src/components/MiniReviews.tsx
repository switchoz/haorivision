/**
 * HAORI VISION — Mini Reviews Component (P16 Trust Blocks)
 *
 * Displays short customer review quotes with avatars.
 * Part of Trust Blocks system to increase conversion on product pages.
 *
 * Features:
 * - 3 review quotes (RU/EN bilingual)
 * - Small avatar placeholders
 * - Star ratings
 * - Verified purchase badges
 * - Responsive carousel on mobile
 *
 * Usage:
 *   import MiniReviews from '@/components/MiniReviews';
 *
 *   <MiniReviews productId="P001" />
 */

import { useState, useEffect } from "react";

interface Review {
  id: string;
  name: string;
  location: string;
  quote_ru: string;
  quote_en: string;
  rating: number;
  product_ids: string[];
  avatar: string;
  verified: boolean;
}

interface MiniReviewsProps {
  productId?: string;
  language?: "ru" | "en";
  limit?: number;
  className?: string;
}

export default function MiniReviews({
  productId,
  language = "ru",
  limit = 3,
  className = "",
}: MiniReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load reviews from data file
    fetch("/data/reviews.json")
      .then((res) => res.json())
      .then((data) => {
        let filteredReviews = data.reviews || [];

        // Filter by product ID if specified
        if (productId) {
          filteredReviews = filteredReviews.filter((review: Review) =>
            review.product_ids.includes(productId),
          );
        }

        // Limit number of reviews
        filteredReviews = filteredReviews.slice(0, limit);

        setReviews(filteredReviews);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load reviews:", error);
        setLoading(false);
      });
  }, [productId, limit]);

  if (loading) {
    return (
      <div className={`mini-reviews mini-reviews--loading ${className}`}>
        <p className="mini-reviews__loading-text">Загрузка отзывов...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className={`mini-reviews ${className}`}>
      <div className="mini-reviews__container">
        {/* Header */}
        <div className="mini-reviews__header">
          <h2 className="mini-reviews__title">Что говорят наши клиенты</h2>
          <p className="mini-reviews__subtitle">
            Настоящие отзывы от владельцев изделий HAORI VISION
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="mini-reviews__grid">
          {reviews.map((review) => (
            <div key={review.id} className="mini-review">
              {/* Avatar */}
              <div className="mini-review__avatar-wrapper">
                <img
                  src={review.avatar}
                  alt={`${review.name} avatar`}
                  className="mini-review__avatar"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    (e.target as HTMLImageElement).src =
                      "/media/avatars/default.jpg";
                  }}
                />
                {review.verified && (
                  <div
                    className="mini-review__verified"
                    title="Подтверждённая покупка"
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mini-review__content">
                {/* Rating */}
                <div className="mini-review__rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`mini-review__star ${
                        i < review.rating ? "mini-review__star--filled" : ""
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="mini-review__quote">
                  {language === "ru" ? review.quote_ru : review.quote_en}
                </blockquote>

                {/* Author */}
                <div className="mini-review__author">
                  <span className="mini-review__name">{review.name}</span>
                  <span className="mini-review__location">
                    {review.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .mini-reviews {
          width: 100%;
          padding: 4rem 2rem;
          background: #18181b;
        }

        .mini-reviews--loading {
          padding: 2rem;
          text-align: center;
        }

        .mini-reviews__loading-text {
          color: #a1a1aa;
        }

        .mini-reviews__container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .mini-reviews__header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .mini-reviews__title {
          font-size: 2.5rem;
          font-weight: 300;
          color: #ffffff;
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }

        .mini-reviews__subtitle {
          font-size: 1.125rem;
          color: #a1a1aa;
        }

        .mini-reviews__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .mini-review {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 2rem;
          background: #27272a;
          border-radius: 12px;
          border: 1px solid #3f3f46;
          transition: all 0.3s ease;
        }

        .mini-review:hover {
          border-color: #52525b;
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .mini-review__avatar-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
        }

        .mini-review__avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: #3f3f46;
        }

        .mini-review__verified {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          border: 2px solid #27272a;
        }

        .mini-review__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mini-review__rating {
          display: flex;
          gap: 0.25rem;
        }

        .mini-review__star {
          font-size: 1.25rem;
          color: #3f3f46;
        }

        .mini-review__star--filled {
          color: #fbbf24;
        }

        .mini-review__quote {
          font-size: 1rem;
          line-height: 1.6;
          color: #e4e4e7;
          margin: 0;
          font-style: italic;
        }

        .mini-review__author {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: auto;
        }

        .mini-review__name {
          font-size: 1rem;
          font-weight: 500;
          color: #ffffff;
        }

        .mini-review__location {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .mini-reviews {
            padding: 3rem 1.5rem;
          }

          .mini-reviews__title {
            font-size: 2rem;
          }

          .mini-reviews__subtitle {
            font-size: 1rem;
          }

          .mini-reviews__grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
}
