import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Legacy: disabled for performance (modern browsers only)
    // legacy({ targets: ['Chrome >= 90', 'Firefox >= 88', 'Safari >= 14'] })
  ],
  server: {
    port: 3012,
    host: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:3010",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:3010",
        changeOrigin: true,
      },
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "lucide-react"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          stripe: ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          vendor: ["html2canvas", "qrcode.react"],
          charts: ["recharts"],
          tensorflow: ["@tensorflow/tfjs", "@tensorflow-models/pose-detection"],
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = "fonts";
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
    ],
    exclude: [
      "@tensorflow/tfjs",
      "@tensorflow-models/pose-detection",
      "@mediapipe/pose",
    ],
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
});
