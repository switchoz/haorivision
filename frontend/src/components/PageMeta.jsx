import { useEffect } from "react";

/**
 * Lightweight page meta tag manager.
 * Updates document.title and meta description on mount.
 */
export default function PageMeta({ title, description }) {
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
  }, [title, description]);

  return null;
}
