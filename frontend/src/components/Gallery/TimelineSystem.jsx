import { useState, useEffect, useCallback } from "react";

/**
 * ⏱️ TIMELINE SYSTEM
 *
 * Система таймлайнов для SHOW режима
 * Управляет сценами, переходами, синхронизацией свет/аудио/видео
 */

// Пример таймлайна
const DEFAULT_TIMELINE = {
  name: "HAORI VISION — LIGHT SHOW",
  duration: 180, // секунды
  scenes: [
    {
      id: 1,
      name: "Opening",
      startTime: 0,
      duration: 30,
      camera: {
        position: [0, 2, 8],
        target: [0, 0, 0],
        fov: 50,
      },
      lighting: {
        ambient: 0.1,
        spotlights: [
          { position: [0, 10, 0], color: "#FF10F0", intensity: 0.8 },
        ],
      },
      fog: {
        color: "#000000",
        near: 10,
        far: 30,
        density: 0.05,
      },
      audio: {
        track: "opening.mp3",
        volume: 0.7,
        fadeIn: 2,
      },
      effects: {
        bloom: 1.5,
        vignette: 0.3,
      },
    },
    {
      id: 2,
      name: "Collection Showcase",
      startTime: 30,
      duration: 60,
      camera: {
        position: [5, 3, 10],
        target: [0, 0, 0],
        fov: 45,
      },
      lighting: {
        ambient: 0.2,
        spotlights: [
          { position: [10, 5, 10], color: "#00D4FF", intensity: 0.5 },
          { position: [-10, 5, -10], color: "#39FF14", intensity: 0.5 },
        ],
      },
      fog: {
        color: "#0a0a0a",
        near: 15,
        far: 40,
        density: 0.03,
      },
      audio: {
        track: "showcase.mp3",
        volume: 0.8,
        fadeIn: 1,
      },
      effects: {
        bloom: 2.0,
        vignette: 0.2,
      },
      animations: {
        cardsRotate: true,
        speed: 0.5,
      },
    },
    {
      id: 3,
      name: "Finale",
      startTime: 90,
      duration: 30,
      camera: {
        position: [0, 5, 12],
        target: [0, 0, 0],
        fov: 60,
      },
      lighting: {
        ambient: 0.3,
        spotlights: [
          { position: [0, 15, 0], color: "#FFFFFF", intensity: 1.0 },
        ],
      },
      fog: {
        color: "#1a1a1a",
        near: 20,
        far: 50,
        density: 0.02,
      },
      audio: {
        track: "finale.mp3",
        volume: 0.9,
        fadeIn: 1,
      },
      effects: {
        bloom: 3.0,
        vignette: 0.1,
      },
    },
  ],
};

export default function TimelineSystem({
  onSceneChange,
  isPlaying = false,
  timeline = DEFAULT_TIMELINE,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Проигрывание таймлайна
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 0.1; // 100ms tick

        // Обновление прогресса
        const newProgress = (newTime / timeline.duration) * 100;
        setProgress(newProgress);

        // Проверка смены сцены
        const newSceneIndex = timeline.scenes.findIndex((scene, index) => {
          const nextScene = timeline.scenes[index + 1];
          return (
            newTime >= scene.startTime &&
            (!nextScene || newTime < nextScene.startTime)
          );
        });

        if (newSceneIndex !== -1 && newSceneIndex !== currentSceneIndex) {
          setCurrentSceneIndex(newSceneIndex);
          if (onSceneChange) {
            onSceneChange(timeline.scenes[newSceneIndex]);
          }
        }

        // Зацикливание или остановка
        if (newTime >= timeline.duration) {
          return 0; // Loop
        }

        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, timeline, currentSceneIndex, onSceneChange]);

  // Переход к конкретной сцене
  const seekToScene = useCallback(
    (sceneIndex) => {
      if (sceneIndex >= 0 && sceneIndex < timeline.scenes.length) {
        const scene = timeline.scenes[sceneIndex];
        setCurrentTime(scene.startTime);
        setCurrentSceneIndex(sceneIndex);
        if (onSceneChange) {
          onSceneChange(scene);
        }
      }
    },
    [timeline, onSceneChange],
  );

  // Переход к конкретному времени
  const seekToTime = useCallback(
    (time) => {
      setCurrentTime(Math.max(0, Math.min(time, timeline.duration)));
    },
    [timeline],
  );

  const currentScene = timeline.scenes[currentSceneIndex];

  return {
    currentTime,
    currentScene,
    currentSceneIndex,
    progress,
    timeline,
    seekToScene,
    seekToTime,
    totalScenes: timeline.scenes.length,
  };
}

