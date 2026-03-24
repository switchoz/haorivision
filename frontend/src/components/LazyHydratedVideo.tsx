/**
 * HAORI VISION — Lazy Hydrated Video Component (P24)
 *
 * Обёртка для тяжёлых video-блоков с отложенной загрузкой.
 * Видео загружается только когда попадает во вьюпорт.
 *
 * Features:
 * - Lazy loading с IntersectionObserver
 * - Poster placeholder до загрузки
 * - Автоматическое управление autoplay/muted
 * - Поддержка всех HTML video атрибутов
 * - TypeScript типизация
 *
 * Usage:
 *   <LazyHydratedVideo
 *     src="/media/hero/intro.mp4"
 *     poster="/media/hero/poster.jpg"
 *     autoplay
 *     muted
 *     loop
 *   />
 */

import React, { useState, useEffect } from "react";
import { useLazyHydrate } from "../hooks/useLazyHydrate";

// ============================================================
// Types
// ============================================================

export interface LazyHydratedVideoProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /**
   * Источник видео (обязательно)
   */
  src: string;

  /**
   * Poster (превью до загрузки)
   */
  poster?: string;

  /**
   * Threshold для IntersectionObserver (0.0 - 1.0)
   * @default 0.1
   */
  threshold?: number;

  /**
   * Debounce задержка (ms)
   * @default 200
   */
  debounce?: number;

  /**
   * Root margin (загрузка раньше попадания во viewport)
   * @default '50px'
   */
  rootMargin?: string;

  /**
   * Показывать индикатор загрузки
   * @default true
   */
  showLoader?: boolean;

  /**
   * Кастомный placeholder до загрузки
   */
  placeholder?: React.ReactNode;

  /**
   * Callback когда видео загрузилось
   */
  onLazyLoad?: () => void;

  /**
   * CSS классы для контейнера
   */
  containerClassName?: string;
}

// ============================================================
// Component
// ============================================================

export const LazyHydratedVideo: React.FC<LazyHydratedVideoProps> = ({
  src,
  poster,
  threshold = 0.1,
  debounce = 200,
  rootMargin = "50px",
  showLoader = true,
  placeholder,
  onLazyLoad,
  containerClassName = "",
  className = "",
  autoplay,
  muted = true, // Muted by default for autoplay
  loop,
  controls,
  playsInline = true, // Important for mobile
  ...videoProps
}) => {
  const { isVisible, ref } = useLazyHydrate({
    threshold,
    debounce,
    rootMargin,
    once: true, // Load once and keep loaded
    onVisible: onLazyLoad,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle video load
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle video error
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("[LazyHydratedVideo] Failed to load video:", src, e);
    setHasError(true);
  };

  // Auto-play when loaded (if autoplay is set)
  useEffect(() => {
    if (isLoaded && autoplay && ref.current) {
      const videoElement = ref.current.querySelector("video");
      if (videoElement) {
        videoElement.play().catch((err) => {
          console.warn("[LazyHydratedVideo] Autoplay failed:", err);
        });
      }
    }
  }, [isLoaded, autoplay, ref]);

  return (
    <div
      ref={ref}
      className={`lazy-hydrated-video ${containerClassName}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {!isVisible && (
        // Placeholder before video loads
        <>
          {placeholder || (
            <div
              className="lazy-video-placeholder"
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#000",
                backgroundImage: poster ? `url(${poster})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showLoader && (
                <div className="lazy-video-loader">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#fff"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      strokeWidth="3"
                      strokeDasharray="80, 200"
                      strokeLinecap="round"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 20 20"
                        to="360 20 20"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isVisible && !hasError && (
        <video
          src={src}
          poster={poster}
          className={`lazy-video ${className}`}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline={playsInline}
          onLoadedData={handleLoad}
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
          {...videoProps}
        />
      )}

      {hasError && (
        <div
          className="lazy-video-error"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          <span>⚠️ Не удалось загрузить видео</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Exports
// ============================================================

export default LazyHydratedVideo;
