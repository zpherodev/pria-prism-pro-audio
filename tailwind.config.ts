
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        editor: {
          bg: "#222222",
          panel: "#2A2A2A",
          accent: "#3B82F6",
          slider: {
            track: "#1F2937",
            thumb: "#E5E7EB",
            range: "#3B82F6",
            border: "#4B5563",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "#9CA3AF",
          },
        },
      },
      backgroundImage: {
        "metallic": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
      },
      boxShadow: {
        "panel": "0 3px 6px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