// Timeline Editor (для создания и редактирования таймлайнов)
export function TimelineEditor({ timeline, onSave }) {
  const [editingTimeline, setEditingTimeline] = useState(
    timeline || DEFAULT_TIMELINE,
  );

  const addScene = () => {
    const newScene = {
      id: editingTimeline.scenes.length + 1,
      name: `Scene ${editingTimeline.scenes.length + 1}`,
      startTime:
        editingTimeline.scenes[editingTimeline.scenes.length - 1]?.startTime +
          30 || 0,
      duration: 30,
      camera: { position: [0, 2, 8], target: [0, 0, 0], fov: 50 },
      lighting: { ambient: 0.2, spotlights: [] },
      fog: { color: "#000000", near: 10, far: 30, density: 0.05 },
      audio: { track: "", volume: 0.5, fadeIn: 1 },
      effects: { bloom: 1.0, vignette: 0.2 },
    };

    setEditingTimeline({
      ...editingTimeline,
      scenes: [...editingTimeline.scenes, newScene],
    });
  };

  const updateScene = (sceneIndex, updates) => {
    const updatedScenes = [...editingTimeline.scenes];
    updatedScenes[sceneIndex] = {
      ...updatedScenes[sceneIndex],
      ...updates,
    };

    setEditingTimeline({
      ...editingTimeline,
      scenes: updatedScenes,
    });
  };

  const removeScene = (sceneIndex) => {
    setEditingTimeline({
      ...editingTimeline,
      scenes: editingTimeline.scenes.filter((_, i) => i !== sceneIndex),
    });
  };

  const saveTimeline = () => {
    if (onSave) {
      onSave(editingTimeline);
    }
  };

  const exportTimeline = () => {
    const json = JSON.stringify(editingTimeline, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editingTimeline.name.replace(/\s/g, "_")}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Timeline Editor
            </h1>
            <input
              type="text"
              value={editingTimeline.name}
              onChange={(e) =>
                setEditingTimeline({ ...editingTimeline, name: e.target.value })
              }
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportTimeline}
              className="px-4 py-2 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded-lg transition-all"
            >
              Export JSON
            </button>
            <button
              onClick={saveTimeline}
              className="px-4 py-2 bg-[#39FF14]/20 hover:bg-[#39FF14]/30 text-[#39FF14] rounded-lg transition-all"
            >
              Save Timeline
            </button>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="glass-luxury rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-sm">
                Total Duration (seconds)
              </label>
              <input
                type="number"
                value={editingTimeline.duration}
                onChange={(e) =>
                  setEditingTimeline({
                    ...editingTimeline,
                    duration: parseInt(e.target.value),
                  })
                }
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Total Scenes</label>
              <p className="text-white text-2xl font-bold mt-1">
                {editingTimeline.scenes.length}
              </p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Format</label>
              <p className="text-white text-2xl font-bold mt-1">
                {Math.floor(editingTimeline.duration / 60)}:
                {(editingTimeline.duration % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>

        {/* Scenes List */}
        <div className="space-y-4 mb-6">
          {editingTimeline.scenes.map((scene, index) => (
            <div key={scene.id} className="glass-luxury rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={scene.name}
                    onChange={(e) =>
                      updateScene(index, { name: e.target.value })
                    }
                    className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white text-xl font-bold mb-2"
                  />
                  <p className="text-gray-400 text-sm">
                    Start: {scene.startTime}s | Duration: {scene.duration}s
                  </p>
                </div>
                <button
                  onClick={() => removeScene(index)}
                  className="text-red-400 hover:text-red-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Camera Position</p>
                  <p className="text-white">
                    {scene.camera.position.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Lighting</p>
                  <p className="text-white">
                    {scene.lighting.spotlights.length} spotlights
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Fog Density</p>
                  <p className="text-white">{scene.fog.density}</p>
                </div>
                <div>
                  <p className="text-gray-400">Bloom Effect</p>
                  <p className="text-white">{scene.effects.bloom}x</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Scene Button */}
        <button
          onClick={addScene}
          className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white transition-all"
        >
          + Add Scene
        </button>
      </div>
    </div>
  );
}

// Экспорт дефолтного таймлайна
export { DEFAULT_TIMELINE };
