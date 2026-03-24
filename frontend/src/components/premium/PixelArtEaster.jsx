import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Murakami-inspired Pixel Art Easter Egg
const PixelArtEaster = () => {
  const [isFound, setIsFound] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showFlower, setShowFlower] = useState(false);

  // Secret click sequence to activate
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Secret code: "HIKARI" (H-I-K-A-R-I keys)
      const sequence = ["h", "i", "k", "a", "r", "i"];
      const userSequence = [...sequence]; // Track user input

      if (sequence[clickCount] === e.key.toLowerCase()) {
        setClickCount((prev) => prev + 1);

        if (clickCount === sequence.length - 1) {
          setIsFound(true);
          setShowFlower(true);
          setTimeout(() => setShowFlower(false), 5000);
          setClickCount(0);
        }
      } else {
        setClickCount(0);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [clickCount]);

  // Pixel Flower (Murakami-style)
  const PixelFlower = () => (
    <svg width="120" height="120" viewBox="0 0 12 12" className="pixelated">
      <defs>
        <filter id="pixelate">
          <feGaussianBlur stdDeviation="0" />
        </filter>
      </defs>
      {/* Center */}
      <rect x="5" y="5" width="2" height="2" fill="#FFD700" />
      {/* Petals - UV Colors */}
      <rect x="5" y="3" width="2" height="2" fill="#B026FF" /> {/* Top */}
      <rect x="7" y="5" width="2" height="2" fill="#FF10F0" /> {/* Right */}
      <rect x="5" y="7" width="2" height="2" fill="#00D4FF" /> {/* Bottom */}
      <rect x="3" y="5" width="2" height="2" fill="#39FF14" /> {/* Left */}
      {/* Diagonal Petals */}
      <rect x="7" y="3" width="2" height="2" fill="#FF6600" />
      <rect x="7" y="7" width="2" height="2" fill="#B026FF" />
      <rect x="3" y="7" width="2" height="2" fill="#FF10F0" />
      <rect x="3" y="3" width="2" height="2" fill="#00D4FF" />
      {/* Outer Ring */}
      <rect x="5" y="1" width="2" height="2" fill="#39FF14" opacity="0.6" />
      <rect x="9" y="5" width="2" height="2" fill="#FF6600" opacity="0.6" />
      <rect x="5" y="9" width="2" height="2" fill="#B026FF" opacity="0.6" />
      <rect x="1" y="5" width="2" height="2" fill="#FF10F0" opacity="0.6" />
    </svg>
  );

  // Pixel Art Animation Grid
  const PixelGrid = () => {
    const [animatedPixels, setAnimatedPixels] = useState([]);

    useEffect(() => {
      const interval = setInterval(() => {
        const newPixels = Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          color: ["#B026FF", "#FF10F0", "#00D4FF", "#39FF14", "#FF6600"][
            Math.floor(Math.random() * 5)
          ],
          size: Math.random() * 20 + 10,
        }));
        setAnimatedPixels(newPixels);
      }, 100);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {animatedPixels.map((pixel) => (
          <motion.div
            key={pixel.id}
            className="absolute pixelated"
            style={{
              left: pixel.x,
              top: pixel.y,
              width: pixel.size,
              height: pixel.size,
              backgroundColor: pixel.color,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.5] }}
            transition={{ duration: 1 }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Hidden Easter Egg Trigger (tiny, corner) */}
      <motion.div
        className="fixed bottom-4 right-4 w-8 h-8 cursor-pointer z-40"
        onClick={() => {
          setClickCount((prev) => prev + 1);
          if (clickCount >= 6) {
            setIsFound(true);
            setShowFlower(true);
            setTimeout(() => setShowFlower(false), 5000);
            setClickCount(0);
          }
        }}
        whileHover={{ scale: 1.2 }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 hover:opacity-30 transition-opacity" />
      </motion.div>

      {/* Pixel Flower Popup */}
      <AnimatePresence>
        {showFlower && (
          <>
            {/* Pixel Grid Animation */}
            <PixelGrid />

            {/* Center Flower */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="relative">
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 blur-xl"
                  animate={{
                    backgroundColor: [
                      "rgba(176, 38, 255, 0.5)",
                      "rgba(255, 16, 240, 0.5)",
                      "rgba(0, 212, 255, 0.5)",
                      "rgba(57, 255, 20, 0.5)",
                      "rgba(176, 38, 255, 0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Pixel Flower */}
                <motion.div
                  className="relative"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <PixelFlower />
                </motion.div>
              </div>

              {/* Message */}
              <motion.div
                className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-black/80 backdrop-blur-sm px-6 py-3 border border-purple-500">
                  <p className="text-white font-bold pixelated text-sm">
                    🌸 СЕКРЕТНЫЙ ЦВЕТОК ОТКРЫТ
                  </p>
                  <p className="text-purple-400 text-xs mt-1 pixelated">
                    MURAKAMI.HAORI ИЗДАНИЕ
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* 8-bit Sound Effect Indicator */}
            <motion.div
              className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-black/90 backdrop-blur-sm px-8 py-4 border border-purple-500">
                <p className="text-purple-400 font-mono text-sm">
                  ♪ ♫ ♪ SECRET.WAV ИГРАЕТ ♪ ♫ ♪
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hint (shows after first few clicks) */}
      <AnimatePresence>
        {clickCount > 0 && clickCount < 7 && (
          <motion.div
            className="fixed bottom-20 right-4 z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 border border-purple-500/50">
              <p className="text-xs text-purple-400 pixelated">
                {clickCount}/7 кликов... продолжай!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permanent Badge (after found once) */}
      {isFound && !showFlower && (
        <motion.div
          className="fixed bottom-16 right-4 z-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <motion.div
            className="w-12 h-12 cursor-pointer"
            onClick={() => setShowFlower(true)}
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <div className="pixelated">
              <PixelFlower />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CSS for pixelated effect */}
      <style jsx>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </>
  );
};

export default PixelArtEaster;
