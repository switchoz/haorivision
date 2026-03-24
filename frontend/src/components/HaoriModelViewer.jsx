/**
 * HaoriModelViewer — 3D визуализация хаори из загруженных фотографий
 *
 * Создаёт торс-манекен с наложенными текстурами (перёд/спина).
 * Поддерживает переключение дневной/UV режим.
 * 360° вращение, зум, автовращение.
 */

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../contexts/ThemeContext";

/* ══════════════════════════════════════════════
   HaoriMesh — 3D хаори на торсе
   ══════════════════════════════════════════════ */

function HaoriMesh({ frontUrl, backUrl, autoRotate }) {
  const groupRef = useRef();
  const frontTex = useLoader(THREE.TextureLoader, frontUrl);
  const backTex = useLoader(THREE.TextureLoader, backUrl);

  // Configure textures
  useMemo(() => {
    [frontTex, backTex].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
    });
  }, [frontTex, backTex]);

  // Slight idle animation
  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.003;
    }
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
  });

  // Build curved haori shape — front panel
  const frontGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.2, 3, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Curve outward slightly — body shape
      const z = Math.cos(x * 0.8) * 0.15 + Math.cos(y * 0.4) * 0.05;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Back panel — mirrored curve
  const backGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.2, 3, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = -(Math.cos(x * 0.8) * 0.15 + Math.cos(y * 0.4) * 0.05);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Side panels — connect front and back
  const sideGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -1.5);
    shape.lineTo(0, 1.5);
    const extrudeSettings = { depth: 0.01, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Sleeve geometry — angled planes
  const sleeveGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.6, 1.2, 16, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.abs(x) * 0.2 + Math.cos(y * 1.5) * 0.05;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Front panel */}
      <mesh geometry={frontGeo} position={[0, 0, 0.01]} castShadow>
        <meshStandardMaterial
          map={frontTex}
          side={THREE.FrontSide}
          metalness={0.05}
          roughness={0.7}
        />
      </mesh>

      {/* Back panel */}
      <mesh geometry={backGeo} position={[0, 0, -0.01]} castShadow>
        <meshStandardMaterial
          map={backTex}
          side={THREE.BackSide}
          metalness={0.05}
          roughness={0.7}
        />
      </mesh>

      {/* Side connecting strips */}
      {[-1.1, 1.1].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0, 0]} castShadow>
          <boxGeometry args={[0.02, 3, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Left sleeve */}
      <mesh
        geometry={sleeveGeo}
        position={[-1.8, 0.5, 0]}
        rotation={[0, 0, Math.PI * 0.15]}
        castShadow
      >
        <meshStandardMaterial
          map={frontTex}
          side={THREE.DoubleSide}
          metalness={0.05}
          roughness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Right sleeve */}
      <mesh
        geometry={sleeveGeo}
        position={[1.8, 0.5, 0]}
        rotation={[0, 0, -Math.PI * 0.15]}
        castShadow
      >
        <meshStandardMaterial
          map={frontTex}
          side={THREE.DoubleSide}
          metalness={0.05}
          roughness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Collar */}
      <mesh position={[0, 1.55, 0.05]}>
        <torusGeometry args={[0.35, 0.03, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
      </mesh>

      {/* Mannequin hint — neck */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Mannequin hint — shoulders */}
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[2.2, 0.08, 0.25]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════
   Scene — полная 3D сцена
   ══════════════════════════════════════════════ */

function Scene({ frontUrl, backUrl, uvMode, autoRotate }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={45} />

      {/* Lighting */}
      <ambientLight intensity={uvMode ? 0.3 : 0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={uvMode ? 0.5 : 1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />

      {uvMode && (
        <>
          <pointLight
            position={[2, 2, 2]}
            color="#a855f7"
            intensity={1.5}
            distance={8}
          />
          <pointLight
            position={[-2, -1, 2]}
            color="#ec4899"
            intensity={1}
            distance={8}
          />
          <pointLight
            position={[0, -2, 3]}
            color="#06b6d4"
            intensity={0.8}
            distance={6}
          />
        </>
      )}

      <HaoriMesh
        frontUrl={frontUrl}
        backUrl={backUrl}
        autoRotate={autoRotate}
      />

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.4}
        scale={8}
        blur={2}
        far={4}
      />

      <Environment preset={uvMode ? "night" : "warehouse"} />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        autoRotate={false}
        makeDefault
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   HaoriModelViewer — exported component
   ══════════════════════════════════════════════ */

export default function HaoriModelViewer({
  frontUrl,
  backUrl,
  frontUvUrl,
  backUvUrl,
  title = "Haori 3D",
  className = "",
}) {
  const { isUVMode } = useTheme();
  const [showUV, setShowUV] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const effectiveUV = isUVMode || showUV;
  const activeFront = effectiveUV && frontUvUrl ? frontUvUrl : frontUrl;
  const activeBack = effectiveUV && backUvUrl ? backUvUrl : backUrl;

  if (!frontUrl) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-zinc-900 rounded-2xl ${className}`}
      >
        <p className="text-zinc-500">
          Загрузите фотографии хаори для 3D-визуализации
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {/* 3D Canvas */}
      <div className="aspect-[4/5] md:aspect-[3/4] w-full bg-gradient-to-b from-zinc-900 to-black">
        <Canvas
          shadows
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
        >
          <Scene
            frontUrl={activeFront}
            backUrl={activeBack || activeFront}
            uvMode={effectiveUV}
            autoRotate={autoRotate}
          />
        </Canvas>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          {/* Title */}
          <h3 className="text-white font-semibold text-lg">{title}</h3>

          {/* Buttons */}
          <div className="flex gap-2">
            {/* Auto-rotate toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                autoRotate
                  ? "bg-white/20 text-white"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              360°
            </button>

            {/* UV toggle */}
            {(frontUvUrl || backUvUrl) && (
              <button
                onClick={() => setShowUV(!showUV)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showUV
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                UV
              </button>
            )}
          </div>
        </div>

        <p className="text-zinc-500 text-xs mt-2">
          Зажмите и тяните для вращения. Колёсико — зум.
        </p>
      </div>
    </div>
  );
}
