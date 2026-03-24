import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";

// Импорты наших систем
import ShowController, { SHOW_MODES } from "./ShowController";
import StageLighting, { LIGHTING_PRESETS } from "./StageLighting";
import { BreathingFog } from "./VolumetricFog";
import AudioEngine from "./AudioEngine";
import PostProcessingEffects from "./PostProcessingEffects";
import ProjectionMapping, { PROJECTION_PRESETS } from "./ProjectionMapping";
import CollectionIslandsManager, {
  COLLECTION_PALETTES,
} from "./CollectionIslands";
import { useDMX } from "./DMXController";
import DMXControlPanel from "./DMXController";
import {
  useSMPTETimecode,
  SMPTEControlPanel,
  SMPTE_FRAMERATES,
} from "./SMPTETimecode";
import { useServiceWorker } from "../../utils/serviceWorkerManager";

/**
 * 🎭 IMMERSIVE SHOW MODE
 *
 * Мастер-компонент, объединяющий все системы:
 * - 3 режима: GALLERY, SHOW, KIOSK
 * - DMX/Art-Net световое управление
 * - SMPTE таймкод синхронизация
 * - Проекционный маппинг
 * - Аудио движок (Tone.js)
 * - Оффлайн режим (Service Worker)
 * - UV-reactive материалы
 */

