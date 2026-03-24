import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

// AR Preview Component (KAWS-style)
const ARPreview = ({ product }) => {
  const [isARActive, setIsARActive] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // AR experience URL (would be actual AR link in production)
  const arURL = `https://haori-vision.com/ar/${product.id}`;

  return (
    <div className="relative">
      {/* AR Trigger Button */}
      <motion.button
        onClick={() => setIsARActive(!isARActive)}
        className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold uppercase tracking-wider overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          View in AR
        </span>

        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
          initial={{ x: "-100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* AR Overlay */}
      <AnimatePresence>
        {isARActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8"
            onClick={() => setIsARActive(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsARActive(false)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* AR Content */}
              <div className="bg-zinc-900 border border-purple-500/30 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: AR Instructions */}
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      Experience in Augmented Reality
                    </h3>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                      See {product.name} in your space before you buy. View the
                      UV transformation in real-time.
                    </p>

                    {/* Instructions */}
                    <div className="space-y-4 mb-8">
                      {[
                        { step: "01", text: "Scan QR code with your phone" },
                        { step: "02", text: "Point camera at a flat surface" },
                        {
                          step: "03",
                          text: "Toggle UV mode to see transformation",
                        },
                        { step: "04", text: "Take photos & share" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <p className="text-zinc-300 pt-1">{item.text}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Supported Devices */}
                    <div className="bg-zinc-800/50 p-4 border border-zinc-700">
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                        Supported Devices
                      </p>
                      <p className="text-sm text-zinc-400">
                        iOS 12+, ARKit compatible • Android 8+, ARCore
                        compatible
                      </p>
                    </div>
                  </div>

                  {/* Right: QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      className="bg-white p-6 rounded-lg"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(176, 38, 255, 0)",
                          "0 0 40px rgba(176, 38, 255, 0.6)",
                          "0 0 0px rgba(176, 38, 255, 0)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <QRCodeSVG
                        value={arURL}
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </motion.div>

                    <p className="text-white font-semibold mt-4 mb-2">
                      Scan to View in AR
                    </p>
                    <p className="text-sm text-zinc-500 text-center max-w-xs">
                      Or visit on mobile: <br />
                      <span className="text-purple-400">{arURL}</span>
                    </p>

                    {/* AR Preview Placeholder */}
                    <motion.div
                      className="mt-6 w-full h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg flex items-center justify-center"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-2">📱</div>
                        <p className="text-xs text-purple-400 uppercase tracking-wider">
                          AR Preview
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Bottom Feature Bar */}
                <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Photo Mode
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                      360° Rotation
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      UV Toggle
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-2 bg-purple-600 text-white text-sm font-bold uppercase tracking-wider"
                  >
                    Share AR
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ARPreview;
