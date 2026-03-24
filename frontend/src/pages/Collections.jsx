import PageMeta from "../components/PageMeta";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useTheme } from "../contexts/ThemeContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import collectionsData from "../data/collections.json";

// 3D Haori Model — стилизованная форма хаори (рукава + тело)
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
      {/* Тело хаори */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 2.8, 0.08]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Левый рукав */}
      <mesh position={[-1.3, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.0, 1.6, 0.06]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Правый рукав */}
      <mesh position={[1.3, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.0, 1.6, 0.06]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Воротник */}
      <mesh position={[0, 1.5, 0.05]}>
        <boxGeometry args={[0.6, 0.3, 0.1]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.3} />
      </mesh>
    </group>
  );
};

const Collections = () => {
  const { isUVMode } = useTheme();
  const [selectedCollection, setSelectedCollection] = useState(0);

  const collections = collectionsData.collections;
  const currentCollection = collections[selectedCollection];

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Коллекции"
        description="Коллекции HAORI VISION — UV-арт хаори с 3D-визуализацией. Лимитированные серии ручной работы."
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className={`text-5xl md:text-7xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Коллекции
          </h1>
          <p className="text-xl text-zinc-400">
            Каждая коллекция — это уникальное видение света, превращённое в
            носимое искусство
          </p>
        </motion.div>

        {/* Collection Selector */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {collections.map((col, index) => (
            <motion.button
              key={col.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCollection(index)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCollection === index
                  ? isUVMode
                    ? "bg-uv-pink text-white"
                    : "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {col.name}
            </motion.button>
          ))}
        </div>

        {/* 3D Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* 3D Model */}
          <motion.div
            key={currentCollection.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-[500px] rounded-lg overflow-hidden bg-zinc-900"
          >
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              <ambientLight intensity={0.5} />
              <pointLight
                position={[10, 10, 10]}
                intensity={isUVMode ? 2 : 1}
                color={currentCollection.color}
              />
              <HaoriModel color={currentCollection.color} isUVMode={isUVMode} />
              <OrbitControls
                enableZoom={false}
                autoRotate
                autoRotateSpeed={2}
              />
            </Canvas>
          </motion.div>

          {/* Collection Details */}
          <motion.div
            key={currentCollection.id + "_details"}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                  currentCollection.status === "available"
                    ? "bg-green-500/20 text-green-400"
                    : currentCollection.status === "upcoming"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : currentCollection.status === "sold-out"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {currentCollection.status === "available"
                  ? "В наличии"
                  : currentCollection.status === "upcoming"
                    ? "Скоро"
                    : currentCollection.status === "sold-out"
                      ? "Продано"
                      : currentCollection.status}
              </span>
            </div>

            <h2
              className={`text-4xl font-display font-bold mb-4 ${
                isUVMode ? "text-glow-pink" : "text-white"
              }`}
            >
              {currentCollection.name}
            </h2>

            <p
              className={`text-xl mb-6 italic ${
                isUVMode ? "text-uv-cyan" : "text-zinc-300"
              }`}
            >
              "{currentCollection.tagline}"
            </p>

            <p className="text-zinc-400 mb-8 leading-relaxed">
              {currentCollection.description}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Лимитированная Серия</span>
                <span className="text-white font-semibold">
                  {currentCollection.editions.remaining}/
                  {currentCollection.editions.total} доступно
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">
                  Цена набора (Хаори + Холст)
                </span>
                <span className="text-white font-semibold text-2xl">
                  ${currentCollection.priceBundle.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Только Хаори</span>
                <span className="text-zinc-400">
                  ${currentCollection.priceHaori.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Только Холст</span>
                <span className="text-zinc-400">
                  ${currentCollection.priceCanvas.toLocaleString()}
                </span>
              </div>
            </div>

            {/* UV Color Palette */}
            <div className="mb-8">
              <p className="text-zinc-400 mb-3">Цвета УФ-Света</p>
              <div className="flex gap-3">
                {currentCollection.uvColors.map((color, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-12 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: isUVMode ? `0 0 20px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {currentCollection.status === "available" ? (
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-gradient px-8 py-4 rounded-full text-white font-semibold w-full"
                >
                  Посмотреть в Магазине
                </motion.button>
              </Link>
            ) : currentCollection.status === "sold-out" ? (
              <motion.button
                disabled
                className="bg-zinc-800 text-zinc-600 px-8 py-4 rounded-full font-semibold w-full cursor-not-allowed"
              >
                Продано
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-4 rounded-full font-semibold w-full transition-colors"
              >
                Уведомить Меня
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Collection Grid Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24"
        >
          <h3 className="text-3xl font-display font-bold mb-8 text-center text-white">
            Все Коллекции
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                whileHover={{ scale: 1.05, y: -10 }}
                onClick={() => setSelectedCollection(i)}
                className="cursor-pointer card-uv"
              >
                <div className="h-64 mb-4 rounded-lg bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle, ${col.color} 0%, transparent 70%)`,
                    }}
                  />
                  <h4 className="text-2xl font-display font-bold text-white relative z-10">
                    {col.name}
                  </h4>
                </div>
                <p className="text-zinc-400 text-sm mb-2">{col.tagline}</p>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">
                    {col.editions.total} изданий
                  </span>
                  <span className="text-white font-semibold">
                    ${col.priceBundle.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      col.status === "available"
                        ? "bg-green-500/20 text-green-400"
                        : col.status === "sold-out"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {col.status === "available"
                      ? "В наличии"
                      : col.status === "sold-out"
                        ? "Продано"
                        : "Скоро"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Collections;
