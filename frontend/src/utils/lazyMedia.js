/**
 * HAORI VISION  Lazy Loading Media Utilities
 *
 * Provides lazy-loading for images and videos using Intersection Observer
 * Supports:
 * - Progressive image loading (placeholder � full)
 * - Video lazy-loading (load on viewport entry)
 * - WebP/AVIF fallback with <picture>
 * - Responsive images with srcset
 *
 * Usage:
 *   import { initLazyImages, initLazyVideos } from '@/utils/lazyMedia';
 *
 *   initLazyImages();
 *   initLazyVideos();
 */

// ============================================================
// Configuration
// ============================================================

const LAZY_CONFIG = {
  // Intersection Observer options
  rootMargin: "50px 0px", // Start loading 50px before element enters viewport
  threshold: 0.01,

  // CSS classes
  imageClass: "lazy-image",
  videoClass: "lazy-video",
  loadedClass: "lazy-loaded",
  loadingClass: "lazy-loading",
  errorClass: "lazy-error",

  // Attributes
  srcAttribute: "data-src",
  srcsetAttribute: "data-srcset",
  sizesAttribute: "data-sizes",
  posterAttribute: "data-poster",
};

// ============================================================
// Intersection Observer Setup
// ============================================================

let imageObserver = null;
let videoObserver = null;

function getObserver(callback) {
  if (!("IntersectionObserver" in window)) {
    console.warn(
      "IntersectionObserver not supported, loading all media immediately",
    );
    return null;
  }

  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: LAZY_CONFIG.rootMargin,
      threshold: LAZY_CONFIG.threshold,
    },
  );
}

// ============================================================
// Image Lazy Loading
// ============================================================

/**
 * Load a single image element
 */
function loadImage(img) {
  const src = img.getAttribute(LAZY_CONFIG.srcAttribute);
  const srcset = img.getAttribute(LAZY_CONFIG.srcsetAttribute);
  const sizes = img.getAttribute(LAZY_CONFIG.sizesAttribute);

  if (!src && !srcset) {
    console.warn("No data-src or data-srcset found:", img);
    return;
  }

  // Add loading class
  img.classList.add(LAZY_CONFIG.loadingClass);

  // Create temporary image to preload
  const tempImg = new Image();

  tempImg.onload = () => {
    // Apply sources
    if (srcset) {
      img.srcset = srcset;
    }
    if (sizes) {
      img.sizes = sizes;
    }
    if (src) {
      img.src = src;
    }

    // Update classes
    img.classList.remove(LAZY_CONFIG.loadingClass);
    img.classList.add(LAZY_CONFIG.loadedClass);

    // Remove data attributes
    img.removeAttribute(LAZY_CONFIG.srcAttribute);
    img.removeAttribute(LAZY_CONFIG.srcsetAttribute);
    img.removeAttribute(LAZY_CONFIG.sizesAttribute);
  };

  tempImg.onerror = () => {
    img.classList.remove(LAZY_CONFIG.loadingClass);
    img.classList.add(LAZY_CONFIG.errorClass);
    console.error("Failed to load image:", src || srcset);
  };

  // Start preload
  if (srcset) {
    tempImg.srcset = srcset;
  }
  if (src) {
    tempImg.src = src;
  }
}

/**
 * Load a <picture> element
 */
