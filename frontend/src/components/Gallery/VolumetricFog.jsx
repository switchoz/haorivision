import { useRef, useMemo, useEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 🌫️ VOLUMETRIC FOG SHADER
 *
 * Объёмный туман с UV-свечением для атмосферного эффекта
 * Использует кастомный shader material
 */

// Vertex Shader
const vertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

// Fragment Shader с volumetric fog
const fragmentShader = `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uUVColor;
  uniform float uUVIntensity;
  uniform float uTime;
  uniform vec3 uCameraPosition;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  // Simplex Noise для органичного движения тумана
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Расстояние от камеры
    float distance = length(vWorldPosition - uCameraPosition);

    // Базовый туман
    float fogFactor = smoothstep(uFogNear, uFogFar, distance);
    fogFactor *= uFogDensity;

    // Добавляем шум для объёма
    vec3 noiseCoord = vWorldPosition * 0.1 + vec3(uTime * 0.05, uTime * 0.03, 0.0);
    float noise = snoise(noiseCoord) * 0.5 + 0.5;

    // Второй слой шума для детализации
    vec3 noiseCoord2 = vWorldPosition * 0.3 + vec3(uTime * 0.1, -uTime * 0.08, uTime * 0.05);
    float noise2 = snoise(noiseCoord2) * 0.3 + 0.5;

    // Комбинируем шумы
    float volumetricNoise = mix(noise, noise2, 0.5);

    // Применяем шум к туману
    fogFactor *= volumetricNoise;

    // UV-свечение (зависит от высоты)
    float uvGlow = smoothstep(0.0, 5.0, vWorldPosition.y) * uUVIntensity;
    vec3 glowColor = mix(uFogColor, uUVColor, uvGlow);

    // Финальный цвет
    vec3 finalColor = glowColor;

    // Прозрачность зависит от тумана
    float alpha = clamp(fogFactor, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Кастомный материал для тумана
class VolumetricFogMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uFogColor: { value: new THREE.Color("#000000") },
        uFogDensity: { value: 0.5 },
        uFogNear: { value: 5.0 },
        uFogFar: { value: 30.0 },
        uUVColor: { value: new THREE.Color("#FF10F0") },
        uUVIntensity: { value: 0.3 },
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}

// Регистрируем материал
extend({ VolumetricFogMaterial });

export default function VolumetricFog({
  color = "#000000",
  uvColor = "#FF10F0",
  density = 0.5,
  near = 5,
  far = 30,
  uvIntensity = 0.3,
  size = [50, 20, 50],
}) {
  const materialRef = useRef();
  const meshRef = useRef();

  // Обновляем время и камеру
  useFrame(({ clock, camera }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uCameraPosition.value.copy(camera.position);
    }
  });

  // Обновляем параметры при изменении пропсов
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uFogColor.value.set(color);
      materialRef.current.uniforms.uFogDensity.value = density;
      materialRef.current.uniforms.uFogNear.value = near;
      materialRef.current.uniforms.uFogFar.value = far;
      materialRef.current.uniforms.uUVColor.value.set(uvColor);
      materialRef.current.uniforms.uUVIntensity.value = uvIntensity;
    }
  }, [color, density, near, far, uvColor, uvIntensity]);

  return (
    <mesh ref={meshRef} position={[0, size[1] / 2, 0]}>
      <boxGeometry args={size} />
      <volumetricFogMaterial ref={materialRef} />
    </mesh>
  );
}

// Breathing Fog (дышащий туман для сценического эффекта)
export function BreathingFog({
  color = "#0a0a0a",
  uvColor = "#FF10F0",
  breathSpeed = 2.0,
  minDensity = 0.3,
  maxDensity = 0.7,
  ...props
}) {
  const [density, setDensity] = [0.5];

  useFrame(({ clock }) => {
    // Пульсация плотности тумана
    const breath = Math.sin(clock.elapsedTime * breathSpeed) * 0.5 + 0.5;
    const newDensity = minDensity + (maxDensity - minDensity) * breath;

    if (Math.abs(newDensity - density) > 0.01) {
      setDensity(newDensity);
    }
  });

  return (
    <VolumetricFog
      color={color}
      uvColor={uvColor}
      density={density}
      {...props}
    />
  );
}

// Multi-Layer Fog (многослойный туман для глубины)
export function MultiLayerFog({
  layers = 3,
  baseColor = "#000000",
  uvColors = ["#FF10F0", "#00D4FF", "#39FF14"],
  ...props
}) {
  return (
    <>
      {Array.from({ length: layers }).map((_, i) => (
        <VolumetricFog
          key={i}
          color={baseColor}
          uvColor={uvColors[i % uvColors.length]}
          density={0.3 + i * 0.1}
          near={5 + i * 3}
          far={25 + i * 5}
          uvIntensity={0.2 + i * 0.1}
          size={[50 - i * 5, 20 - i * 2, 50 - i * 5]}
          {...props}
        />
      ))}
    </>
  );
}
