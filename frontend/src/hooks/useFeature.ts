/**
 * HAORI VISION — useFeature React Hook (P27)
 *
 * React hook для проверки feature flags.
 *
 * Features:
 * - Автоматическое обновление при изменении конфигурации
 * - TypeScript типизация
 * - SSR compatible
 * - Suspense support
 *
 * Usage:
 *   import { useFeature } from '@/hooks/useFeature';
 *
 *   function MyComponent() {
 *     const isLazyHydrationEnabled = useFeature('LAZY_HYDRATION');
 *
 *     if (isLazyHydrationEnabled) {
 *       return <LazyHydratedVideo ... />;
 *     }
 *
 *     return <video ... />;
 *   }
 */

import { useState, useEffect } from "react";
import {
  isFeatureEnabled,
  isFeatureEnabledSync,
  type FeatureName,
} from "../lib/features";

// ============================================================
// Hook
// ============================================================

/**
 * React hook для проверки feature flag
 *
 * @param featureName Название feature
 * @param defaultValue Значение по умолчанию (пока конфиг загружается)
 * @returns true если feature включен, false если выключен
 */
export function useFeature(
  featureName: FeatureName | string,
  defaultValue: boolean = false,
): boolean {
  // Инициализируем с sync версией (из кэша) или defaultValue
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return isFeatureEnabledSync(featureName);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    let isMounted = true;

    // Асинхронно загружаем актуальное значение
    isFeatureEnabled(featureName).then((result) => {
      if (isMounted) {
        setEnabled(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [featureName]);

  return enabled;
}

/**
 * React hook для проверки multiple features
 *
 * @param featureNames Массив названий features
 * @returns Объект с результатами для каждого feature
 *
 * @example
 * const { LAZY_HYDRATION, EDGE_CACHE } = useFeatures(['LAZY_HYDRATION', 'EDGE_CACHE']);
 */
export function useFeatures(
  featureNames: (FeatureName | string)[],
): Record<string, boolean> {
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const name of featureNames) {
      try {
        initial[name] = isFeatureEnabledSync(name);
      } catch {
        initial[name] = false;
      }
    }
    return initial;
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      featureNames.map(async (name) => ({
        name,
        enabled: await isFeatureEnabled(name),
      })),
    ).then((results) => {
      if (isMounted) {
        const newFeatures: Record<string, boolean> = {};
        for (const { name, enabled } of results) {
          newFeatures[name] = enabled;
        }
        setFeatures(newFeatures);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [featureNames.join(",")]); // Зависимость от строкового представления массива

  return features;
}

/**
 * React hook для условного рендеринга компонента на основе feature flag
 *
 * @param featureName Название feature
 * @param Component Компонент для рендера если feature включен
 * @param Fallback Компонент для рендера если feature выключен (опционально)
 * @returns Компонент или null
 *
 * @example
 * function App() {
 *   const VideoComponent = useFeatureComponent(
 *     'LAZY_HYDRATION',
 *     LazyHydratedVideo,
 *     RegularVideo
 *   );
 *
 *   return <VideoComponent src="/video.mp4" />;
 * }
 */
export function useFeatureComponent<P extends object>(
  featureName: FeatureName | string,
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>,
): React.ComponentType<P> | null {
  const isEnabled = useFeature(featureName);

  if (isEnabled) {
    return Component;
  }

  return Fallback || null;
}

// ============================================================
// Utility Hooks
// ============================================================

/**
 * Hook для проверки что ВСЕ указанные features включены
 *
 * @param featureNames Массив названий features
 * @returns true если все features включены
 */
export function useAllFeaturesEnabled(
  featureNames: (FeatureName | string)[],
): boolean {
  const features = useFeatures(featureNames);
  return Object.values(features).every((enabled) => enabled);
}

/**
 * Hook для проверки что ХОТЯ БЫ ОДИН из указанных features включен
 *
 * @param featureNames Массив названий features
 * @returns true если хотя бы один feature включен
 */
export function useAnyFeatureEnabled(
  featureNames: (FeatureName | string)[],
): boolean {
  const features = useFeatures(featureNames);
  return Object.values(features).some((enabled) => enabled);
}

// ============================================================
// Exports
// ============================================================

export default useFeature;
