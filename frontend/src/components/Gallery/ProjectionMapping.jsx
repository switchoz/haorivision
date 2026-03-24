import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 🎬 PROJECTION MAPPING SYSTEM
 *
 * Проекционный маппинг с shader эффектами для иммерсивного шоу
 * UV-reactive паттерны, калейдоскопы, глитч-эффекты
 */

// === UV REACTIVE SHADER ===
const uvReactiveVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const uvReactiveFragmentShader = `
  uniform vec3 uUVColor;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPulseSpeed;
  uniform sampler2D uTexture;
  uniform bool uUseTexture;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simplex Noise
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
    vec3 baseColor = uUVColor;

    // Пульсация
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;

    // UV паттерн с шумом
    vec3 noiseCoord = vPosition * 2.0 + vec3(uTime * 0.3, uTime * 0.2, 0.0);
    float noise = snoise(noiseCoord) * 0.5 + 0.5;

    // Волны
    float wave = sin(vUv.x * 10.0 + uTime * 2.0) * cos(vUv.y * 10.0 + uTime * 1.5) * 0.5 + 0.5;

    // Комбинируем эффекты
    float pattern = mix(noise, wave, 0.5);
    pattern *= pulse;

    vec3 color = baseColor * pattern * uIntensity;

    // Если используется текстура
    if (uUseTexture) {
      vec4 texColor = texture2D(uTexture, vUv);
      color = mix(color, texColor.rgb, texColor.a);
    }

    // Эффект свечения на краях
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    color += uUVColor * fresnel * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

class UVReactiveMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: uvReactiveVertexShader,
      fragmentShader: uvReactiveFragmentShader,
      uniforms: {
        uUVColor: { value: new THREE.Color("#FF10F0") },
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uPulseSpeed: { value: 2.0 },
        uTexture: { value: null },
        uUseTexture: { value: false },
      },
      side: THREE.DoubleSide,
    });
  }
}

extend({ UVReactiveMaterial });

// === KALEIDOSCOPE SHADER ===
const kaleidoscopeFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColors[3];
  uniform float uSegments;
  uniform float uRotationSpeed;

  varying vec2 vUv;

  const float PI = 3.14159265359;

  vec2 kaleidoscope(vec2 uv, float segments) {
    vec2 center = vec2(0.5);
    vec2 p = uv - center;

    float angle = atan(p.y, p.x);
    float radius = length(p);

    float segmentAngle = 2.0 * PI / segments;
    angle = mod(angle, segmentAngle);

    if (mod(floor(atan(p.y, p.x) / segmentAngle), 2.0) == 1.0) {
      angle = segmentAngle - angle;
    }

    return vec2(cos(angle), sin(angle)) * radius + center;
  }

  void main() {
    vec2 uv = kaleidoscope(vUv, uSegments);

    // Вращение
    float angle = uTime * uRotationSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    uv = (rotation * (uv - 0.5)) + 0.5;

    // Цветовой паттерн
    float dist = length(uv - 0.5);
    float pattern = sin(dist * 20.0 - uTime * 3.0) * 0.5 + 0.5;

    int colorIndex = int(mod(pattern * 3.0, 3.0));
    vec3 color = uColors[colorIndex];

    gl_FragColor = vec4(color * pattern, 1.0);
  }
`;

// === GLITCH EFFECT SHADER ===
const glitchFragmentShader = `
  uniform float uTime;
  uniform float uGlitchIntensity;
  uniform sampler2D uTexture;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    // Digital distortion
    float glitch = step(0.95, random(vec2(uTime, floor(uv.y * 10.0))));
    uv.x += (random(vec2(uTime)) - 0.5) * glitch * uGlitchIntensity * 0.1;

    // RGB split
    vec2 offsetR = vec2(0.01, 0.0) * uGlitchIntensity * glitch;
    vec2 offsetG = vec2(-0.01, 0.0) * uGlitchIntensity * glitch;

    float r = texture2D(uTexture, uv + offsetR).r;
    float g = texture2D(uTexture, uv + offsetG).g;
    float b = texture2D(uTexture, uv).b;

    vec3 color = vec3(r, g, b);

    // Scanlines
    float scanline = sin(uv.y * 800.0 + uTime * 10.0) * 0.05;
    color += scanline;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// React Component: UV Reactive Surface
export function UVReactiveSurface({
  position = [0, 0, 0],
  size = [10, 10],
  color = "#FF10F0",
  intensity = 1.0,
  pulseSpeed = 2.0,
}) {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <uvReactiveMaterial
        ref={materialRef}
        uniforms-uUVColor-value={new THREE.Color(color)}
        uniforms-uIntensity-value={intensity}
        uniforms-uPulseSpeed-value={pulseSpeed}
      />
    </mesh>
  );
}

// React Component: Kaleidoscope Projection
export function KaleidoscopeProjection({
  position = [0, 5, -5],
  rotation = [0, 0, 0],
  size = [8, 6],
  colors = ["#FF10F0", "#00D4FF", "#39FF14"],
  segments = 6,
  rotationSpeed = 0.5,
}) {
  const materialRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: uvReactiveVertexShader,
      fragmentShader: kaleidoscopeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1024, 1024) },
        uColors: { value: colors.map((c) => new THREE.Color(c)) },
        uSegments: { value: segments },
        uRotationSpeed: { value: rotationSpeed },
      },
      side: THREE.DoubleSide,
    });
  }, [colors, segments, rotationSpeed]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// React Component: Projection Screen с глитчем
export function GlitchProjection({
  position = [0, 3, -8],
  size = [10, 6],
  glitchIntensity = 0.5,
  texture = null,
}) {
  const materialRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: uvReactiveVertexShader,
      fragmentShader: glitchFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uGlitchIntensity: { value: glitchIntensity },
        uTexture: { value: texture },
      },
    });
  }, [glitchIntensity, texture]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// Projection Mapping Manager
export default function ProjectionMapping({ mode = "reactive", config = {} }) {
  switch (mode) {
    case "reactive":
      return <UVReactiveSurface {...config} />;

    case "kaleidoscope":
      return <KaleidoscopeProjection {...config} />;

    case "glitch":
      return <GlitchProjection {...config} />;

    case "multi":
      return (
        <group>
          <UVReactiveSurface position={[0, 0, 0]} size={[20, 20]} />
          <KaleidoscopeProjection position={[0, 5, -10]} />
        </group>
      );

    default:
      return null;
  }
}

// Projection Presets для разных сцен
export const PROJECTION_PRESETS = {
  opening: {
    mode: "reactive",
    config: {
      color: "#FF10F0",
      intensity: 0.5,
      pulseSpeed: 1.5,
    },
  },

  showcase: {
    mode: "kaleidoscope",
    config: {
      colors: ["#FF10F0", "#00D4FF", "#39FF14"],
      segments: 8,
      rotationSpeed: 0.8,
    },
  },

  finale: {
    mode: "multi",
    config: {},
  },

  glitchMode: {
    mode: "glitch",
    config: {
      glitchIntensity: 1.0,
    },
  },
};
