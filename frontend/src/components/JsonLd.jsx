/**
 * JSON-LD structured data for SEO.
 * Renders a <script type="application/ld+json"> tag.
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Product JSON-LD (Schema.org)
 */
export function ProductJsonLd({ product }) {
  if (!product) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.short || product.tagline,
    image: product.images?.daylight?.hero,
    brand: {
      "@type": "Brand",
      name: "HAORI VISION",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "USD",
      availability:
        product.status === "available" || product.status === "low-stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "HAORI VISION",
      },
    },
  };

  if (product.rating?.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
    };
  }

  return <JsonLd data={data} />;
}

/**
 * BlogPosting JSON-LD (Schema.org)
 */
/**
 * Organization JSON-LD (Schema.org)
 */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "HAORI VISION",
        url: "https://haorivision.com",
        logo: "https://haorivision.com/favicon.svg",
        description:
          "Носимое световое искусство. Хаори с ручной росписью UV-красками.",
        sameAs: [
          "https://instagram.com/DIKO.RATIVNO",
          "https://t.me/haori_vision_bot",
        ],
        founder: {
          "@type": "Person",
          name: "Елизавета Федькина",
        },
      }}
    />
  );
}

/**
 * FAQPage JSON-LD (Schema.org)
 */
export function FAQPageJsonLd({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

/**
 * BreadcrumbList JSON-LD (Schema.org)
 */
export function BreadcrumbJsonLd({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/**
 * BlogPosting JSON-LD (Schema.org)
 */
export function BlogPostJsonLd({ post }) {
  if (!post) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: {
          "@type": "Person",
          name: post.author || "LiZa",
        },
        publisher: {
          "@type": "Organization",
          name: "HAORI VISION",
        },
      }}
    />
  );
}
