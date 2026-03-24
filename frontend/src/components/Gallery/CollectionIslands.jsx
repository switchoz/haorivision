import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 🏝️ COLLECTION ISLANDS
 *
 * Каждая коллекция = отдельный "остров" с уникальной палитрой,
 * материалами и атмосферой
 */

// Палитры материалов для коллекций из collections.json
export const COLLECTION_PALETTES = {
  mycelium_dreams: {
    name: "Mycelium Dreams",
    daylight: {
      primary: "#000000", // Чёрная основа
      secondary: "#2A2A2A", // Серый
      accent: "#F5F5F5", // Белые линии
    },
    uvLight: {
      primary: "#00FF87", // Зелёный мицелий
      secondary: "#00D9FF", // Cyan каналы
      accent: "#B026FF", // Фиолетовые узлы
      glow: "#7FFF00", // Яркие точки
    },
    atmosphere: {
      fog: "#0a1a0a",
      ambient: "#1a2a1a",
    },
    quote: "Сеть невидимого. Корни света.",
    emotion: "organic", // organic, cosmic, electric
    pattern: "network", // network, bloom, calligraphy
  },

  void_bloom: {
    name: "Void Bloom",
    daylight: {
      primary: "#000000", // Абсолютная пустота
      secondary: "#000000",
      accent: "#000000",
    },
    uvLight: {
      primary: "#FF1493", // Розовые цветы
      secondary: "#FF6EC7", // Светло-розовый
      accent: "#00BFFF", // Голубые акценты
      glow: "#DA70D6", // Пурпурное свечение
    },
    atmosphere: {
      fog: "#050010",
      ambient: "#0a0020",
    },
    quote: "Из пустоты рождается цветение.",
    emotion: "cosmic",
    pattern: "bloom",
  },

  neon_ancestors: {
    name: "Neon Ancestors",
    daylight: {
      primary: "#1A1A4D", // Тёмно-синий
      secondary: "#000000", // Чёрная каллиграфия
      accent: "#2A2A5D",
    },
    uvLight: {
      primary: "#FF10F0", // Неоново-розовый
      secondary: "#39FF14", // Кислотно-зелёный
      accent: "#00D4FF", // Электрик-синий
      glow: "#FF6600", // Оранжевый
    },
    atmosphere: {
      fog: "#0a0a20",
      ambient: "#1a1a3a",
    },
    quote: "Традиция, написанная светом будущего.",
    emotion: "electric",
    pattern: "calligraphy",
  },
};

