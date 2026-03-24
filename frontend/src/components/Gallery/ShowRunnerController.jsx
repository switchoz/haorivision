import { useState, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import ShowRunner from "../../show/ShowRunner";
import CameraPathController from "../../show/CameraPathController";
import * as THREE from "three";

/**
 * 🎬 SHOW RUNNER CONTROLLER
 *
 * React компонент для интеграции ShowRunner с Three.js
 * Управление камерой, светом, эффектами из timeline
 */

export function useShowRunner(timelineUrl) {
  const [runner] = useState(() => new ShowRunner(30));
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        await runner.loadTimeline(timelineUrl);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load timeline:", error);
      }
    };

    loadTimeline();

    // Подписки на события
    const unsubStart = runner.on("show:start", () => setIsPlaying(true));
    const unsubPause = runner.on("show:pause", () => setIsPlaying(false));
    const unsubEnd = runner.on("show:end", () => setIsPlaying(false));

    const unsubSceneStart = runner.on("scene:start", (event) => {
      setCurrentScene(event.data);
    });

    return () => {
      unsubStart();
      unsubPause();
      unsubEnd();
      unsubSceneStart();
      runner.dispose();
    };
  }, [timelineUrl, runner]);

  // Обновление состояния каждый кадр
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const state = runner.getState();
      setCurrentTime(state.currentTime);
      setProgress(state.progress);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoaded, runner]);

  return {
    runner,
    isLoaded,
    isPlaying,
    currentScene,
    currentTime,
    progress,
    start: () => runner.start(),
    pause: () => runner.pause(),
    resume: () => runner.resume(),
    stop: () => runner.stop(),
    seek: (time) => runner.seek(time),
  };
}

// Компонент для синхронизации камеры
export function ShowCamera({ runner }) {
  const cameraRef = useRef();
  const cameraControllerRef = useRef(new CameraPathController());
  const { camera } = useThree();

  useEffect(() => {
    const unsubSceneStart = runner.on("scene:start", (event) => {
      const scene = event.data;
      if (scene.camera && scene.camera.path) {
        cameraControllerRef.current.setKeyframes(scene.camera.path);
      }
    });

    return () => unsubSceneStart();
  }, [runner]);

  useFrame(() => {
    const state = runner.getState();
    if (!state.isPlaying || !state.currentScene) return;

    const cameraState = cameraControllerRef.current.getCameraStateAtTime(
      state.currentTime,
    );

    if (cameraState) {
      // Плавное обновление позиции камеры
      camera.position.lerp(cameraState.position, 0.1);

      // Плавный lookAt
      const lookAtTarget = new THREE.Vector3();
      lookAtTarget.lerp(cameraState.target, 0.1);
      camera.lookAt(lookAtTarget);

      // FOV
      if (camera.fov !== undefined) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, cameraState.fov, 0.1);
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}

// Компонент для отображения текстовых оверлеев
export function ShowTextOverlays({ runner }) {
  const [activeOverlays, setActiveOverlays] = useState([]);

  useEffect(() => {
    const unsubTextCue = runner.on("cue:text", (event) => {
      const overlay = event.data;

      setActiveOverlays((prev) => [...prev, overlay]);

      // Удалить после duration
      setTimeout(() => {
        setActiveOverlays((prev) => prev.filter((o) => o !== overlay));
      }, overlay.duration * 1000);
    });

    return () => unsubTextCue();
  }, [runner]);

  if (activeOverlays.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {activeOverlays.map((overlay, index) => (
        <div
          key={`${overlay.time}_${index}`}
          className={`absolute w-full flex items-center justify-center ${getPositionClass(overlay.position)}`}
          style={{
            animation: `${overlay.style.animation} ${overlay.duration}s ease-in-out`,
          }}
        >
          <div
            style={{
              fontSize: overlay.style.fontSize,
              color: overlay.style.color,
              opacity: overlay.style.opacity,
              textShadow: overlay.style.textShadow,
              letterSpacing: overlay.style.letterSpacing,
              fontStyle: overlay.style.fontStyle,
              fontFamily: overlay.style.fontFamily,
            }}
            className="font-bold text-center px-8"
          >
            {overlay.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function getPositionClass(position) {
  switch (position) {
    case "top":
      return "top-16";
    case "center":
      return "top-1/2 -translate-y-1/2";
    case "bottom":
      return "bottom-16";
    case "left":
      return "left-16 top-1/2 -translate-y-1/2";
    case "right":
      return "right-16 top-1/2 -translate-y-1/2";
    default:
      return "top-1/2 -translate-y-1/2";
  }
}

// HUD контрольной панели
export default function ShowRunnerController({
  runner,
  isLoaded,
  isPlaying,
  currentTime,
  progress,
  currentScene,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isLoaded) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 glass-luxury rounded-full px-6 py-3">
        <p className="text-white">Loading Timeline...</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 glass-luxury rounded-2xl px-8 py-4 min-w-[500px]">
      {/* Timeline Info */}
      <div className="text-center mb-4">
        <h3 className="text-white font-bold text-lg mb-1">
          {currentScene?.name || "Show Runner"}
        </h3>
        <p className="text-gray-400 text-sm">
          {formatTime(currentTime)} /{" "}
          {formatTime(runner.getTimeline()?.metadata.duration || 0)}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF10F0] to-[#00D4FF] transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => runner.seek(0)}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
          title="Reset"
        >
          ⏮
        </button>

        <button
          onClick={() => runner.seek(Math.max(0, currentTime - 10))}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
          title="-10s"
        >
          ⏪
        </button>

        {!isPlaying ? (
          <button
            onClick={() => runner.start()}
            className="px-6 py-3 rounded-lg bg-[#FF10F0]/20 hover:bg-[#FF10F0]/30 text-[#FF10F0] font-bold transition-all"
          >
            ▶ Play
          </button>
        ) : (
          <button
            onClick={() => runner.pause()}
            className="px-6 py-3 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold transition-all"
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={() =>
            runner.seek(
              Math.min(
                runner.getTimeline()?.metadata.duration || 0,
                currentTime + 10,
              ),
            )
          }
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
          title="+10s"
        >
          ⏩
        </button>

        <button
          onClick={() => runner.stop()}
          className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
          title="Stop"
        >
          ⏹
        </button>
      </div>

      {/* Scene Markers */}
      <div className="mt-4 flex justify-between text-xs text-gray-400">
        {runner.getTimeline()?.scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => runner.seek(scene.startTime)}
            className="hover:text-white transition-colors truncate max-w-[80px]"
            title={scene.name}
          >
            {index + 1}. {scene.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export { ShowRunnerController };
