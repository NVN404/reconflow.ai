"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before mount, default to dark state
  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={`group relative flex items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 cursor-pointer active:scale-95 ${
        isDark
          ? "bg-[#111111] hover:bg-[#181818] border-zinc-800 text-zinc-300 hover:text-amber-300 hover:border-zinc-700 shadow-sm"
          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-slate-300 shadow-sm"
      } ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-mono font-medium">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
};
