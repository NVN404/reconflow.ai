/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent — restrained lime signal
        lime: {
          DEFAULT: "#B7E36A",
          hover: "#D9F5A5",
          50: "#f6fde8",
          100: "#eafad1",
          200: "#d5f4a4",
          300: "#B7E36A",
          400: "#D9F5A5",
          500: "#a3d452",
          600: "#82b83a",
          700: "#62912c",
          800: "#4e7224",
          900: "#3c571e",
          950: "#1e2f0d",
        },
        // True neutral blacks — cooler than zinc
        obsidian: {
          50: "#F7F7F5",
          100: "#E8E8E6",
          200: "#D0D0CE",
          300: "#A0A09C",
          400: "#6F6F6B",
          500: "#4A4A47",
          600: "#383838",
          700: "#292929",
          800: "#1C1C1C",
          850: "#141414",
          900: "#111111",
          925: "#0B0B0B",
          950: "#080808",
          975: "#050505",
        },

        // ─── Semantic surface aliases (dark-mode static) ───────────────
        // These map component class names to the design system hex values.

        // Backgrounds
        background: "#050505",
        surface: {
          DEFAULT: "#080808",
          elevated: "#0B0B0B",
          hover: "#111111",
          card: "#0B0B0B",
        },

        // Text
        foreground: {
          DEFAULT: "#F7F7F5",
          secondary: "#A0A09C",
          muted: "#6F6F6B",
        },

        // Borders
        border: {
          DEFAULT: "#292929",
          strong: "#383838",
        },
      },
    },
  },
  plugins: [],
};