// Shader для UV-reactive материала острова
const islandVertexShader = `
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

const islandFragmentShader = `
  uniform vec3 uDaylightColor;
  uniform vec3 uUVColor1;
  uniform vec3 uUVColor2;
  uniform vec3 uUVAccent;
  uniform float uTime;
  uniform float uUVIntensity;
  uniform float uPattern; // 0=network, 1=bloom, 2=calligraphy

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simplex Noise (сокращённая версия)
  float snoise(vec3 v) {
    // Упрощённая версия для производительности
    return fract(sin(dot(v, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  // Network pattern (Mycelium Dreams)
  float networkPattern(vec3 pos, float time) {
    float n1 = snoise(pos * 3.0 + vec3(time * 0.1));
    float n2 = snoise(pos * 6.0 + vec3(-time * 0.15));
    return n1 * n2;
  }

  // Bloom pattern (Void Bloom)
  float bloomPattern(vec2 uv, float time) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);

    float petals = sin(angle * 5.0 + time * 0.5) * 0.3 + 0.7;
    float bloom = smoothstep(0.5, 0.0, dist * petals);

    return bloom;
  }

  // Calligraphy pattern (Neon Ancestors)
  float calligraphyPattern(vec2 uv, float time) {
    float stroke = smoothstep(0.48, 0.52, abs(sin(uv.x * 10.0 + time)));
    stroke *= smoothstep(0.48, 0.52, abs(cos(uv.y * 8.0 - time * 0.5)));
    return stroke;
  }

  void main() {
    vec3 color = uDaylightColor;

    // Выбор паттерна
    float pattern;
    if (uPattern < 0.5) {
      // Network
      pattern = networkPattern(vPosition, uTime);
    } else if (uPattern < 1.5) {
      // Bloom
      pattern = bloomPattern(vUv, uTime);
    } else {
      // Calligraphy
      pattern = calligraphyPattern(vUv, uTime);
    }

    // UV colors
    vec3 uvColor = mix(uUVColor1, uUVColor2, pattern);
    uvColor = mix(uvColor, uUVAccent, pattern * 0.3);

    // Смешивание daylight и UV
    color = mix(color, uvColor, uUVIntensity * pattern);

    // Fresnel glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    color += uUVAccent * fresnel * uUVIntensity * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`;

class CollectionIslandMaterial extends THREE.ShaderMaterial {
  constructor(palette) {
    super({
      vertexShader: islandVertexShader,
      fragmentShader: islandFragmentShader,
      uniforms: {
        uDaylightColor: { value: new THREE.Color(palette.daylight.primary) },
        uUVColor1: { value: new THREE.Color(palette.uvLight.primary) },
        uUVColor2: { value: new THREE.Color(palette.uvLight.secondary) },
        uUVAccent: { value: new THREE.Color(palette.uvLight.accent) },
        uTime: { value: 0 },
        uUVIntensity: { value: 0.8 }, // 0 = daylight only, 1 = full UV
        uPattern: {
          value:
            palette.pattern === "network"
              ? 0
              : palette.pattern === "bloom"
                ? 1
                : 2,
        },
      },
      side: THREE.DoubleSide,
    });
  }
}

extend({ CollectionIslandMaterial });

// Компонент: Остров коллекции
export function CollectionIsland({
  collection = "mycelium_dreams",
  position = [0, 0, 0],
  radius = 3,
  height = 0.3,
  uvIntensity = 0.8,
}) {
  const materialRef = useRef();
  const meshRef = useRef();

  const palette =
    COLLECTION_PALETTES[collection] || COLLECTION_PALETTES.mycelium_dreams;

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uUVIntensity.value = uvIntensity;
    }

    // Лёгкое дыхание острова
    if (meshRef.current) {
      const breath = Math.sin(clock.elapsedTime * 0.5) * 0.05;
      meshRef.current.position.y = position[1] + breath;
    }
  });

  return (
    <group position={position}>
      {/* Платформа острова */}
      <mesh ref={meshRef} receiveShadow castShadow>
        <cylinderGeometry args={[radius, radius * 0.9, height, 32]} />
        <collectionIslandMaterial
          ref={materialRef}
          uniforms-uDaylightColor-value={
            new THREE.Color(palette.daylight.primary)
          }
          uniforms-uUVColor1-value={new THREE.Color(palette.uvLight.primary)}
          uniforms-uUVColor2-value={new THREE.Color(palette.uvLight.secondary)}
          uniforms-uUVAccent-value={new THREE.Color(palette.uvLight.accent)}
        />
      </mesh>

      {/* Ambient fog для атмосферы */}
      <pointLight
        position={[0, 1, 0]}
        color={palette.atmosphere.ambient}
        intensity={0.5}
        distance={radius * 2}
      />

      {/* UV accent light */}
      <pointLight
        position={[0, 2, 0]}
        color={palette.uvLight.primary}
        intensity={uvIntensity * 2}
        distance={radius * 1.5}
      />
    </group>
  );
}

// Компонент: Цитата коллекции (парящий текст)
export function CollectionQuote({
  collection = "mycelium_dreams",
  position = [0, 2, 0],
}) {
  const palette =
    COLLECTION_PALETTES[collection] || COLLECTION_PALETTES.mycelium_dreams;

  return (
    <mesh position={position}>
      <planeGeometry args={[4, 1]} />
      <meshBasicMaterial
        color={palette.uvLight.accent}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
      {/* TODO: Добавить текст через troika-three-text или HTML overlay */}
    </mesh>
  );
}

// Manager: Расположение островов в пространстве
export default function CollectionIslandsManager({
  collections = [],
  uvIntensity = 0.8,
}) {
  const collectionKeys = Object.keys(COLLECTION_PALETTES);

  // Расположение островов по кругу
  const islandPositions = useMemo(() => {
    const positions = [];
    const radius = 10;
    const angleStep = (Math.PI * 2) / collectionKeys.length;

    collectionKeys.forEach((key, index) => {
      const angle = angleStep * index;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push({ collection: key, position: [x, 0, z] });
    });

    return positions;
  }, [collectionKeys]);

  return (
    <group>
      {islandPositions.map(({ collection, position }) => (
        <group key={collection}>
          <CollectionIsland
            collection={collection}
            position={position}
            uvIntensity={uvIntensity}
          />

          {/* Название коллекции над островом */}
          <CollectionQuote
            collection={collection}
            position={[position[0], position[1] + 3, position[2]]}
          />
        </group>
      ))}

      {/* Центральная платформа */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[15, 15, 0.1, 64]} />
        <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Hook для динамического управления UV intensity
export function useCollectionUVControl(initialIntensity = 0.8) {
  const intensityRef = useRef(initialIntensity);

  const fadeToUV = (targetIntensity, duration = 2000) => {
    const startIntensity = intensityRef.current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      intensityRef.current =
        startIntensity + (targetIntensity - startIntensity) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return {
    uvIntensity: intensityRef.current,
    fadeToUV,
    setUVIntensity: (value) => {
      intensityRef.current = value;
    },
  };
}

// Экспорт палитр для использования в других компонентах
export { COLLECTION_PALETTES };
