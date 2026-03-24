/**
 * HAORI VISION — Microcopy A/B Testing HOC (P26)
 *
 * Higher-Order Component для A/B тестирования эмоциональных текстов
 * на входе карточки продукта.
 *
 * Features:
 * - 50/50 split между вариантами A и B
 * - Показывает текст первые 2 секунды
 * - Логирует view/click/interaction события
 * - Сохраняет вариант в sessionStorage
 * - Отправляет статистику на сервер
 *
 * Usage:
 *   import { withMicrocopy } from '@/ab/withMicrocopy';
 *
 *   const ProductHero = withMicrocopy(BaseProductHero);
 *   const ProductCard = withMicrocopy(BaseProductCard, {
 *     experimentId: 'microcopy_v1',
 *     displayDuration: 2500
 *   });
 */

import React, { useState, useEffect, useRef, ComponentType } from "react";

// ============================================================
// Types
// ============================================================

export interface MicrocopyVariant {
  id: string;
  name: string;
  text: string;
  weight: number;
  description?: string;
}

export interface MicrocopyExperiment {
  experiment_id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed";
  variants: Record<string, MicrocopyVariant>;
  settings: {
    display_duration: number;
    fade_in_duration: number;
    fade_out_duration: number;
    assignment_method: "client-side" | "server-side";
    persistence: "session" | "local" | "none";
    tracking_events: string[];
  };
  targets: {
    pages: string[];
    components: string[];
  };
  goals: {
    primary: {
      metric: string;
      target: number;
      description: string;
    };
    secondary: Array<{
      metric: string;
      target: number;
      description: string;
    }>;
  };
}

export interface WithMicrocopyOptions {
  experimentId?: string;
  displayDuration?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  trackingEndpoint?: string;
  onVariantAssigned?: (variant: string) => void;
  onView?: (variant: string) => void;
  onClick?: (variant: string) => void;
  onInteraction?: (variant: string) => void;
}

export interface MicrocopyEvent {
  timestamp: string;
  experiment_id: string;
  variant: string;
  event_type: "view" | "click" | "interaction" | "scroll";
  user_id?: string;
  session_id: string;
  time_to_event?: number;
  metadata?: Record<string, any>;
}

// ============================================================
// Configuration
// ============================================================

const DEFAULT_EXPERIMENT_ID = "microcopy_v1";
const DEFAULT_TRACKING_ENDPOINT = "/api/ab/microcopy";
const SESSION_STORAGE_KEY = "haori_ab_microcopy_variant";

// ============================================================
// Experiment Data
// ============================================================

// Загружаем конфигурацию эксперимента
let experimentConfig: MicrocopyExperiment | null = null;

async function loadExperimentConfig(
  experimentId: string,
): Promise<MicrocopyExperiment | null> {
  if (experimentConfig && experimentConfig.experiment_id === experimentId) {
    return experimentConfig;
  }

  try {
    // В production загружаем из API или статического файла
    const response = await fetch(`/data/experiments/${experimentId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load experiment config: ${response.status}`);
    }
    experimentConfig = await response.json();
    return experimentConfig;
  } catch (error) {
    console.error("[withMicrocopy] Failed to load experiment config:", error);
    // Fallback config
    return {
      experiment_id: experimentId,
      name: "Microcopy A/B Test",
      description: "Default fallback config",
      status: "active",
      variants: {
        A: {
          id: "A",
          name: "Вариант A",
          text: "Носи свет. Стань искусством.",
          weight: 50,
        },
        B: {
          id: "B",
          name: "Вариант B",
          text: "Хаори ручной росписи. Светится в UV.",
          weight: 50,
        },
      },
      settings: {
        display_duration: 2000,
        fade_in_duration: 500,
        fade_out_duration: 300,
        assignment_method: "client-side",
        persistence: "session",
        tracking_events: ["view", "click", "interaction"],
      },
      targets: {
        pages: ["/product/*", "/catalog"],
        components: ["ProductHero", "ProductCard"],
      },
      goals: {
        primary: {
          metric: "ctr",
          target: 0.15,
          description: "Click-through rate",
        },
        secondary: [
          {
            metric: "time_to_interaction",
            target: 5000,
            description: "Time to first interaction",
          },
        ],
      },
    };
  }
}

// ============================================================
// Variant Assignment
// ============================================================

/**
 * Генерирует session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("haori_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("haori_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Назначает вариант пользователю (50/50 split)
 */
function assignVariant(experimentId: string): string {
  // Проверяем, есть ли сохраненный вариант
  const storageKey = `${SESSION_STORAGE_KEY}_${experimentId}`;
  const savedVariant = sessionStorage.getItem(storageKey);

  if (savedVariant) {
    return savedVariant;
  }

  // Генерируем новый вариант (50/50)
  const variant = Math.random() < 0.5 ? "A" : "B";

  // Сохраняем в sessionStorage
  sessionStorage.setItem(storageKey, variant);

  return variant;
}

// ============================================================
// Tracking
// ============================================================

/**
 * Отправляет событие на сервер
 */
async function trackEvent(
  event: MicrocopyEvent,
  endpoint: string = DEFAULT_TRACKING_ENDPOINT,
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("[withMicrocopy] Failed to track event:", error);
  }
}

// ============================================================
// HOC Component
// ============================================================

/**
 * Компонент-overlay с микрокопией
 */
interface MicrocopyOverlayProps {
  variant: string;
  text: string;
  duration: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  onComplete: () => void;
}

