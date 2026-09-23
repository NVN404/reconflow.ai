/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0d14",
          surface: "#111726",
          border: "#1e293b",
          primary: "#0284c7",
          neon: "#38bdf8",
          critical: "#ef4444",
          high: "#f97316",
          medium: "#f59e0b",
          low: "#3b82f6",
          info: "#64748b",
          success: "#10b981",
        },
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-red": "glowRed 2s ease-in-out infinite alternate",
        "glow-blue": "glowBlue 2.5s ease-in-out infinite alternate",
      },
      keyframes: {
        glowRed: {
          "0%": { boxShadow: "0 0 5px rgba(239, 68, 68, 0.4), inset 0 0 5px rgba(239, 68, 68, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.8), inset 0 0 10px rgba(239, 68, 68, 0.4)" },
        },
        glowBlue: {
          "0%": { boxShadow: "0 0 5px rgba(56, 189, 248, 0.4)" },
          "100%": { boxShadow: "0 0 18px rgba(56, 189, 248, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
