import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useScroll, useTransform, motion } from "framer-motion";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { useTheme } from "../../contexts/ThemeContext";

// 3D Haori Model (placeholder - replace with actual GLTF)
function HaoriModel({ scrollProgress, isUVMode }) {
  const modelRef = useRef();
  const { nodes, materials } = useGLTF("/models/haori.glb", true);

  useFrame((state) => {
    if (!modelRef.current) return;

    // Rotate based on scroll
    modelRef.current.rotation.y = scrollProgress * Math.PI * 2;

    // Float animation
    modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });

  return (
    <group ref={modelRef}>
      {/* Fallback geometry if GLTF not loaded */}
      <mesh>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial
          color={isUVMode ? "#B026FF" : "#1a1a1a"}
          emissive={isUVMode ? "#B026FF" : "#000000"}
          emissiveIntensity={isUVMode ? 0.5 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* UV Patterns overlay (simulated) */}
      {isUVMode && (
        <>
          <mesh position={[0, 0.5, 0.16]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshBasicMaterial color="#39FF14" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, -0.5, 0.16]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshBasicMaterial color="#FF10F0" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Main Scroll-Triggered 3D Component
const Scroll3DProduct = ({ product }) => {
  const { isUVMode } = useTheme();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform scroll to rotation value
  const scrollValue = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen flex items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 px-8">
          {/* Left: 3D Canvas */}
          <motion.div
            className="relative h-[600px]"
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0, 0.3, 0.7, 1],
                [0, 1, 1, 0],
              ),
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.5} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.3}
                penumbra={1}
                intensity={isUVMode ? 2 : 1}
                color={isUVMode ? "#B026FF" : "#ffffff"}
              />
              <spotLight
                position={[-10, -10, 10]}
                angle={0.3}
                penumbra={1}
                intensity={isUVMode ? 1.5 : 0.5}
                color={isUVMode ? "#FF10F0" : "#ffffff"}
              />

              <HaoriModel
                scrollProgress={scrollValue.get()}
                isUVMode={isUVMode}
              />

              <Environment preset={isUVMode ? "night" : "studio"} />
              <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.5}
                scale={10}
                blur={2}
                far={4}
              />

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2}
              />
            </Canvas>

            {/* 3D Info Label */}
            <motion.div
              className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm px-6 py-3 border border-zinc-800"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                Взаимодействуй с 3D моделью
              </p>
              <p className="text-sm text-white">
                Прокрути чтобы вращать • Перетащи чтобы исследовать
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            className="flex flex-col justify-center"
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0, 0.3, 0.7, 1],
                [0, 1, 1, 0],
              ),
              y: useTransform(scrollYProgress, [0, 1], [100, -100]),
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-4">
                Двойной Набор Произведения
              </p>

              <h2
                className={`text-5xl font-black mb-6 ${
                  isUVMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                    : "text-white"
                }`}
              >
                {product.name}
              </h2>

              <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* UV Colors */}
              <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-3 uppercase tracking-wider">
                  Цвета УФ
                </p>
                <div className="flex gap-3">
                  {product.uvColors.map((color, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: color }}
                      whileHover={{ scale: 1.2 }}
                    />
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {[
                  "👘 Расписанное вручную шёлковое хаори",
                  "🖼️ Холст-компаньон (40×60см)",
                  "💡 Портативная УФ лампа в комплекте",
                  "✍️ Подпись художника LiZa",
                  "✍️ Подписано и пронумеровано художником",
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 text-zinc-400"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    <p className="text-sm">{feature}</p>
                  </motion.div>
                ))}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-4xl font-bold text-white">
                    ${product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                    Осталось {product.editions} изданий
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 font-bold uppercase tracking-wider transition-all ${
                    isUVMode
                      ? "bg-purple-600 text-white border-2 border-purple-400"
                      : "bg-white text-black"
                  }`}
                >
                  Зарезервировать
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Preload GLTF (optional)
useGLTF.preload("/models/haori.glb");

export default Scroll3DProduct;
