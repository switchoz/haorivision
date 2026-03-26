import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isUVMode, setIsUVMode] = useState(false);
  const [uvIntensity, setUvIntensity] = useState(0);

  useEffect(() => {
    // Apply theme class to document
    if (isUVMode) {
      document.documentElement.classList.add("uv-mode");
    } else {
      document.documentElement.classList.remove("uv-mode");
    }
  }, [isUVMode]);

  // Sync CSS custom property with uvIntensity
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--uv-intensity",
      uvIntensity / 100,
    );
  }, [uvIntensity]);

  const toggleUVMode = () => {
    setIsUVMode((prev) => {
      const next = !prev;
      setUvIntensity(next ? 100 : 0);
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{ isUVMode, toggleUVMode, uvIntensity, setUvIntensity }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