function loadPicture(picture) {
  const sources = picture.querySelectorAll("source");
  const img = picture.querySelector("img");

  if (!img) {
    console.warn("No <img> found in <picture>:", picture);
    return;
  }

  // Add loading class
  picture.classList.add(LAZY_CONFIG.loadingClass);

  // Load all source elements
  sources.forEach((source) => {
    const srcset = source.getAttribute(LAZY_CONFIG.srcsetAttribute);
    const sizes = source.getAttribute(LAZY_CONFIG.sizesAttribute);

    if (srcset) {
      source.srcset = srcset;
      source.removeAttribute(LAZY_CONFIG.srcsetAttribute);
    }
    if (sizes) {
      source.sizes = sizes;
      source.removeAttribute(LAZY_CONFIG.sizesAttribute);
    }
  });

  // Load img element
  const src = img.getAttribute(LAZY_CONFIG.srcAttribute);
  const srcset = img.getAttribute(LAZY_CONFIG.srcsetAttribute);

  if (srcset) {
    img.srcset = srcset;
    img.removeAttribute(LAZY_CONFIG.srcsetAttribute);
  }
  if (src) {
    img.src = src;
    img.removeAttribute(LAZY_CONFIG.srcAttribute);
  }

  // Update classes on load
  img.onload = () => {
    picture.classList.remove(LAZY_CONFIG.loadingClass);
    picture.classList.add(LAZY_CONFIG.loadedClass);
  };

  img.onerror = () => {
    picture.classList.remove(LAZY_CONFIG.loadingClass);
    picture.classList.add(LAZY_CONFIG.errorClass);
  };
}

/**
 * Initialize lazy loading for all images
 */
export function initLazyImages(container = document) {
  // Find all lazy images
  const images = container.querySelectorAll(`img[${LAZY_CONFIG.srcAttribute}]`);
  const pictures = container.querySelectorAll(
    `picture[${LAZY_CONFIG.srcAttribute}]`,
  );

  // Create observer if not exists
  if (!imageObserver) {
    imageObserver = getObserver((element) => {
      if (element.tagName === "IMG") {
        loadImage(element);
      } else if (element.tagName === "PICTURE") {
        loadPicture(element);
      }
    });
  }

  // Observe images
  if (imageObserver) {
    images.forEach((img) => {
      img.classList.add(LAZY_CONFIG.imageClass);
      imageObserver.observe(img);
    });

    pictures.forEach((picture) => {
      picture.classList.add(LAZY_CONFIG.imageClass);
      imageObserver.observe(picture);
    });
  } else {
    // Fallback: load immediately if no IntersectionObserver
    images.forEach(loadImage);
    pictures.forEach(loadPicture);
  }

  return {
    images: images.length,
    pictures: pictures.length,
    total: images.length + pictures.length,
  };
}

// ============================================================
// Video Lazy Loading
// ============================================================

/**
 * Load a single video element
 */
function loadVideo(video) {
  const src = video.getAttribute(LAZY_CONFIG.srcAttribute);
  const poster = video.getAttribute(LAZY_CONFIG.posterAttribute);

  if (!src) {
    console.warn("No data-src found on video:", video);
    return;
  }

  // Add loading class
  video.classList.add(LAZY_CONFIG.loadingClass);

  // Set poster if available
  if (poster) {
    video.poster = poster;
    video.removeAttribute(LAZY_CONFIG.posterAttribute);
  }

  // Load video sources
  const sources = video.querySelectorAll("source");

  if (sources.length > 0) {
    // Load from <source> elements
    sources.forEach((source) => {
      const sourceSrc = source.getAttribute(LAZY_CONFIG.srcAttribute);
      if (sourceSrc) {
        source.src = sourceSrc;
        source.removeAttribute(LAZY_CONFIG.srcAttribute);
      }
    });

    // Force video to reload sources
    video.load();
  } else {
    // Load directly on video element
    video.src = src;
  }

  // Remove data attribute
  video.removeAttribute(LAZY_CONFIG.srcAttribute);

  // Update classes
  video.classList.remove(LAZY_CONFIG.loadingClass);
  video.classList.add(LAZY_CONFIG.loadedClass);

  // Optional: start playing if autoplay is set
  if (video.hasAttribute("autoplay")) {
    video.play().catch((err) => {
      console.warn("Autoplay failed:", err);
    });
  }
}

/**
 * Initialize lazy loading for all videos
 */
