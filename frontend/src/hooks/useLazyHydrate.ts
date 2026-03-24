/**
 * HAORI VISION — Lazy Hydration Hook (P24)
 *
 * Отложенная загрузка тяжёлых компонентов (видео, 3D, галереи)
 * только когда они появляются во вьюпорте.
 *
 * Features:
 * - IntersectionObserver для определения видимости
 * - Debounce для оптимизации
 * - Настраиваемый threshold
 * - TypeScript поддержка
 *
 * Usage:
 *   const { isVisible, ref } = useLazyHydrate({ threshold: 0.1, debounce: 300 });
 *
 *   return (
 *     <div ref={ref}>
 *       {isVisible ? <HeavyComponent /> : <Placeholder />}
 *     </div>
 *   );
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ============================================================
// Types
// ============================================================

export interface UseLazyHydrateOptions {
  /**
   * Порог видимости (0.0 - 1.0)
   * 0.1 = компонент загружается когда 10% видимо
   */
  threshold?: number;

  /**
   * Задержка перед загрузкой (ms)
   * Помогает избежать загрузки при быстром скролле
   */
  debounce?: number;

  /**
   * Root margin для IntersectionObserver
   * Позволяет загружать компоненты чуть раньше (до попадания в viewport)
   * Например: '200px' загрузит за 200px до появления
   */
  rootMargin?: string;

  /**
   * Одноразовая загрузка
   * Если true, компонент не выгружается после загрузки
   */
  once?: boolean;

  /**
   * Callback при появлении во вьюпорте
   */
  onVisible?: () => void;

  /**
   * Callback при скрытии из вьюпорта
   */
  onHidden?: () => void;
}

export interface UseLazyHydrateReturn {
  /**
   * Видим ли элемент во вьюпорте
   */
  isVisible: boolean;

  /**
   * Ref для прикрепления к элементу
   */
  ref: React.RefObject<HTMLDivElement>;

  /**
   * Был ли элемент когда-либо видим
   */
  wasVisible: boolean;
}

// ============================================================
// Hook
// ============================================================

export function useLazyHydrate(
  options: UseLazyHydrateOptions = {},
): UseLazyHydrateReturn {
  const {
    threshold = 0.1,
    debounce = 200,
    rootMargin = "50px",
    once = true,
    onVisible,
    onHidden,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounced visibility change handler
  const handleVisibilityChange = useCallback(
    (visible: boolean) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        if (visible) {
          setIsVisible(true);
          setWasVisible(true);
          onVisible?.();
        } else {
          if (!once) {
            setIsVisible(false);
            onHidden?.();
          }
        }
      }, debounce);
    },
    [debounce, once, onVisible, onHidden],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: always visible if not supported
      console.warn(
        "[useLazyHydrate] IntersectionObserver not supported, loading immediately",
      );
      setIsVisible(true);
      setWasVisible(true);
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handleVisibilityChange(entry.isIntersecting);
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, handleVisibilityChange]);

  return {
    isVisible,
    ref,
    wasVisible,
  };
}

// ============================================================
// Utility: Lazy Import Helper
// ============================================================

/**
 * Helper для динамического импорта компонентов
 *
 * Usage:
 *   const HeavyComponent = lazyImport(() => import('./HeavyComponent'));
 */
export function lazyImport<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

// ============================================================
// Exports
// ============================================================

export default useLazyHydrate;
