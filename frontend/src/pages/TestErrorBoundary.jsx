/**
 * HAORI VISION — Test Error Boundary Component
 *
 * Test page to verify Reliability Kit error boundaries.
 * This component intentionally throws errors to test fallback UI.
 *
 * Access at: /test-error-boundary
 */

import { useState } from "react";
import { withBoundary } from "../hoc/withBoundary";

// Component that always throws error
const AlwaysThrows = () => {
  throw new Error("Test Error: This component intentionally throws an error!");
  return <div>You should not see this</div>;
};

// Component that throws on button click
const ThrowOnClick = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("Test Error: Button click triggered this error!");
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2 style={{ color: "white", marginBottom: "1rem" }}>
        Тест ошибки по клику
      </h2>
      <button
        onClick={() => setShouldThrow(true)}
        style={{
          padding: "1rem 2rem",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Нажми, чтобы сломать компонент
      </button>
    </div>
  );
};

// Wrap test components with boundaries
const SafeAlwaysThrows = withBoundary(AlwaysThrows, {
  fallbackType: "default",
  name: "AlwaysThrows-Test",
});

const SafeThrowOnClick = withBoundary(ThrowOnClick, {
  fallbackType: "cart",
  name: "ThrowOnClick-Test",
});

// Main test page
const TestErrorBoundary = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        padding: "4rem 2rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1
            style={{ color: "white", fontSize: "3rem", marginBottom: "1rem" }}
          >
            Тест Error Boundaries
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "1.25rem" }}>
            Проверка Reliability Kit — каждая секция обёрнута в ErrorBoundary
          </p>
        </div>

        {/* Test Section 1: Always Throws */}
        <div
          style={{
            backgroundColor: "#27272a",
            borderRadius: "8px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "1rem" }}>
            Тест 1: Компонент всегда падает
          </h2>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            Этот компонент падает при рендеринге. Вы должны увидеть fallback UI.
          </p>
          <SafeAlwaysThrows />
        </div>

        {/* Test Section 2: Throws on Click */}
        <div
          style={{
            backgroundColor: "#27272a",
            borderRadius: "8px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "1rem" }}>
            Тест 2: Ошибка по клику
          </h2>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            Нажмите кнопку ниже, чтобы вызвать ошибку. Fallback UI с корзиной
            появится.
          </p>
          <SafeThrowOnClick />
        </div>

        {/* Instructions */}
        <div
          style={{
            backgroundColor: "#27272a",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "1rem" }}>
            Что проверить:
          </h2>
          <ul style={{ color: "#a1a1aa", lineHeight: "2" }}>
            <li>✓ Fallback UI отображается вместо сломанного компонента</li>
            <li>✓ Другие секции продолжают работать нормально</li>
            <li>✓ Кнопка "Попробовать снова" перезагружает страницу</li>
            <li>
              ✓ Ссылки "Написать в Direct" и "Оформить через форму" работают
            </li>
            <li>✓ Ошибки логируются в консоль браузера с trace ID</li>
            <li>
              ✓ Страница не крашится полностью (белый экран не появляется)
            </li>
          </ul>

          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              backgroundColor: "#3f3f46",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                color: "#fbbf24",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              Открой консоль разработчика:
            </p>
            <p style={{ color: "#a1a1aa" }}>
              Ты увидишь структурированные логи ошибок с trace ID, stack trace,
              и контекстом компонента.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              color: "#a1a1aa",
              textDecoration: "none",
              border: "1px solid #52525b",
              borderRadius: "4px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "white";
              e.currentTarget.style.borderColor = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#a1a1aa";
              e.currentTarget.style.borderColor = "#52525b";
            }}
          >
            ← На главную
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestErrorBoundary;
