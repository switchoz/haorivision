/**
 * HAORI VISION — Error Boundary Component
 *
 * Universal error boundary for catching React component errors.
 * Logs errors and displays fallback UI.
 *
 * Usage:
 *   import ErrorBoundary from '@/lib/ErrorBoundary';
 *
 *   <ErrorBoundary fallback={<FallbackUI />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { logger } from "./logger";

// ============================================================
// Types
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

// ============================================================
// Error Boundary Component
// ============================================================

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, name } = this.props;

    // Update state with error info
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log error
    logger.error("ErrorBoundary caught an error", {
      boundaryName: name || "Unknown",
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error("Error in custom error handler", { handlerError });
      }
    }

    // Log to external service (Sentry, etc.) if configured
    if (process.env.REACT_APP_ERROR_REPORTING === "1") {
      this.reportToExternalService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    logger.info("ErrorBoundary reset", { boundaryName: this.props.name });
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  reportToExternalService(error: Error, errorInfo: ErrorInfo): void {
    // Placeholder for external error reporting service
    // e.g., Sentry, Rollbar, etc.

    const errorPayload = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      boundaryName: this.props.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logger.debug("Error reported to external service", { errorPayload });

    // Example: Send to external API
    // fetch('/api/errors/report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorPayload),
    // }).catch(err => logger.error('Failed to report error', { err }));
  }

  render(): ReactNode {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        // If fallback is a function, call it with error details
        if (typeof fallback === "function") {
          return (
            fallback as (
              error: Error | null,
              errorInfo: ErrorInfo | null,
              reset: () => void,
            ) => ReactNode
          )(error, errorInfo, this.resetErrorBoundary);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultFallback
          error={error}
          errorInfo={errorInfo}
          errorCount={errorCount}
          onReset={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

// ============================================================
// Default Fallback Component
// ============================================================

interface DefaultFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  onReset: () => void;
}

function DefaultFallback({
  error,
  errorInfo,
  errorCount,
  onReset,
}: DefaultFallbackProps): JSX.Element {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        margin: "2rem auto",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 1rem 0", color: "#d32f2f" }}>
        Что-то пошло не так
      </h2>

      <p style={{ margin: "0 0 1rem 0", color: "#666" }}>
        Произошла ошибка при отображении этой части страницы.
      </p>

      <button
        onClick={onReset}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
          marginRight: "1rem",
        }}
      >
        Попробовать снова
      </button>

      <a
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#fff",
          color: "#000",
          border: "1px solid #000",
          borderRadius: "4px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        На главную
      </a>

      {isDevelopment && error && (
        <details style={{ marginTop: "2rem" }}>
          <summary
            style={{ cursor: "pointer", color: "#666", fontWeight: "bold" }}
          >
            Детали ошибки (только в режиме разработки)
          </summary>
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontFamily: "monospace",
              overflow: "auto",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <strong>Error:</strong> {error.message}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Count:</strong> {errorCount}
            </div>
            {error.stack && (
              <div style={{ marginBottom: "1rem" }}>
                <strong>Stack:</strong>
                <pre
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {error.stack}
                </pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component Stack:</strong>
                <pre
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

// ============================================================
// Exports
// ============================================================

export default ErrorBoundary;
export { ErrorBoundary };
export type { ErrorBoundaryProps, ErrorBoundaryState };
