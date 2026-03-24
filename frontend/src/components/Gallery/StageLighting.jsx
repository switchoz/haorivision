import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 💡 STAGE LIGHTING SYSTEM
 *
 * Система сценического освещения с UV-паттернами
 * Синхронизация с DMX и аудио
 */

// UV Spotlight с breathing эффектом
export function UVSpotlight({
  position = [0, 5, 0],
  target = [0, 0, 0],
  color = "#FF10F0",
  intensity = 2.0,
  angle = Math.PI / 6,
  penumbra = 0.5,
  distance = 20,
  breathingSpeed = 2.0,
  enableBreathing = true,
}) {
  const lightRef = useRef();
  const targetRef = useRef();

  useFrame(({ clock }) => {
    if (!lightRef.current || !enableBreathing) return;

    // Breathing pattern
    const breath = Math.sin(clock.elapsedTime * breathingSpeed) * 0.5 + 0.5;
    lightRef.current.intensity = intensity * (0.5 + breath * 0.5);
  });

  return (
    <group>
      <object3D ref={targetRef} position={target} />
      <spotLight
        ref={lightRef}
        position={position}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        castShadow
        target={targetRef.current}
      />
    </group>
  );
}

// Динамический UV свет с паттернами
export function DynamicUVLight({
  position = [0, 10, 0],
  color = "#FF10F0",
  intensity = 1.5,
  pattern = "pulse", // pulse, sweep, strobe, wave
  speed = 1.0,
}) {
  const lightRef = useRef();

  useFrame(({ clock }) => {
    if (!lightRef.current) return;

    const time = clock.elapsedTime * speed;

    switch (pattern) {
      case "pulse":
        // Плавная пульсация
        const pulse = Math.sin(time * 2) * 0.5 + 0.5;
        lightRef.current.intensity = intensity * pulse;
        break;

      case "sweep":
        // Движение по кругу
        const radius = 5;
        lightRef.current.position.x = Math.cos(time) * radius;
        lightRef.current.position.z = Math.sin(time) * radius;
        break;

      case "strobe":
        // Стробоскоп
        const strobe = Math.floor(time * 10) % 2;
        lightRef.current.intensity = strobe ? intensity : 0;
        break;

      case "wave":
        // Волна интенсивности
        const wave = (Math.sin(time * 3) + Math.cos(time * 2)) * 0.25 + 0.5;
        lightRef.current.intensity = intensity * wave;
        break;

      default:
        lightRef.current.intensity = intensity;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={30}
      decay={2}
    />
  );
}

// RGB Accent Light с цветовыми переходами
export function RGBAccentLight({
  position = [5, 3, 5],
  colors = ["#FF10F0", "#00D4FF", "#39FF14"],
  intensity = 1.0,
  transitionSpeed = 2.0,
}) {
  const lightRef = useRef();
  const colorIndexRef = useRef(0);
  const colorObjects = useRef(colors.map((c) => new THREE.Color(c)));

  useFrame(({ clock }) => {
    if (!lightRef.current) return;

    const time = clock.elapsedTime * transitionSpeed;
    const t = time % 1; // 0 to 1

    const currentIndex = Math.floor(time) % colors.length;
    const nextIndex = (currentIndex + 1) % colors.length;

    // Интерполяция между цветами
    const currentColor = colorObjects.current[currentIndex];
    const nextColor = colorObjects.current[nextIndex];

    lightRef.current.color.copy(currentColor).lerp(nextColor, t);
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      intensity={intensity}
      distance={20}
      decay={2}
    />
  );
}

// Moving Head Light (имитация движущейся головки)
export function MovingHeadLight({
  position = [0, 8, 0],
  color = "#FFFFFF",
  intensity = 2.0,
  panRange = [-90, 90], // градусы
  tiltRange = [0, 90], // градусы
  speed = 1.0,
  pattern = "circle", // circle, figure8, random
}) {
  const lightRef = useRef();
  const targetRef = useRef();

  useFrame(({ clock }) => {
    if (!lightRef.current || !targetRef.current) return;

    const time = clock.elapsedTime * speed;

    let x, y, z;

    switch (pattern) {
      case "circle":
        // Круговое движение
        x = Math.cos(time) * 5;
        z = Math.sin(time) * 5;
        y = 0;
        break;

      case "figure8":
        // Восьмёрка
        x = Math.sin(time) * 5;
        z = Math.sin(time * 2) * 5;
        y = Math.cos(time) * 2;
        break;

      case "random":
        // Случайное движение с плавными переходами
        x = Math.sin(time * 0.7) * 5 + Math.cos(time * 1.3) * 2;
        z = Math.cos(time * 0.9) * 5 + Math.sin(time * 1.1) * 2;
        y = Math.sin(time * 0.5) * 1;
        break;

      default:
        x = 0;
        y = 0;
        z = 0;
    }

    targetRef.current.position.set(x, y, z);
  });

  return (
    <group>
      <object3D ref={targetRef} />
      <spotLight
        ref={lightRef}
        position={position}
        color={color}
        intensity={intensity}
        angle={Math.PI / 8}
        penumbra={0.3}
        distance={25}
        castShadow
        target={targetRef.current}
      />
    </group>
  );
}

// Volumetric Light Beam (луч света с объёмом)
export function VolumetricBeam({
  position = [0, 5, 0],
  target = [0, 0, 0],
  color = "#00D4FF",
  intensity = 1.5,
  radius = 0.3,
  length = 10,
}) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Пульсация opacity
    const pulse = Math.sin(clock.elapsedTime * 2) * 0.3 + 0.7;
    meshRef.current.material.opacity = pulse * 0.3;
  });

  // Направление луча
  const direction = new THREE.Vector3(...target).sub(
    new THREE.Vector3(...position),
  );
  const length_actual = direction.length();
  direction.normalize();

  // Quaternion для ориентации
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={meshRef} position={[0, length_actual / 2, 0]}>
        <cylinderGeometry
          args={[radius, radius * 1.5, length_actual, 16, 1, true]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Точечный свет на конце луча */}
      <pointLight
        position={[0, length_actual, 0]}
        color={color}
        intensity={intensity}
        distance={5}
      />
    </group>
  );
}

