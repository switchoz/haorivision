import { useState, useEffect, useCallback } from "react";

/**
 * 🎭 SHOW CONTROLLER
 *
 * Управление 3 режимами галереи:
 * - GALLERY: интерактивный free-roam
 * - SHOW: сценарное шоу по таймлайну
 * - KIOSK: автоматический цикл
 */

export const SHOW_MODES = {
  GALLERY: "GALLERY",
  SHOW: "SHOW",
  KIOSK: "KIOSK",
};

export default function ShowController({
  children,
  initialMode = SHOW_MODES.GALLERY,
}) {
  const [mode, setMode] = useState(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [kioskIndex, setKioskIndex] = useState(0);
  const [showTimeline, setShowTimeline] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);

  // Блокировка клавиш в KIOSK режиме
  useEffect(() => {
    if (mode === SHOW_MODES.KIOSK) {
      const preventKeys = (e) => {
        // Блокируем ESC, F11, Alt+Tab, Ctrl+W и т.д.
        if (
          e.key === "Escape" ||
          e.key === "F11" ||
          (e.altKey && e.key === "Tab") ||
          (e.ctrlKey && e.key === "w")
        ) {
          e.preventDefault();
        }
      };

      const preventContext = (e) => {
        e.preventDefault();
      };

      document.addEventListener("keydown", preventKeys);
      document.addEventListener("contextmenu", preventContext);

      return () => {
        document.removeEventListener("keydown", preventKeys);
        document.removeEventListener("contextmenu", preventContext);
      };
    }
  }, [mode]);

  // Авто-цикл для KIOSK режима
  useEffect(() => {
    if (mode === SHOW_MODES.KIOSK) {
      const kioskInterval = setInterval(() => {
        setKioskIndex((prev) => prev + 1);
      }, 10000); // 10 секунд на каждый концепт

      return () => clearInterval(kioskInterval);
    }
  }, [mode]);

  // Смена режима с transition
  const changeMode = useCallback((newMode) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);

      // Сброс состояний
      if (newMode === SHOW_MODES.KIOSK) {
        setKioskIndex(0);
      } else if (newMode === SHOW_MODES.SHOW) {
        setCurrentScene(0);
      }
    }, 500);
  }, []);

  // Запуск SHOW таймлайна
  const startShow = useCallback(
    (timeline) => {
      setShowTimeline(timeline);
      setCurrentScene(0);
      changeMode(SHOW_MODES.SHOW);
    },
    [changeMode],
  );

  // Следующая сцена в SHOW
  const nextScene = useCallback(() => {
    if (showTimeline && currentScene < showTimeline.scenes.length - 1) {
      setCurrentScene(currentScene + 1);
    }
  }, [showTimeline, currentScene]);

  // Предыдущая сцена в SHOW
  const prevScene = useCallback(() => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1);
    }
  }, [currentScene]);

  // Получение настроек для текущего режима
  const getModeSettings = () => {
    switch (mode) {
      case SHOW_MODES.GALLERY:
        return {
          enableControls: true,
          enableInteraction: true,
          autoRotate: false,
          kioskIndex: null,
          showScene: null,
          showHUD: true,
        };

      case SHOW_MODES.SHOW:
        return {
          enableControls: false,
          enableInteraction: false,
          autoRotate: false,
          kioskIndex: null,
          showScene: showTimeline?.scenes[currentScene] || null,
          showHUD: true,
        };

      case SHOW_MODES.KIOSK:
        return {
          enableControls: false,
          enableInteraction: false,
          autoRotate: true,
          kioskIndex: kioskIndex,
          showScene: null,
          showHUD: false,
        };

      default:
        return {};
    }
  };

  const modeSettings = getModeSettings();

  return (
    <div className="relative w-full h-full">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FF10F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Switching to {mode} mode...</p>
          </div>
        </div>
      )}

      {/* Mode Switch Panel */}
      {modeSettings.showHUD && mode === SHOW_MODES.GALLERY && (
        <div className="fixed top-8 right-8 z-10 glass-luxury rounded-2xl p-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => changeMode(SHOW_MODES.GALLERY)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === SHOW_MODES.GALLERY
                  ? "bg-[#FF10F0] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              GALLERY
            </button>
            <button
              onClick={() => changeMode(SHOW_MODES.SHOW)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === SHOW_MODES.SHOW
                  ? "bg-[#00D4FF] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              SHOW
            </button>
            <button
              onClick={() => changeMode(SHOW_MODES.KIOSK)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === SHOW_MODES.KIOSK
                  ? "bg-[#39FF14] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              KIOSK
            </button>
          </div>

          {/* Mode Info */}
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
            {mode === SHOW_MODES.GALLERY && <p>Interactive free-roam mode</p>}
            {mode === SHOW_MODES.SHOW && <p>Timeline-based show mode</p>}
            {mode === SHOW_MODES.KIOSK && <p>Auto-cycle kiosk mode</p>}
          </div>
        </div>
      )}

      {/* Show Controls */}
      {mode === SHOW_MODES.SHOW && modeSettings.showHUD && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 glass-luxury rounded-full px-6 py-4 flex items-center gap-4">
          <button
            onClick={prevScene}
            disabled={currentScene === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-all"
          >
            ← Prev
          </button>

          <div className="text-white font-semibold">
            Scene {currentScene + 1} / {showTimeline?.scenes.length || 0}
          </div>

          <button
            onClick={nextScene}
            disabled={
              !showTimeline || currentScene >= showTimeline.scenes.length - 1
            }
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-all"
          >
            Next →
          </button>

          <button
            onClick={() => changeMode(SHOW_MODES.GALLERY)}
            className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
          >
            Exit Show
          </button>
        </div>
      )}

      {/* Kiosk Mode Indicator */}
      {mode === SHOW_MODES.KIOSK && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-10 px-6 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full">
          <p className="text-[#39FF14] text-sm font-semibold">
            KIOSK MODE ACTIVE
          </p>
        </div>
      )}

      {/* Children with mode settings */}
      {typeof children === "function"
        ? children({ mode, modeSettings, startShow })
        : children}
    </div>
  );
}
