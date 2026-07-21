/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      colors: {
        violet: { DEFAULT: "#7c3aed", light: "#9f5ff5", dark: "#5b21b6" },
        cyan:   { DEFAULT: "#06b6d4", light: "#22d3ee" },
      },
      animation: {
        "gradient-shift": "gradient-shift 5s ease infinite",
        "float-orb": "float-orb 22s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.5s infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 12px rgba(124,58,237,0.2)" },
          "50%":     { boxShadow: "0 0 30px rgba(124,58,237,0.55)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