export function initLazyVideos(container = document) {
  // Find all lazy videos
  const videos = container.querySelectorAll(
    `video[${LAZY_CONFIG.srcAttribute}]`,
  );

  // Create observer if not exists
  if (!videoObserver) {
    videoObserver = getObserver(loadVideo);
  }

  // Observe videos
  if (videoObserver) {
    videos.forEach((video) => {
      video.classList.add(LAZY_CONFIG.videoClass);
      videoObserver.observe(video);
    });
  } else {
    // Fallback: load immediately
    videos.forEach(loadVideo);
  }

  return {
    videos: videos.length,
  };
}

// ============================================================
// Auto-initialize on DOMContentLoaded
// ============================================================

/**
 * Initialize all lazy loading
 */
export function initLazyMedia() {
  const imageStats = initLazyImages();
  const videoStats = initLazyVideos();

  console.log("[LazyMedia] Initialized:", {
    images: imageStats.total,
    videos: videoStats.videos,
  });

  return {
    ...imageStats,
    ...videoStats,
  };
}

// ============================================================
// Utility: Generate <picture> with WebP/AVIF
// ============================================================

/**
 * Generate HTML for optimized <picture> element
 *
 * @param {string} basename - Base filename without extension (e.g., "product-hero")
 * @param {string} alt - Alt text for accessibility
 * @param {object} options - Additional options
 * @returns {string} HTML string
 */
export function generatePictureHTML(basename, alt, options = {}) {
  const {
    path = "/media/optimized",
    sizes = "(max-width: 768px) 100vw, 50vw",
    loading = "lazy",
    className = "",
  } = options;

  const useLazy = loading === "lazy";
  const srcAttr = useLazy ? LAZY_CONFIG.srcAttribute : "src";
  const srcsetAttr = useLazy ? LAZY_CONFIG.srcsetAttribute : "srcset";

  return `
<picture class="${className}">
  <!-- AVIF: Best compression, modern browsers -->
  <source
    type="image/avif"
    ${srcsetAttr}="${path}/${basename}.avif"
    sizes="${sizes}"
  />

  <!-- WebP: Good compression, wide support -->
  <source
    type="image/webp"
    ${srcsetAttr}="${path}/${basename}.webp"
    sizes="${sizes}"
  />

  <!-- JPEG: Fallback for older browsers -->
  <img
    ${srcAttr}="${path}/${basename}.jpg"
    alt="${alt}"
    loading="${loading}"
    decoding="async"
    class="${className}"
  />
</picture>
  `.trim();
}

// ============================================================
// Utility: Generate responsive <img> with srcset
// ============================================================

/**
 * Generate HTML for responsive image with srcset
 *
 * @param {string} basename - Base filename without extension and size
 * @param {string} alt - Alt text
 * @param {object} options - Additional options
 * @returns {string} HTML string
 */
export function generateResponsiveImageHTML(basename, alt, options = {}) {
  const {
    path = "/media/optimized",
    widths = [480, 768, 1024, 1600],
    sizes = "(max-width: 768px) 100vw, 50vw",
    loading = "lazy",
    className = "",
  } = options;

  const useLazy = loading === "lazy";
  const srcAttr = useLazy ? LAZY_CONFIG.srcAttribute : "src";
  const srcsetAttr = useLazy ? LAZY_CONFIG.srcsetAttribute : "srcset";

  // Generate srcset entries
  const srcset = widths
    .map((w) => `${path}/${basename}-${w}w.webp ${w}w`)
    .join(", ");

  // Use largest as fallback src
  const fallbackSrc = `${path}/${basename}-${widths[widths.length - 1]}w.webp`;

  return `
<img
  ${srcAttr}="${fallbackSrc}"
  ${srcsetAttr}="${srcset}"
  sizes="${sizes}"
  alt="${alt}"
  loading="${loading}"
  decoding="async"
  class="${className}"
/>
  `.trim();
}

// ============================================================
// Export configuration for customization
// ============================================================

export { LAZY_CONFIG };
