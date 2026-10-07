"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check initial preference from localStorage or default to dark
    const savedTheme = localStorage.getItem("reconflow_theme") as Theme | null;
    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    setThemeState(initialTheme);
    applyThemeClass(initialTheme);
    setMounted(true);
  }, []);

  const applyThemeClass = (targetTheme: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (targetTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      // Dispatch custom event for canvas/listeners
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: targetTheme } }));
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("reconflow_theme", newTheme);
      applyThemeClass(newTheme);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      theme: "dark",
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};
