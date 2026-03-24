import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

// Dior-inspired Split Screen Hero with Mouse Parallax
const SplitScreenHero = () => {
  const { isUVMode } = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Parallax transforms
  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);

      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Split Screen Container */}
      <div className="flex h-full">
        {/* LEFT SIDE: Daylight */}
        <motion.div
          className="relative w-1/2 h-full overflow-hidden"
          style={{
            rotateY,
            rotateX,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Background Video/Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
            {/* Background animation */}
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={isHovering ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1558769132-cb1aea672c70?w=800&h=1200&fit=crop)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-6">
                При Дневном Свете
              </p>
              <h2 className="text-6xl font-black text-white mb-6 leading-tight">
                Скрытое
                <br />
                Молчание
                <br />
                Тайна
              </h2>
              <p className="text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
                Чёрный шёлк. Невидимые узоры. Свет ждёт под поверхностью.
              </p>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-1/4 right-12 w-32 h-32 border border-zinc-700 opacity-20"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Bottom Label */}
          <div className="absolute bottom-12 left-12">
            <p className="text-xs uppercase tracking-widest text-zinc-600">
              01 — Дневной Режим
            </p>
          </div>
        </motion.div>

        {/* DIVIDER LINE */}
        <motion.div
          className="w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent"
          animate={{
            opacity: isHovering ? 1 : 0.3,
          }}
        />

        {/* RIGHT SIDE: UV */}
        <motion.div
          className="relative w-1/2 h-full overflow-hidden"
          style={{
            rotateY: useTransform(rotateY, (val) => -val),
            rotateX,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Background Video/Image with UV Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-pink-950">
            <motion.div
              className="absolute inset-0"
              animate={isHovering ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&h=1200&fit=crop)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: isUVMode ? 0.5 : 0.2,
              }}
            />

            {/* UV Glow Overlay */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 30% 40%, rgba(176, 38, 255, 0.4) 0%, transparent 60%)",
                  "radial-gradient(circle at 70% 60%, rgba(255, 16, 240, 0.4) 0%, transparent 60%)",
                  "radial-gradient(circle at 30% 40%, rgba(176, 38, 255, 0.4) 0%, transparent 60%)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-purple-400 mb-6">
                Под УФ Светом
              </p>
              <h2
                className="text-6xl font-black text-white mb-6 leading-tight"
                style={{
                  textShadow: isUVMode
                    ? "0 0 40px rgba(176, 38, 255, 0.8), 0 0 80px rgba(255, 16, 240, 0.6)"
                    : "none",
                }}
              >
                Раскрытое
                <br />
                Взрыв
                <br />
                Энергия
              </h2>
              <p className="text-lg text-purple-300 max-w-md mx-auto leading-relaxed">
                Флуоресцентный взрыв. Неоновые узоры проявляются. Скрытый свет
                становится видимой реальностью.
              </p>
            </motion.div>

            {/* Animated UV Symbols */}
            <motion.div
              className="absolute top-1/3 left-12"
              animate={{
                rotate: [0, -360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle
                  cx="30"
                  cy="30"
                  r="25"
                  stroke="#B026FF"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <circle
                  cx="30"
                  cy="30"
                  r="15"
                  stroke="#FF10F0"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <circle cx="30" cy="30" r="5" fill="#00D4FF" opacity="0.9" />
              </svg>
            </motion.div>
          </div>

          {/* Bottom Label */}
          <div className="absolute bottom-12 right-12">
            <p className="text-xs uppercase tracking-widest text-purple-500">
              02 — UV Режим
            </p>
          </div>
        </motion.div>
      </div>

      {/* Center Interactive Element */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
        animate={{
          scale: isHovering ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          {/* Outer Ring */}
          <motion.div
            className="w-40 h-40 border-2 border-white/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <p className="text-white text-xs uppercase tracking-widest">
                {isUVMode ? "UV" : "Свет"}
              </p>
            </div>
          </div>

          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            animate={{
              backgroundColor: isUVMode
                ? [
                    "rgba(176, 38, 255, 0.3)",
                    "rgba(255, 16, 240, 0.3)",
                    "rgba(176, 38, 255, 0.3)",
                  ]
                : [
                    "rgba(255, 255, 255, 0.1)",
                    "rgba(255, 255, 255, 0.2)",
                    "rgba(255, 255, 255, 0.1)",
                  ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Прокрути Чтобы Исследовать
          </p>
          <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1 h-2 bg-zinc-600 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplitScreenHero;
