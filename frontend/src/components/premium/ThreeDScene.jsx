import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  MeshDistortMaterial,
  Sphere,
  Environment,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

// Animated UV Sphere (Balenciaga-style)
function AnimatedSphere({ position, color, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// Glowing Particles System
function ParticleField({ count = 200, isUVMode }) {
  const points = useRef();
  const particlesPosition = useRef(new Float32Array(count * 3));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      particlesPosition.current[i * 3] = (Math.random() - 0.5) * 20;
      particlesPosition.current[i * 3 + 1] = (Math.random() - 0.5) * 20;
      particlesPosition.current[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
  }, [count]);

  useFrame((state) => {
    points.current.rotation.y = state.clock.elapsedTime * 0.05;
    points.current.rotation.x = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isUVMode ? 0.15 : 0.05}
        color={isUVMode ? "#B026FF" : "#ffffff"}
        transparent
        opacity={isUVMode ? 0.8 : 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// DNA Helix Effect (inspired by luxury genetics)
function DNAHelix({ isUVMode }) {
  const groupRef = useRef();

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  const helixPoints = [];
  const turns = 4;
  const pointsPerTurn = 20;

  for (let i = 0; i < turns * pointsPerTurn; i++) {
    const t = (i / (turns * pointsPerTurn)) * Math.PI * 2 * turns;
    const radius = 2;

    helixPoints.push({
      position: [
        Math.cos(t) * radius,
        (i / (turns * pointsPerTurn)) * 10 - 5,
        Math.sin(t) * radius,
      ],
      rotation: t,
    });
  }

  return (
    <group ref={groupRef}>
      {helixPoints.map((point, i) => (
        <Sphere key={i} args={[0.1, 16, 16]} position={point.position}>
          <meshStandardMaterial
            color={isUVMode ? (i % 2 === 0 ? "#B026FF" : "#FF10F0") : "#666666"}
            emissive={
              isUVMode ? (i % 2 === 0 ? "#B026FF" : "#FF10F0") : "#000000"
            }
            emissiveIntensity={isUVMode ? 0.5 : 0}
          />
        </Sphere>
      ))}
    </group>
  );
}

// Main 3D Scene Component
const ThreeDScene = ({ className = "" }) => {
  const { isUVMode } = useTheme();

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Ambient Light */}
        <ambientLight intensity={isUVMode ? 0.3 : 0.1} />

        {/* Directional Lights */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={isUVMode ? 1 : 0.5}
          color={isUVMode ? "#B026FF" : "#ffffff"}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={isUVMode ? 0.5 : 0.3}
          color={isUVMode ? "#FF10F0" : "#ffffff"}
        />

        {/* Point Lights for UV Glow */}
        {isUVMode && (
          <>
            <pointLight
              position={[5, 5, 5]}
              intensity={2}
              color="#B026FF"
              distance={15}
            />
            <pointLight
              position={[-5, -5, 5]}
              intensity={2}
              color="#FF10F0"
              distance={15}
            />
            <pointLight
              position={[0, 0, -5]}
              intensity={1.5}
              color="#00D4FF"
              distance={15}
            />
          </>
        )}

        {/* Environment Map */}
        <Environment preset={isUVMode ? "night" : "warehouse"} />

        {/* Main 3D Objects */}
        <AnimatedSphere
          position={[-3, 2, -2]}
          color={isUVMode ? "#B026FF" : "#333333"}
          speed={1}
        />
        <AnimatedSphere
          position={[3, -1, -3]}
          color={isUVMode ? "#FF10F0" : "#444444"}
          speed={0.7}
        />
        <AnimatedSphere
          position={[0, 1, -5]}
          color={isUVMode ? "#00D4FF" : "#222222"}
          speed={1.3}
        />

        {/* DNA Helix */}
        <DNAHelix isUVMode={isUVMode} />

        {/* Particle Field */}
        <ParticleField count={300} isUVMode={isUVMode} />

        {/* Orbit Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isUVMode
            ? "radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.7) 70%)"
            : "radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.9) 80%)",
        }}
      />
    </div>
  );
};

export default ThreeDScene;
