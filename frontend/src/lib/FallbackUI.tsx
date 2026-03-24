/**
 * HAORI VISION — Fallback UI Component
 *
 * Minimalist fallback UI for error boundaries.
 * Provides alternative contact methods when components fail.
 *
 * Usage:
 *   import { FallbackUI } from '@/lib/FallbackUI';
 *
 *   <ErrorBoundary fallback={<FallbackUI />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */

import React from "react";

// ============================================================
// Types
// ============================================================

export interface FallbackUIProps {
  title?: string;
  message?: string;
  showContactOptions?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  productId?: string;
}

// ============================================================
// Fallback UI Component
// ============================================================

export function FallbackUI({
  title = "Произошла ошибка",
  message = "Извините, что-то пошло не так. Вы можете продолжить оформление через другие каналы.",
  showContactOptions = true,
  showRetry = true,
  onRetry,
  productId,
}: FallbackUIProps): JSX.Element {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  // Build DM link with optional product context
  const dmLink = productId
    ? `https://instagram.com/haorivision?dm=${encodeURIComponent(`Интересует товар: ${productId}`)}`
    : "https://instagram.com/haorivision";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        minHeight: "400px",
        backgroundColor: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Error Icon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          marginBottom: "2rem",
          borderRadius: "50%",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
        }}
      >
        ⚠️
      </div>

      {/* Title */}
      <h2
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.75rem",
          fontWeight: "500",
          color: "#000",
          textAlign: "center",
        }}
      >
        {title}
      </h2>

      {/* Message */}
      <p
        style={{
          margin: "0 0 2rem 0",
          fontSize: "1rem",
          color: "#666",
          textAlign: "center",
          maxWidth: "500px",
          lineHeight: "1.6",
        }}
      >
        {message}
      </p>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {showRetry && (
          <button
            onClick={handleRetry}
            style={{
              padding: "1rem 2rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#000";
            }}
          >
            Попробовать снова
          </button>
        )}

        {showContactOptions && (
          <>
            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "1rem 0",
                color: "#999",
              }}
            >
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}
              />
              <span style={{ padding: "0 1rem", fontSize: "0.875rem" }}>
                или
              </span>
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}
              />
            </div>

            {/* Contact Options */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <a
                href={dmLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "1px solid #000",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                📱 Написать в Direct
              </a>

              <a
                href="/forms/bespoke.html"
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "1px solid #000",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                ✉️ Оформить через форму
              </a>
            </div>
          </>
        )}

        {/* Home Link */}
        <a
          href="/"
          style={{
            marginTop: "1rem",
            padding: "0.75rem 2rem",
            color: "#666",
            fontSize: "0.875rem",
            textDecoration: "none",
            textAlign: "center",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#666";
          }}
        >
          ← На главную
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Specialized Fallback Components
// ============================================================

/**
 * Checkout Fallback
 */
export function CheckoutFallback(): JSX.Element {
  return (
    <FallbackUI
      title="Ошибка оформления заказа"
      message="К сожалению, возникла проблема с оформлением заказа. Пожалуйста, свяжитесь с нами напрямую, и мы поможем завершить покупку."
      showContactOptions={true}
      showRetry={true}
    />
  );
}

/**
 * Product Fallback
 */
export function ProductFallback({
  productId,
}: {
  productId?: string;
}): JSX.Element {
  return (
    <FallbackUI
      title="Ошибка загрузки товара"
      message="Не удалось загрузить информацию о товаре. Вы можете связаться с нами для получения подробностей."
      showContactOptions={true}
      showRetry={true}
      productId={productId}
    />
  );
}

/**
 * Cart Fallback
 */
export function CartFallback(): JSX.Element {
  return (
    <FallbackUI
      title="Ошибка корзины"
      message="Возникла проблема с корзиной. Попробуйте обновить страницу или свяжитесь с нами для оформления заказа."
      showContactOptions={true}
      showRetry={true}
    />
  );
}

/**
 * Generic Network Error Fallback
 */
export function NetworkErrorFallback(): JSX.Element {
  return (
    <FallbackUI
      title="Проблема с подключением"
      message="Не удалось подключиться к серверу. Проверьте интернет-соединение и попробуйте снова."
      showContactOptions={false}
      showRetry={true}
    />
  );
}

/**
 * Minimal Fallback (no contact options)
 */
export function MinimalFallback(): JSX.Element {
  return (
    <FallbackUI
      title="Что-то пошло не так"
      message="Попробуйте обновить страницу или вернуться на главную."
      showContactOptions={false}
      showRetry={true}
    />
  );
}

// ============================================================
// Exports
// ============================================================

export default FallbackUI;