// Preset освещения для сцен
export const LIGHTING_PRESETS = {
  opening: {
    ambient: 0.1,
    lights: [
      {
        type: "uv",
        position: [0, 10, 0],
        intensity: 0,
        breathing: true,
        breathingSpeed: 2,
      },
      {
        type: "uv",
        position: [-5, 8, 5],
        intensity: 0,
        breathing: true,
        breathingSpeed: 2.5,
      },
      {
        type: "uv",
        position: [5, 8, -5],
        intensity: 0,
        breathing: true,
        breathingSpeed: 1.8,
      },
    ],
  },

  showcase: {
    ambient: 0.2,
    lights: [
      { type: "uv", position: [0, 10, 0], intensity: 2, pattern: "pulse" },
      {
        type: "rgb",
        position: [10, 5, 0],
        colors: ["#FF10F0", "#00D4FF", "#39FF14"],
      },
      {
        type: "rgb",
        position: [-10, 5, 0],
        colors: ["#39FF14", "#FF10F0", "#00D4FF"],
      },
      {
        type: "movingHead",
        position: [0, 12, 0],
        pattern: "circle",
        speed: 0.5,
      },
    ],
  },

  finale: {
    ambient: 0.5,
    lights: [
      { type: "uv", position: [0, 10, 0], intensity: 3, pattern: "strobe" },
      { type: "uv", position: [-5, 8, 5], intensity: 3 },
      { type: "uv", position: [5, 8, -5], intensity: 3 },
      { type: "rgb", position: [0, 5, 0], colors: ["#FFFFFF"], intensity: 2 },
      {
        type: "movingHead",
        position: [5, 12, 5],
        pattern: "figure8",
        speed: 2,
      },
      {
        type: "movingHead",
        position: [-5, 12, -5],
        pattern: "figure8",
        speed: 2,
      },
    ],
  },

  gallery: {
    ambient: 0.2,
    lights: [
      { type: "uv", position: [0, 10, 0], intensity: 1.5, breathing: true },
      { type: "rgb", position: [10, 5, 10], colors: ["#FF10F0"] },
      { type: "rgb", position: [-10, 5, -10], colors: ["#00D4FF"] },
    ],
  },

  kiosk: {
    ambient: 0.15,
    lights: [
      {
        type: "uv",
        position: [0, 8, 0],
        intensity: 1.2,
        breathing: true,
        breathingSpeed: 1.5,
      },
      {
        type: "rgb",
        position: [0, 5, 0],
        colors: ["#FF10F0", "#00D4FF", "#39FF14"],
        transitionSpeed: 0.5,
      },
    ],
  },
};

// Компонент для применения preset освещения
export default function StageLighting({
  preset = "gallery",
  customLights = null,
}) {
  const lights =
    customLights ||
    LIGHTING_PRESETS[preset]?.lights ||
    LIGHTING_PRESETS.gallery.lights;
  const ambient = LIGHTING_PRESETS[preset]?.ambient || 0.2;

  return (
    <group>
      {/* Ambient Light */}
      <ambientLight intensity={ambient} color="#1a1a2e" />

      {/* Preset Lights */}
      {lights.map((light, index) => {
        switch (light.type) {
          case "uv":
            if (light.pattern) {
              return (
                <DynamicUVLight
                  key={index}
                  position={light.position}
                  intensity={light.intensity || 1.5}
                  pattern={light.pattern}
                  speed={light.speed || 1}
                />
              );
            } else {
              return (
                <UVSpotlight
                  key={index}
                  position={light.position}
                  intensity={light.intensity || 1.5}
                  enableBreathing={light.breathing || false}
                  breathingSpeed={light.breathingSpeed || 2}
                />
              );
            }

          case "rgb":
            return (
              <RGBAccentLight
                key={index}
                position={light.position}
                colors={light.colors || ["#FF10F0", "#00D4FF", "#39FF14"]}
                intensity={light.intensity || 1.0}
                transitionSpeed={light.transitionSpeed || 2.0}
              />
            );

          case "movingHead":
            return (
              <MovingHeadLight
                key={index}
                position={light.position}
                pattern={light.pattern || "circle"}
                speed={light.speed || 1.0}
                intensity={light.intensity || 2.0}
              />
            );

          case "beam":
            return (
              <VolumetricBeam
                key={index}
                position={light.position}
                target={light.target || [0, 0, 0]}
                color={light.color || "#00D4FF"}
                intensity={light.intensity || 1.5}
              />
            );

          default:
            return null;
        }
      })}

      {/* Rim Light для силуэтов */}
      <directionalLight
        position={[0, 5, -10]}
        intensity={0.3}
        color="#4a90e2"
      />
    </group>
  );
}

// Hook для динамического управления освещением
export function useStageLighting(initialPreset = "gallery") {
  const currentPreset = useRef(initialPreset);

  const setPreset = (presetName) => {
    if (LIGHTING_PRESETS[presetName]) {
      currentPreset.current = presetName;
    }
  };

  const fadeToPreset = (presetName, duration = 2000) => {
    // TODO: Плавный переход между preset'ами
    setTimeout(() => setPreset(presetName), duration);
  };

  return {
    currentPreset: currentPreset.current,
    setPreset,
    fadeToPreset,
  };
}
