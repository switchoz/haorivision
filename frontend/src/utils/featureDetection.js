/**
 * Feature Detection & Browser Capability Checks
 * Provides graceful degradation for unsupported features
 */

export const BrowserFeatures = {
  // WebGL Support
  hasWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  },

  hasWebGL2() {
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch (e) {
      return false;
    }
  },

  // Image Format Support
  supportsWebP() {
    if (typeof window.__HAORI_FEATURES__ !== "undefined") {
      return window.__HAORI_FEATURES__.webp;
    }

    const canvas = document.createElement("canvas");
    if (canvas.getContext && canvas.getContext("2d")) {
      return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    }
    return false;
  },

  supportsAVIF() {
    if (typeof window.__HAORI_FEATURES__ !== "undefined") {
      return window.__HAORI_FEATURES__.avif;
    }
    return false;
  },

  // Browser Capabilities
  hasIntersectionObserver() {
    return "IntersectionObserver" in window;
  },

  hasResizeObserver() {
    return "ResizeObserver" in window;
  },

  hasRequestIdleCallback() {
    return "requestIdleCallback" in window;
  },

  // CSS Features
  supportsGrid() {
    return CSS.supports("display", "grid");
  },

  supportsFlexbox() {
    return CSS.supports("display", "flex");
  },

  supportsCustomProperties() {
    return CSS.supports("--test", "0");
  },

  // Storage
  hasLocalStorage() {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  hasSessionStorage() {
    try {
      const test = "__test__";
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  hasIndexedDB() {
    return "indexedDB" in window;
  },

  // Network Features
  hasServiceWorker() {
    return "serviceWorker" in navigator;
  },

  hasFetch() {
    return "fetch" in window;
  },

  // Device Features
  isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  },

  isRetina() {
    return window.devicePixelRatio > 1;
  },

  // Performance Features
  hasPerformanceAPI() {
    return "performance" in window && "now" in window.performance;
  },

  // Media Features
  hasMediaDevices() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // Animation Features
  hasRequestAnimationFrame() {
    return "requestAnimationFrame" in window;
  },

  // Web Components
  hasCustomElements() {
    return "customElements" in window;
  },

  // Modern JS Features
  hasAsyncAwait() {
    try {
      eval("(async () => {})");
      return true;
    } catch (e) {
      return false;
    }
  },

  hasES6Modules() {
    return "noModule" in document.createElement("script");
  },

  // Canvas & Graphics
  hasCanvas() {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext && canvas.getContext("2d"));
  },

  hasOffscreenCanvas() {
    return "OffscreenCanvas" in window;
  },

  // Audio Features
  hasWebAudio() {
    return "AudioContext" in window || "webkitAudioContext" in window;
  },

  // Get optimal image format
  getOptimalImageFormat() {
    if (this.supportsAVIF()) return "avif";
    if (this.supportsWebP()) return "webp";
    return "jpg";
  },

  // Check if device is low-end
  isLowEndDevice() {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 1;

    // Check device memory (if available)
    const memory = navigator.deviceMemory || 4;

    // Check if it's a mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // Consider low-end if: mobile with 2GB or less RAM, or desktop with 2 cores or less
    return (isMobile && memory <= 2) || cores <= 2;
  },

  // Get recommended quality settings
  getRecommendedQuality() {
    if (this.isLowEndDevice()) {
      return {
        graphicsQuality: "low",
        enableShadows: false,
        enablePostProcessing: false,
        maxParticles: 50,
        textureQuality: "low",
      };
    }

    if (!this.hasWebGL2() || this.isTouchDevice()) {
      return {
        graphicsQuality: "medium",
        enableShadows: true,
        enablePostProcessing: false,
        maxParticles: 100,
        textureQuality: "medium",
      };
    }

    return {
      graphicsQuality: "high",
      enableShadows: true,
      enablePostProcessing: true,
      maxParticles: 200,
      textureQuality: "high",
    };
  },
};

// Create a fallback for older browsers
export const setupFallbacks = () => {
  // RequestAnimationFrame polyfill
  if (!BrowserFeatures.hasRequestAnimationFrame()) {
    window.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 1000 / 60);
    };
    window.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }

  // RequestIdleCallback polyfill
  if (!BrowserFeatures.hasRequestIdleCallback()) {
    window.requestIdleCallback = (callback) => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };
    window.cancelIdleCallback = (id) => {
      clearTimeout(id);
    };
  }

  // Console polyfill for older browsers
  if (!window.console) {
    window.console = {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
    };
  }
};

// Initialize feature detection
export const initFeatureDetection = () => {
  setupFallbacks();

  // Add classes to document element based on features
  const html = document.documentElement;

  html.classList.add(BrowserFeatures.hasWebGL() ? "webgl" : "no-webgl");
  html.classList.add(BrowserFeatures.hasWebGL2() ? "webgl2" : "no-webgl2");
  html.classList.add(BrowserFeatures.isTouchDevice() ? "touch" : "no-touch");
  html.classList.add(BrowserFeatures.isRetina() ? "retina" : "no-retina");
  html.classList.add(BrowserFeatures.supportsWebP() ? "webp" : "no-webp");
  html.classList.add(BrowserFeatures.supportsAVIF() ? "avif" : "no-avif");

  // Log capabilities in development
  if (import.meta.env.DEV) {
    console.log("🔍 Browser Capabilities:", {
      webgl: BrowserFeatures.hasWebGL(),
      webgl2: BrowserFeatures.hasWebGL2(),
      webp: BrowserFeatures.supportsWebP(),
      avif: BrowserFeatures.supportsAVIF(),
      touch: BrowserFeatures.isTouchDevice(),
      lowEnd: BrowserFeatures.isLowEndDevice(),
      recommendedQuality: BrowserFeatures.getRecommendedQuality(),
    });
  }

  return BrowserFeatures;
};

export default BrowserFeatures;
