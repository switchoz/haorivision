import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem("hv_visited");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("hv_visited", "1");
      } catch {}
      setShow(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 bg-black flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-9xl md:text-[12rem] text-zinc-600 mb-6"
              style={{ fontFamily: "serif" }}
            >
              光
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-black tracking-tight text-white"
            >
              HAORI VISION
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
