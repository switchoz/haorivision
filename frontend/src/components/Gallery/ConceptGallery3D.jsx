import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import ConceptCard3D from "./ConceptCard3D";

import ShowController, { SHOW_MODES } from "./ShowController";
import TimelineSystem from "./TimelineSystem";
import VolumetricFog, { BreathingFog } from "./VolumetricFog";
import PostProcessingEffects, {
  SceneBasedEffects,
} from "./PostProcessingEffects";
import AudioEngine from "./AudioEngine";

/**
 * 🎨 3D CONCEPT GALLERY
 *
 * Интерактивная 3D-галерея новых коллекций с UV-свечением
 */
export default function ConceptGallery3D() {
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(null);

  // Load concepts from backend
  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/brand-analysis/artistic-evolution/status",
      );
      const data = await response.json();

      if (data.success && data.iteration) {
        // Get concepts for latest month
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        const conceptsResponse = await fetch(
          `/api/brand-analysis/artistic-evolution/concepts/${month}`,
        );
        const conceptsData = await conceptsResponse.json();

        if (conceptsData.success) {
          setConcepts(conceptsData.concepts || []);
        }
      }
    } catch (error) {
      console.error("Error fetching concepts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConceptClick = (concept) => {
    setSelectedConcept(concept);
  };

  const handleExploreLight = () => {
    setIsFullscreen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF10F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Gallery of Light...</p>
        </div>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">No concepts available yet</p>
          <p className="text-gray-400">
            The Artistic Evolution system will generate concepts monthly
          </p>
        </div>
      </div>
    );
  }

  return (
    <AudioEngine enableGenerative={true} enableUVBreathing={true}>
      {({ engine }) => (
        <ShowController initialMode={SHOW_MODES.GALLERY}>
          {({ mode, modeSettings, startShow }) => (
            <div
              className={`${isFullscreen ? "fixed inset-0 z-50" : "relative"} bg-black`}
            >
              {/* Header */}
              {!isFullscreen && (
                <div className="absolute top-0 left-0 right-0 z-10 p-8">
                  <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                      3D Concept Gallery
                    </h1>
                    <p className="text-gray-400">
                      Explore new collections in the light
                    </p>
                  </div>
                </div>
              )}

              {/* 3D Canvas */}
              <div className="w-full h-screen">
                <Canvas shadows>
                  <Suspense fallback={null}>
                    {/* Camera */}
                    <PerspectiveCamera
                      makeDefault
                      position={[0, 2, 8]}
                      fov={50}
                    />

                    {/* Controls */}
                    <OrbitControls
                      enablePan={false}
                      enableZoom={modeSettings.enableControls}
                      enableRotate={modeSettings.enableControls}
                      autoRotate={modeSettings.autoRotate}
                      autoRotateSpeed={0.5}
                      minDistance={5}
                      maxDistance={20}
                      maxPolarAngle={Math.PI / 2}
                    />

                    {/* Lighting */}
                    <ambientLight intensity={0.2} />
                    <pointLight
                      position={[0, 10, 0]}
                      intensity={0.5}
                      color="#FF10F0"
                    />
                    <pointLight
                      position={[10, 5, 10]}
                      intensity={0.3}
                      color="#00D4FF"
                    />
                    <pointLight
                      position={[-10, 5, -10]}
                      intensity={0.3}
                      color="#39FF14"
                    />

                    {/* Volumetric Fog */}
                    <BreathingFog
                      color="#0a0a0a"
                      uvColor="#FF10F0"
                      breathSpeed={2.0}
                      minDensity={0.3}
                      maxDensity={0.7}
                      size={[50, 20, 50]}
                    />

                    {/* Environment */}
                    <Environment preset="night" />

                    {/* Post-Processing Effects */}
                    {currentScene ? (
                      <SceneBasedEffects scene={currentScene} />
                    ) : (
                      <PostProcessingEffects
                        bloomStrength={1.5}
                        bloomRadius={0.4}
                        bloomThreshold={0.85}
                        vignetteIntensity={0.3}
                      />
                    )}

                    {/* Concept Cards in circular arrangement */}
                    {concepts.map((concept, index) => (
                      <ConceptCard3D
                        key={concept.name}
                        concept={concept}
                        index={index}
                        total={concepts.length}
                        onClick={() =>
                          modeSettings.enableInteraction &&
                          handleConceptClick(concept)
                        }
                        isSelected={
                          modeSettings.kioskIndex !== null
                            ? index ===
                              modeSettings.kioskIndex % concepts.length
                            : selectedConcept?.name === concept.name
                        }
                      />
                    ))}

                    {/* Ground reflection */}
                    <mesh
                      rotation={[-Math.PI / 2, 0, 0]}
                      position={[0, -0.5, 0]}
                      receiveShadow
                    >
                      <planeGeometry args={[50, 50]} />
                      <meshStandardMaterial
                        color="#000000"
                        metalness={0.9}
                        roughness={0.1}
                      />
                    </mesh>
                  </Suspense>
                </Canvas>
              </div>

              {/* Info Panel */}
              {selectedConcept && !isFullscreen && (
                <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
                  <div className="max-w-4xl mx-auto glass-luxury rounded-2xl p-6 pointer-events-auto">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-[#FF10F0] mb-2">
                          {selectedConcept.name}
                        </h2>
                        <p className="text-gray-400 text-sm">
                          {selectedConcept.subtitle}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedConcept(null)}
                        className="text-gray-400 hover:text-white text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <p className="text-white mb-4">
                      {selectedConcept.philosophy}
                    </p>

                    {/* Color Palette */}
                    <div className="flex gap-2 mb-4">
                      {selectedConcept.palette.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-lg"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-[#39FF14] italic mb-6">
                      "{selectedConcept.quote}"
                    </p>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleExploreLight}
                        className="btn-luxury px-6 py-3 rounded-full"
                      >
                        Explore Light
                      </button>
                      <button
                        onClick={() => {
                          /* View details */
                        }}
                        className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all"
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Concept Details Panel - placeholder */}

              {/* Fullscreen Exit */}
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-8 right-8 z-20 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white transition-all"
                >
                  Exit Fullscreen
                </button>
              )}

              {/* Timeline System (в SHOW режиме) */}
              {mode === SHOW_MODES.SHOW && (
                <TimelineSystem
                  onSceneChange={(scene) => {
                    setCurrentScene(scene);
                    if (engine) {
                      engine.applySceneAudio(scene);
                    }
                  }}
                  isPlaying={true}
                />
              )}
            </div>
          )}
        </ShowController>
      )}
    </AudioEngine>
  );
}