export default function ImmersiveShowMode() {
  // === STATE ===
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDMXPanel, setShowDMXPanel] = useState(false);
  const [showSMPTEPanel, setShowSMPTEPanel] = useState(false);

  // === SYSTEMS ===
  const { controller: dmxController, isConnected: dmxConnected } = useDMX();
  const {
    timecode,
    start: startTimecode,
    stop: stopTimecode,
    reset: resetTimecode,
    engine: smpteEngine,
  } = useSMPTETimecode(SMPTE_FRAMERATES.NTSC_30);

  const { isReady: swReady, offlineReady, precacheAssets } = useServiceWorker();

  // === REFS ===
  const audioEngineRef = useRef(null);
  const lightingPresetRef = useRef("gallery");

  // === LOAD CONCEPTS ===
  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      setLoading(true);

      // Загружаем из collections.json
      const response = await fetch("/data/products/collections.json");
      const data = await response.json();

      if (data.collections) {
        // Преобразуем в формат concepts
        const conceptsData = data.collections.map((col) => ({
          id: col.id,
          name: col.name,
          subtitle: col.concept.title,
          philosophy: col.concept.description,
          palette: {
            colors: col.products[0]?.visualStyle?.colorPalette?.uvLight || [],
          },
          quote: col.concept.emotion,
          season: col.season,
        }));

        setConcepts(conceptsData);

        // Pre-cache assets для оффлайн режима
        if (swReady) {
          const assetUrls = data.collections
            .flatMap((col) =>
              col.products.map((p) => p.visualStyle?.imageUrl || ""),
            )
            .filter(Boolean);

          await precacheAssets(assetUrls);
        }
      }
    } catch (error) {
      console.error("Error fetching concepts:", error);
    } finally {
      setLoading(false);
    }
  };

  // === SCENE CHANGE HANDLER ===
  const handleSceneChange = (scene) => {
    setCurrentScene(scene);

    // Синхронизация всех систем
    if (scene) {
      // DMX освещение
      if (dmxController && scene.lighting) {
        dmxController.sceneEffect(scene.name.toLowerCase());
      }

      // Audio
      if (audioEngineRef.current && scene.audio) {
        audioEngineRef.current.applySceneAudio(scene);
      }

      // Lighting preset
      if (scene.lightingPreset) {
        lightingPresetRef.current = scene.lightingPreset;
      }
    }
  };

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF10F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Immersive Gallery...</p>
          {swReady && (
            <p className="text-gray-400 text-sm mt-2">
              {offlineReady ? "✓ Offline mode ready" : "○ Caching assets..."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AudioEngine enableGenerative={true} enableUVBreathing={true}>
      {({ engine }) => {
        audioEngineRef.current = engine;

        return (
          <ShowController initialMode={SHOW_MODES.GALLERY}>
            {({ mode, modeSettings, startShow }) => (
              <div className="relative w-full h-screen bg-black">
                {/* === 3D CANVAS === */}
                <Canvas shadows>
                  <PerspectiveCamera
                    makeDefault
                    position={[0, 5, 15]}
                    fov={60}
                  />

                  {/* Controls */}
                  <OrbitControls
                    enablePan={modeSettings.enableControls}
                    enableZoom={modeSettings.enableControls}
                    enableRotate={modeSettings.enableControls}
                    autoRotate={modeSettings.autoRotate}
                    autoRotateSpeed={0.5}
                    minDistance={5}
                    maxDistance={30}
                    maxPolarAngle={Math.PI / 2}
                  />

                  {/* === LIGHTING SYSTEM === */}
                  <StageLighting preset={lightingPresetRef.current} />

                  {/* === VOLUMETRIC FOG === */}
                  <BreathingFog
                    color="#0a0a0a"
                    uvColor="#FF10F0"
                    breathSpeed={2.0}
                    minDensity={0.3}
                    maxDensity={0.7}
                    size={[60, 25, 60]}
                  />

                  {/* === COLLECTION ISLANDS === */}
                  <CollectionIslandsManager
                    collections={concepts}
                    uvIntensity={mode === SHOW_MODES.SHOW ? 1.0 : 0.8}
                  />

                  {/* === PROJECTION MAPPING === */}
                  {mode === SHOW_MODES.SHOW && currentScene && (
                    <ProjectionMapping
                      mode={currentScene.projectionMode || "reactive"}
                      config={
                        PROJECTION_PRESETS[currentScene.name.toLowerCase()] ||
                        {}
                      }
                    />
                  )}

                  {/* Environment */}
                  <Environment preset="night" />

                  {/* Post-Processing */}
                  <PostProcessingEffects
                    bloomStrength={mode === SHOW_MODES.SHOW ? 2.0 : 1.5}
                    bloomRadius={0.5}
                    bloomThreshold={0.85}
                    vignetteIntensity={0.4}
                  />

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

                {/* === HUD CONTROLS === */}
                {modeSettings.showHUD && (
                  <>
                    {/* Mode Switcher (верхний правый угол) */}
                    <div className="fixed top-8 right-8 z-10 glass-luxury rounded-2xl p-4">
                      <h3 className="text-white font-bold mb-3 text-sm">
                        MODE
                      </h3>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => startShow(null)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            mode === SHOW_MODES.GALLERY
                              ? "bg-[#FF10F0] text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          GALLERY
                        </button>
                        <button
                          onClick={() => {
                            startShow({ scenes: [] }); // TODO: загрузить timeline
                            startTimecode();
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            mode === SHOW_MODES.SHOW
                              ? "bg-[#00D4FF] text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          SHOW
                        </button>
                        <button
                          onClick={() => startShow(null)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            mode === SHOW_MODES.KIOSK
                              ? "bg-[#39FF14] text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          KIOSK
                        </button>
                      </div>
                    </div>

                    {/* System Status (верхний левый угол) */}
                    <div className="fixed top-8 left-8 z-10 glass-luxury rounded-2xl p-4 min-w-[200px]">
                      <h3 className="text-white font-bold mb-3 text-sm">
                        SYSTEMS
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${dmxConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
                          />
                          <span className="text-gray-400">DMX/Art-Net</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${engine?.isInitialized ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
                          />
                          <span className="text-gray-400">Audio Engine</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${offlineReady ? "bg-green-400 animate-pulse" : "bg-yellow-600"}`}
                          />
                          <span className="text-gray-400">Offline Mode</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <button
                          onClick={() => setShowDMXPanel(!showDMXPanel)}
                          className="w-full px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-xs transition-all"
                        >
                          {showDMXPanel ? "Hide" : "Show"} DMX Panel
                        </button>
                        <button
                          onClick={() => setShowSMPTEPanel(!showSMPTEPanel)}
                          className="w-full mt-2 px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-xs transition-all"
                        >
                          {showSMPTEPanel ? "Hide" : "Show"} SMPTE
                        </button>
                      </div>
                    </div>

                    {/* DMX Control Panel */}
                    {showDMXPanel && dmxController && (
                      <DMXControlPanel controller={dmxController} />
                    )}

                    {/* SMPTE Control Panel */}
                    {showSMPTEPanel && mode === SHOW_MODES.SHOW && (
                      <div className="fixed bottom-8 right-8 z-10">
                        <SMPTEControlPanel engine={smpteEngine} />
                      </div>
                    )}
                  </>
                )}

                {/* === KIOSK MODE INDICATOR === */}
                {mode === SHOW_MODES.KIOSK && (
                  <div className="fixed top-8 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full">
                    <p className="text-[#39FF14] font-bold tracking-wider">
                      ◆ KIOSK MODE ACTIVE ◆
                    </p>
                  </div>
                )}

                {/* === SHOW MODE INFO === */}
                {mode === SHOW_MODES.SHOW && currentScene && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 glass-luxury rounded-full px-8 py-4">
                    <p className="text-white font-semibold text-center">
                      Scene:{" "}
                      <span className="text-[#00D4FF]">
                        {currentScene.name}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </ShowController>
        );
      }}
    </AudioEngine>
  );
}
