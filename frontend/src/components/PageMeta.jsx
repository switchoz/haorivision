import { useEffect } from "react";

/**
 * Lightweight page meta tag manager.
 * Updates document.title and meta description on mount.
 */
export default function PageMeta({ title, description, image }) {
  useEffect(() => {
    const base = "HAORI VISION";
    document.title = title
      ? `${title} | ${base}`
      : `${base} — Носимое световое искусство`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", document.title);

      let twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", document.title);

      let twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", description);
    }

    if (image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute("content", image);

      let twImage = document.querySelector('meta[name="twitter:image"]');
      if (!twImage) {
        twImage = document.createElement("meta");
        twImage.setAttribute("name", "twitter:image");
        document.head.appendChild(twImage);
      }
      twImage.setAttribute("content", image);

      let twCard = document.querySelector('meta[name="twitter:card"]');
      if (!twCard) {
        twCard = document.createElement("meta");
        twCard.setAttribute("name", "twitter:card");
        document.head.appendChild(twCard);
      }
      twCard.setAttribute("content", "summary_large_image");
    }

    // Canonical URL (strip query params and hash)
    const canonical = window.location.origin + window.location.pathname;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", canonical);
  }, [title, description, image]);

  return null;
}
