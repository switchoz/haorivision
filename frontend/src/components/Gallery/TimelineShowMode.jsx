import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import {
  useShowRunner,
  ShowCamera,
  ShowTextOverlays,
} from "./ShowRunnerController";
import ShowRunnerController from "./ShowRunnerController";
import StageLighting from "./StageLighting";
import { BreathingFog } from "./VolumetricFog";
import PostProcessingEffects from "./PostProcessingEffects";
import ProjectionMapping from "./ProjectionMapping";
import CollectionIslandsManager from "./CollectionIslands";
import AudioEngine from "./AudioEngine";
import { useDMX } from "./DMXController";
import { useEffect } from "react";

/**
 * 🎬 TIMELINE SHOW MODE
 *
 * Полностью автоматическое шоу по timeline.json
 * Синхронизация камеры, света, звука, DMX, текста
 */

export default function TimelineShowMode() {
  const { runner, isLoaded, isPlaying, currentScene, currentTime, progress } =
    useShowRunner("/data/show/timeline.json");

  const { controller: dmxController } = useDMX();

  // Синхронизация DMX с timeline
  useEffect(() => {
    if (!runner || !dmxController) return;

    const unsubDMXCue = runner.on("cue:dmx", (event) => {
      const cue = event.data;
      if (import.meta.env.DEV) console.log("[DMX Cue]", cue.action, cue);

      // Выполнить DMX команду
      switch (cue.action) {
        case "blackout":
          dmxController.blackout();
          break;

        case "fadeIn":
        case "setColor":
          if (cue.fixtures && cue.color) {
            cue.fixtures.forEach((fixture) => {
              const fixtureObj = dmxController.fixtures.find(
                (f) => f.name === fixture,
              );
              if (fixtureObj) {
                dmxController.setFixture(fixtureObj.id, {
                  red: cue.color[0],
                  green: cue.color[1],
                  blue: cue.color[2],
                  dimmer: cue.intensity || 255,
                });
              }
            });
          }
          break;

        case "uvBreathing":
          dmxController.uvBreathingPattern(
            cue.maxIntensity || 255,
            cue.speed || 2.0,
          );
          break;

        case "fullIntensity":
          dmxController.fullIntensity();
          break;

        case "fadeOut":
          dmxController.blackout();
          break;

        default:
          console.warn("[DMX] Unknown action:", cue.action);
      }
    });

    return () => unsubDMXCue();
  }, [runner, dmxController]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF10F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Show Timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <AudioEngine enableGenerative={false} enableUVBreathing={false}>
      {({ engine }) => (
        <div className="relative w-full h-screen bg-black">
          {/* 3D Canvas */}
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={60} />

            {/* Show Camera Controller */}
            <ShowCamera runner={runner} />

            {/* Освещение из текущей сцены */}
            {currentScene && (
              <StageLighting
                preset={currentScene.lighting.preset || "gallery"}
              />
            )}

            {/* Volumetric Fog */}
            {currentScene && currentScene.fog && (
              <BreathingFog
                color={currentScene.fog.color}
                uvColor="#FF10F0"
                breathSpeed={2.0}
                minDensity={currentScene.fog.density * 0.5}
                maxDensity={currentScene.fog.density}
                size={[60, 25, 60]}
              />
            )}

            {/* Collection Islands */}
            <CollectionIslandsManager
              collections={[]}
              uvIntensity={currentScene?.collectionFocus?.uvIntensity || 0.8}
            />

            {/* Projection Mapping */}
            {currentScene && currentScene.projection && (
              <ProjectionMapping
                mode={currentScene.projection.mode}
                config={currentScene.projection}
              />
            )}

            {/* Environment */}
            <Environment preset="night" />

            {/* Post-Processing */}
            {currentScene && currentScene.shader && (
              <PostProcessingEffects
                bloomStrength={currentScene.shader.bloom.strength}
                bloomRadius={currentScene.shader.bloom.radius}
                bloomThreshold={currentScene.shader.bloom.threshold}
                vignetteIntensity={currentScene.shader.vignette}
              />
            )}

            {/* Ground */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.5, 0]}
              receiveShadow
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial
                color="#000000"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          </Canvas>

          {/* Text Overlays */}
          <ShowTextOverlays runner={runner} />

          {/* Show Controls */}
          <ShowRunnerController
            runner={runner}
            isLoaded={isLoaded}
            isPlaying={isPlaying}
            currentTime={currentTime}
            progress={progress}
            currentScene={currentScene}
          />

          {/* Scene Info (debug) */}
          {currentScene && (
            <div className="fixed top-8 left-8 z-10 glass-luxury rounded-2xl p-4 max-w-sm">
              <h3 className="text-white font-bold mb-2">{currentScene.name}</h3>
              <p className="text-gray-400 text-sm mb-2">
                {currentScene.description}
              </p>
              <div className="text-xs text-gray-500">
                <p>Time: {currentTime.toFixed(1)}s</p>
                <p>Duration: {currentScene.duration}s</p>
                <p>Lighting: {currentScene.lighting.preset}</p>
                {currentScene.projection && (
                  <p>Projection: {currentScene.projection.mode}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AudioEngine>
  );
}
