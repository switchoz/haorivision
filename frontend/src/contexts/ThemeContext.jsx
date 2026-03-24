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

  useEffect(() => {
    // Apply theme class to document
    if (isUVMode) {
      document.documentElement.classList.add("uv-mode");
    } else {
      document.documentElement.classList.remove("uv-mode");
    }
  }, [isUVMode]);

  const toggleUVMode = () => {
    setIsUVMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isUVMode, toggleUVMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
