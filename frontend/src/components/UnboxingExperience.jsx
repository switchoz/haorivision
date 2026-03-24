import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

/**
 * Unboxing Experience - 3D анимация распаковки тубуса HAORI VISION
 */

export default function UnboxingExperience({ orderId, product, onComplete }) {
  const [stage, setStage] = useState("start"); // start → opening → reveal → authenticity → complete
  const [showGlow, setShowGlow] = useState(false);

  const stages = {
    start: "Начать распаковку",
    opening: "Тубус открывается...",
    reveal: "Свет пробуждается",
    authenticity: "Подпись художника подтверждена",
    complete: "Добро пожаловать в Vision",
  };

  const handleStart = () => {
    setStage("opening");

    setTimeout(() => {
      setStage("reveal");
      setShowGlow(true);
    }, 3000);

    setTimeout(() => {
      setStage("authenticity");
    }, 6000);

    setTimeout(() => {
      setStage("complete");
      if (onComplete) onComplete();
    }, 9000);
  };

  return (
    <div className="unboxing-experience fixed inset-0 bg-black z-50 overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={stage !== "start"}
            autoRotateSpeed={stage === "reveal" ? 3 : 1}
          />
          <ambientLight intensity={0.3} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
          />
          <Environment preset="night" />

          <TubusModel stage={stage} showGlow={showGlow} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-12">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl font-bold text-purple-300 mb-2">
            {stages[stage]}
          </h1>
          {stage === "start" && (
            <p className="text-gray-400 text-lg">
              Твоя хаори ждёт момента пробуждения
            </p>
          )}
        </motion.div>

        {/* Center Glow Effect */}
        <AnimatePresence>
          {showGlow && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              <div className="w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Info */}
        <AnimatePresence>
          {(stage === "reveal" ||
            stage === "authenticity" ||
            stage === "complete") && (
            <motion.div
              className="text-center bg-black/60 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-8 max-w-md pointer-events-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 1 }}
            >
              <h2 className="text-3xl font-bold text-purple-300 mb-4">
                {product.name}
              </h2>
              <p className="text-gray-400 mb-4">{product.tagline}</p>

              <div className="bg-purple-500/10 rounded-xl p-4 mb-4">
                <p className="text-sm text-purple-300 mb-2">Edition</p>
                <p className="text-2xl font-bold text-white">
                  #{product.editionNumber} / {product.totalEditions}
                </p>
              </div>

              {stage === "authenticity" && (
                <motion.div
                  className="bg-violet-500/10 rounded-xl p-4 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-violet-300 mb-2">Подлинность</p>
                  <p className="text-white text-sm">
                    ✍️ Подпись художника LiZa подтверждена
                  </p>
                </motion.div>
              )}

              {stage === "complete" && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-purple-300 italic text-lg">
                    "This garment was painted by hand
                    <br />
                    in the light of darkness.
                    <br />
                    You are now part of the Vision."
                  </p>

                  <button
                    onClick={() =>
                      (window.location.href = `/unboxing/${orderId}/journey`)
                    }
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
                  >
                    Посмотреть историю создания
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {stage === "start" && (
          <motion.button
            onClick={handleStart}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full text-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ✨ Открыть упаковку
          </motion.button>
        )}
      </div>

      {/* Progress Indicator */}
      {stage !== "start" && stage !== "complete" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {["opening", "reveal", "authenticity"].map((s, i) => (
            <div
              key={s}
              className={`w-12 h-1 rounded-full transition-all ${
                stages[stage] >= stages[s] ? "bg-purple-500" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 3D Tubus Model
 */
function TubusModel({ stage, showGlow }) {
  const tubeRef = useRef();
  const capRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (stage === "start") {
      // Idle rotation
      tubeRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }

    if (stage === "opening") {
      // Cap moves up
      capRef.current.position.y = Math.min(capRef.current.position.y + 0.02, 2);
      tubeRef.current.rotation.y += 0.01;
    }

    if (stage === "reveal" && showGlow) {
      // Glow pulse
      if (glowRef.current) {
        glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
        glowRef.current.material.opacity = 0.3 + Math.sin(t * 2) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* Tube body */}
      <mesh ref={tubeRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 3, 32]} />
        <meshStandardMaterial
          color="#1a0f2e"
          metalness={0.8}
          roughness={0.2}
          emissive="#7c3aed"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Tube cap */}
      <mesh ref={capRef} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.2, 32]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
          emissive="#a78bfa"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Glow effect */}
      {showGlow && (
        <mesh ref={glowRef} position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshBasicMaterial
            color="#a78bfa"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Inner light */}
      {stage === "reveal" && (
        <pointLight
          position={[0, 0, 0]}
          intensity={2}
          color="#a78bfa"
          distance={5}
        />
      )}
    </group>
  );
}
