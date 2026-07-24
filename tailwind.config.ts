import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        felt: {
          950: "#0a0a0d",
          900: "#111114",
          800: "#1a1a1f",
          700: "#26262d",
          600: "#38383f",
        },
        accent: {
          DEFAULT: "#e3283a",
          dim: "#7a1420",
          bright: "#ff4757",
        },
        gold: {
          DEFAULT: "#f2c14e",
          dim: "#8a6d1f",
        },
        win: "#2fbf71",
        lose: "#6b7280",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
