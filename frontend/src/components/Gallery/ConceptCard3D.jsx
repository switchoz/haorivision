import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * 🎴 3D CONCEPT CARD
 *
 * Интерактивная 3D-карточка концепта с дышащим UV-свечением
 */
export default function ConceptCard3D({
  concept,
  index,
  total,
  onClick,
  isSelected,
}) {
  const groupRef = useRef();
  const glowRef = useRef();

  // Circular position calculation
  const position = useMemo(() => {
    const radius = 6;
    const angle = (index / total) * Math.PI * 2;
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
  }, [index, total]);

  // Rotation to face center
  const rotation = useMemo(() => {
    const angle = (index / total) * Math.PI * 2;
    return [0, -angle + Math.PI / 2, 0];
  }, [index, total]);

  // Breathing animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;

      // Floating animation
      groupRef.current.position.y = position[1] + Math.sin(time + index) * 0.1;

      // Slight rotation
      groupRef.current.rotation.y =
        rotation[1] + Math.sin(time * 0.5 + index) * 0.05;

      // Scale pulse when selected
      if (isSelected) {
        const scale = 1 + Math.sin(time * 3) * 0.05;
        groupRef.current.scale.setScalar(scale);
      } else {
        groupRef.current.scale.setScalar(1);
      }
    }

    // Glow breathing
    if (glowRef.current) {
      const time = state.clock.elapsedTime;
      const intensity = 0.5 + Math.sin(time * 2 + index) * 0.3;
      glowRef.current.intensity = intensity;
    }
  });

  // Get primary color from concept palette
  const primaryColor =
    concept.palette?.primary || concept.palette?.colors?.[0] || "#FF10F0";

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Main Card */}
      <RoundedBox args={[2, 2.8, 0.1]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
          emissive={primaryColor}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
        />
      </RoundedBox>

      {/* Glowing Border */}
      <RoundedBox
        args={[2.1, 2.9, 0.05]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, -0.05]}
      >
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
          transparent
          opacity={0.6}
        />
      </RoundedBox>

      {/* Concept Name */}
      <Text
        position={[0, 0.8, 0.06]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        font="/fonts/helvetica-bold.woff"
      >
        {concept.name}
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, 0.5, 0.06]}
        fontSize={0.08}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {concept.subtitle}
      </Text>

      {/* Color Palette Preview */}
      <group position={[0, -0.2, 0.06]}>
        {concept.palette?.colors?.slice(0, 4).map((color, i) => (
          <mesh key={i} position={[(i - 1.5) * 0.3, 0, 0]}>
            <circleGeometry args={[0.1, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Quote (shortened) */}
      <Text
        position={[0, -0.7, 0.06]}
        fontSize={0.07}
        color="#39FF14"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
        font="/fonts/helvetica-oblique.woff"
        italic
      >
        "{concept.quote?.substring(0, 50)}..."
      </Text>

      {/* Point Light for UV glow */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 0.5]}
        color={primaryColor}
        intensity={0.5}
        distance={3}
      />

      {/* Hover effect */}
      {isSelected && (
        <>
          {/* Selection ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
            <ringGeometry args={[1.2, 1.4, 64]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.5} />
          </mesh>

          {/* Vertical light beam */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 6, 32]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}
