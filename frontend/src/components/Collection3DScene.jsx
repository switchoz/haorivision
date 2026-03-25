import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

const HaoriModel = ({ color, isUVMode }) => {
  const matProps = {
    color: isUVMode ? color : "#1a1a2e",
    emissive: isUVMode ? color : "#000000",
    emissiveIntensity: isUVMode ? 0.6 : 0,
    roughness: 0.4,
    metalness: 0.1,
  };

  return (
    <group rotation={[0.1, 0.5, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 2.8, 0.08]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[-1.3, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.0, 1.6, 0.06]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[1.3, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.0, 1.6, 0.06]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[0, 1.5, 0.05]}>
        <boxGeometry args={[0.6, 0.3, 0.1]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.3} />
      </mesh>
    </group>
  );
};

export default function Collection3DScene({ color, isUVMode }) {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight
        position={[10, 10, 10]}
        intensity={isUVMode ? 2 : 1}
        color={color}
      />
      <HaoriModel color={color} isUVMode={isUVMode} />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
}