const MicrocopyOverlay: React.FC<MicrocopyOverlayProps> = ({
  variant,
  text,
  duration,
  fadeInDuration,
  fadeOutDuration,
  onComplete,
}) => {
  const [opacity, setOpacity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // Start fade out
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, duration - fadeOutDuration);

    // Hide overlay
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, fadeInDuration, fadeOutDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="microcopy-overlay"
      data-variant={variant}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)",
        color: "#fff",
        fontSize: "24px",
        fontWeight: 700,
        textAlign: "center",
        padding: "40px",
        zIndex: 1000,
        opacity,
        transition: `opacity ${fadeInDuration}ms ease-in-out`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/**
 * Higher-Order Component для A/B тестирования микрокопии
 */
export function withMicrocopy<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithMicrocopyOptions = {},
): ComponentType<P> {
  const {
    experimentId = DEFAULT_EXPERIMENT_ID,
    displayDuration,
    fadeInDuration,
    fadeOutDuration,
    trackingEndpoint = DEFAULT_TRACKING_ENDPOINT,
    onVariantAssigned,
    onView,
    onClick,
    onInteraction,
  } = options;

  return function WithMicrocopyWrapper(props: P) {
    const [showOverlay, setShowOverlay] = useState(true);
    const [variant, setVariant] = useState<string | null>(null);
    const [variantText, setVariantText] = useState<string>("");
    const [config, setConfig] = useState<MicrocopyExperiment | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(Date.now());
    const hasTrackedView = useRef(false);

    // Загружаем конфигурацию и назначаем вариант
    useEffect(() => {
      async function init() {
        const loadedConfig = await loadExperimentConfig(experimentId);
        if (!loadedConfig) return;

        setConfig(loadedConfig);

        // Назначаем вариант
        const assignedVariant = assignVariant(experimentId);
        setVariant(assignedVariant);

        // Получаем текст варианта
        const variantData = loadedConfig.variants[assignedVariant];
        if (variantData) {
          setVariantText(variantData.text);
        }

        // Callback
        onVariantAssigned?.(assignedVariant);
      }

      init();
    }, [experimentId, onVariantAssigned]);

    // Трекинг view события
    useEffect(() => {
      if (!variant || !config || hasTrackedView.current) return;

      hasTrackedView.current = true;

      const event: MicrocopyEvent = {
        timestamp: new Date().toISOString(),
        experiment_id: experimentId,
        variant,
        event_type: "view",
        session_id: getSessionId(),
        time_to_event: 0,
      };

      trackEvent(event, trackingEndpoint);
      onView?.(variant);
    }, [variant, config, experimentId, trackingEndpoint, onView]);

    // Обработка клика
    const handleClick = () => {
      if (!variant || !config) return;

      const timeToClick = Date.now() - startTimeRef.current;

      const event: MicrocopyEvent = {
        timestamp: new Date().toISOString(),
        experiment_id: experimentId,
        variant,
        event_type: "click",
        session_id: getSessionId(),
        time_to_event: timeToClick,
      };

      trackEvent(event, trackingEndpoint);
      onClick?.(variant);
    };

    // Обработка взаимодействия (scroll, mousemove)
    const handleInteraction = () => {
      if (!variant || !config) return;

      const timeToInteraction = Date.now() - startTimeRef.current;

      const event: MicrocopyEvent = {
        timestamp: new Date().toISOString(),
        experiment_id: experimentId,
        variant,
        event_type: "interaction",
        session_id: getSessionId(),
        time_to_event: timeToInteraction,
      };

      trackEvent(event, trackingEndpoint);
      onInteraction?.(variant);
    };

    // Overlay завершен
    const handleOverlayComplete = () => {
      setShowOverlay(false);
    };

    if (!variant || !config) {
      // Загрузка или ошибка — показываем обычный компонент
      return <WrappedComponent {...props} />;
    }

    const duration = displayDuration || config.settings.display_duration;
    const fadeIn = fadeInDuration || config.settings.fade_in_duration;
    const fadeOut = fadeOutDuration || config.settings.fade_out_duration;

    return (
      <div
        ref={containerRef}
        className="microcopy-wrapper"
        onClick={handleClick}
        onMouseMove={handleInteraction}
        onScroll={handleInteraction}
        style={{ position: "relative" }}
      >
        {showOverlay && (
          <MicrocopyOverlay
            variant={variant}
            text={variantText}
            duration={duration}
            fadeInDuration={fadeIn}
            fadeOutDuration={fadeOut}
            onComplete={handleOverlayComplete}
          />
        )}
        <WrappedComponent {...props} />
      </div>
    );
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Получает текущий вариант для пользователя
 */
export function getCurrentVariant(
  experimentId: string = DEFAULT_EXPERIMENT_ID,
): string | null {
  const storageKey = `${SESSION_STORAGE_KEY}_${experimentId}`;
  return sessionStorage.getItem(storageKey);
}

/**
 * Сбрасывает назначенный вариант (для тестирования)
 */
export function resetVariant(
  experimentId: string = DEFAULT_EXPERIMENT_ID,
): void {
  const storageKey = `${SESSION_STORAGE_KEY}_${experimentId}`;
  sessionStorage.removeItem(storageKey);
}

// ============================================================
// Exports
// ============================================================

export default withMicrocopy;
export type {
  MicrocopyVariant,
  MicrocopyExperiment,
  WithMicrocopyOptions,
  MicrocopyEvent,
};
