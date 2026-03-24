import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * useAnalytics Hook
 * Клиентский трекинг для HAORI VISION
 */

const ANALYTICS_API = "/api/analytics";

// Session ID сохраняется в localStorage
const getSessionId = () => {
  let sessionId = localStorage.getItem("hv_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("hv_session_id", sessionId);
  }
  return sessionId;
};

// Client ID (если залогинен)
const getClientId = () => {
  const client = localStorage.getItem("hv_client");
  return client ? JSON.parse(client).id : null;
};

export const useAnalytics = () => {
  const sessionId = getSessionId();
  const clientId = getClientId();
  const pageStartTime = useRef(Date.now());

  /**
   * Track page view
   */
  const trackPageView = (page, path) => {
    const data = {
      sessionId: sessionId,
      clientId: clientId,
      page: page,
      path: path || window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      country: null, // Will be detected server-side via IP
      city: null,
    };

    fetch(`${ANALYTICS_API}/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("Analytics error:", err));
  };

  /**
   * Track time on page
   */
  const trackTimeOnPage = (page) => {
    const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 1000);
    const scrollDepth = Math.round(
      (window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)) *
        100,
    );

    const data = {
      sessionId: sessionId,
      clientId: clientId,
      page: page,
      path: window.location.pathname,
      timeOnPage: timeOnPage,
      scrollDepth: scrollDepth,
    };

    fetch(`${ANALYTICS_API}/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("Analytics error:", err));
  };

  /**
   * Track interaction
   */
  const trackInteraction = (type, element, elementId, metadata = {}) => {
    const data = {
      sessionId: sessionId,
      clientId: clientId,
      type: type,
      element: element,
      elementId: elementId,
      page: window.location.pathname,
      metadata: metadata,
    };

    fetch(`${ANALYTICS_API}/interaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("Analytics error:", err));
  };

  /**
   * Track conversion
   */
  const trackConversion = (type, value = 0, metadata = {}) => {
    // Parse UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get("utm_source");
    const medium = urlParams.get("utm_medium");
    const campaign = urlParams.get("utm_campaign");

    const data = {
      sessionId: sessionId,
      clientId: clientId,
      type: type,
      source: source,
      medium: medium,
      campaign: campaign,
      value: value,
      metadata: metadata,
    };

    fetch(`${ANALYTICS_API}/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("Analytics error:", err));
  };

  /**
   * Track product view
   */
  const trackProductView = (productId, productName, collection) => {
    trackInteraction("product_view", `Product: ${productName}`, productId, {
      productId: productId,
      productName: productName,
      collection: collection,
    });
  };

  /**
   * Track add to cart
   */
  const trackAddToCart = (productId, productName, price) => {
    trackInteraction("add_to_cart", `Add to Cart: ${productName}`, productId, {
      productId: productId,
      productName: productName,
      price: price,
    });
  };

  /**
   * Track purchase
   */
  const trackPurchase = (orderId, total, products) => {
    trackConversion("purchase", total, {
      orderId: orderId,
      products: products,
    });
  };

  /**
   * Track video play
   */
  const trackVideoPlay = (videoId, videoTitle) => {
    trackInteraction("video_play", `Video: ${videoTitle}`, videoId);
  };

  /**
   * Track form submit
   */
  const trackFormSubmit = (formName) => {
    trackInteraction("form_submit", `Form: ${formName}`, formName);
  };

  /**
   * Auto-track page view on mount
   */
  useEffect(() => {
    trackPageView(document.title, window.location.pathname);

    // Track time on page when leaving
    return () => {
      trackTimeOnPage(document.title);
    };
  }, []);

  return {
    trackPageView,
    trackInteraction,
    trackConversion,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    trackVideoPlay,
    trackFormSubmit,
  };
};

export default useAnalytics;
