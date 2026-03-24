/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // UV Mode colors
        uv: {
          pink: "#FF10F0",
          green: "#39FF14",
          cyan: "#00D4FF",
          purple: "#B026FF",
          orange: "#FF6600",
        },
        // Daylight mode colors
        daylight: {
          black: "#000000",
          gray: "#2A2A2A",
          white: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
        japanese: ["Noto Sans JP", "sans-serif"],
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        "glow-intense": "glowIntense 1.5s ease-in-out infinite alternate",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-luxury": "pulseLuxury 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-fast": "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "rotate-glow": "rotateGlow 4s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": {
            textShadow:
              "0 0 10px rgba(255, 16, 240, 0.5), 0 0 20px rgba(255, 16, 240, 0.3)",
          },
          "100%": {
            textShadow:
              "0 0 20px rgba(255, 16, 240, 0.8), 0 0 40px rgba(255, 16, 240, 0.5), 0 0 60px rgba(255, 16, 240, 0.3)",
          },
        },
        glowIntense: {
          "0%": {
            boxShadow:
              "0 0 20px rgba(255, 16, 240, 0.6), 0 0 40px rgba(57, 255, 20, 0.4), inset 0 0 20px rgba(255, 16, 240, 0.2)",
          },
          "100%": {
            boxShadow:
              "0 0 40px rgba(255, 16, 240, 0.9), 0 0 80px rgba(57, 255, 20, 0.6), inset 0 0 40px rgba(255, 16, 240, 0.4)",
          },
        },
        pulseLuxury: {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.85",
            transform: "scale(1.02)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        slideUp: {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        slideDown: {
          "0%": {
            transform: "translateY(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        scaleIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        rotateGlow: {
          "0%": {
            transform: "rotate(0deg)",
            filter: "hue-rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
            filter: "hue-rotate(360deg)",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
