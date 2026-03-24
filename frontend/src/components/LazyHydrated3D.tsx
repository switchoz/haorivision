/**
 * HAORI VISION — Lazy Hydrated 3D Component (P24)
 *
 * Обёртка для тяжёлых 3D/WebGL компонентов (Canvas, Three.js, Tone.js)
 * с отложенной загрузкой. Компонент загружается только когда попадает во вьюпорт.
 *
 * Features:
 * - Lazy loading для Canvas/WebGL
 * - Динамический импорт тяжёлых библиотек
 * - Placeholder с индикатором загрузки
 * - Автоматическое управление анимациями
 * - TypeScript типизация
 *
 * Usage:
 *   const Scene3D = lazy(() => import('./Scene3D'));
 *
 *   <LazyHydrated3D>
 *     <Scene3D />
 *   </LazyHydrated3D>
 */

import React, { Suspense, useState } from "react";
import { useLazyHydrate } from "../hooks/useLazyHydrate";

// ============================================================
// Types
// ============================================================

export interface LazyHydrated3DProps {
  /**
   * Дочерний компонент (обычно Canvas/Three.js scene)
   */
  children: React.ReactNode;

  /**
   * Threshold для IntersectionObserver (0.0 - 1.0)
   * @default 0.2
   */
  threshold?: number;

  /**
   * Debounce задержка (ms)
   * @default 300
   */
  debounce?: number;

  /**
   * Root margin (загрузка раньше попадания во viewport)
   * @default '100px'
   */
  rootMargin?: string;

  /**
   * Ширина контейнера
   * @default '100%'
   */
  width?: string | number;

  /**
   * Высота контейнера
   * @default '100vh'
   */
  height?: string | number;

  /**
   * Показывать индикатор загрузки
   * @default true
   */
  showLoader?: boolean;

  /**
   * Кастомный loader
   */
  loader?: React.ReactNode;

  /**
   * Кастомный fallback для Suspense
   */
  fallback?: React.ReactNode;

  /**
   * Callback когда 3D сцена загрузилась
   */
  onLazyLoad?: () => void;

  /**
   * CSS классы для контейнера
   */
  className?: string;

  /**
   * Inline стили для контейнера
   */
  style?: React.CSSProperties;
}

// ============================================================
// Default Loader Component
// ============================================================

const DefaultLoader: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000",
      color: "#fff",
      gap: "20px",
    }}
  >
    {/* Animated 3D Cube Loader */}
    <div
      style={{
        width: "60px",
        height: "60px",
        perspective: "1000px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          animation: "rotate3d 2s infinite linear",
        }}
      >
        {/* Cube Faces */}
        {[
          { transform: "rotateY(0deg) translateZ(30px)", bg: "#7c3aed" },
          { transform: "rotateY(90deg) translateZ(30px)", bg: "#a855f7" },
          { transform: "rotateY(180deg) translateZ(30px)", bg: "#c084fc" },
          { transform: "rotateY(-90deg) translateZ(30px)", bg: "#e9d5ff" },
          { transform: "rotateX(90deg) translateZ(30px)", bg: "#7c3aed" },
          { transform: "rotateX(-90deg) translateZ(30px)", bg: "#a855f7" },
        ].map((face, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "60px",
              height: "60px",
              backgroundColor: face.bg,
              opacity: 0.8,
              border: "1px solid #fff",
              transform: face.transform,
            }}
          />
        ))}
      </div>
    </div>

    <div style={{ fontSize: "14px", opacity: 0.7 }}>Загрузка 3D...</div>

    {/* Keyframes for animation */}
    <style>
      {`
        @keyframes rotate3d {
          from {
            transform: rotateX(0deg) rotateY(0deg);
          }
          to {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }
      `}
    </style>
  </div>
);

// ============================================================
// Component
// ============================================================

export const LazyHydrated3D: React.FC<LazyHydrated3DProps> = ({
  children,
  threshold = 0.2,
  debounce = 300,
  rootMargin = "100px",
  width = "100%",
  height = "100vh",
  showLoader = true,
  loader,
  fallback,
  onLazyLoad,
  className = "",
  style = {},
}) => {
  const { isVisible, ref } = useLazyHydrate({
    threshold,
    debounce,
    rootMargin,
    once: true, // Load once and keep loaded
    onVisible: onLazyLoad,
  });

  const [is3DLoaded, setIs3DLoaded] = useState(false);

  // Default fallback for Suspense
  const defaultFallback = fallback || (showLoader ? <DefaultLoader /> : null);

  return (
    <div
      ref={ref}
      className={`lazy-hydrated-3d ${className}`}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        ...style,
      }}
    >
      {!isVisible && (
        // Placeholder before 3D loads
        <div
          className="lazy-3d-placeholder"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loader || (showLoader && <DefaultLoader />)}
        </div>
      )}

      {isVisible && (
        // Suspense for dynamic imports
        <Suspense fallback={defaultFallback}>
          <div
            className="lazy-3d-content"
            style={{
              width: "100%",
              height: "100%",
              opacity: is3DLoaded ? 1 : 0,
              transition: "opacity 0.8s ease-in-out",
            }}
            onLoad={() => setIs3DLoaded(true)}
          >
            {children}
          </div>
        </Suspense>
      )}
    </div>
  );
};

// ============================================================
// Utility: Lazy 3D Wrapper
// ============================================================

/**
 * Higher-Order Component для автоматической обёртки 3D компонентов
 *
 * Usage:
 *   const MyScene = () => <Canvas>...</Canvas>;
 *   const LazyScene = withLazy3D(MyScene);
 *
 *   // В рендере:
 *   <LazyScene />
 */
export function withLazy3D<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LazyHydrated3DProps, "children">,
) {
  return (props: P) => (
    <LazyHydrated3D {...options}>
      <Component {...props} />
    </LazyHydrated3D>
  );
}

// ============================================================
// Exports
// ============================================================

export default LazyHydrated3D;
