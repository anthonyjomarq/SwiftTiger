/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color Hunt Palette: https://colorhunt.co/palette/00809dfcecddff7601f3a26d
        primary: {
          50: "#e6f7fa",
          100: "#b3e8f2",
          200: "#80d9ea",
          300: "#4dcae2",
          400: "#1abada",
          500: "#00809d", // Main primary color
          600: "#006d85",
          700: "#005a6d",
          800: "#004755",
          900: "#00343d",
        },
        secondary: {
          50: "#fefbf8",
          100: "#fdf5e8",
          200: "#fcefd8",
          300: "#fbe9c8",
          400: "#fae3b8",
          500: "#fcecdd", // Main secondary color
          600: "#f5d8b8",
          700: "#eec493",
          800: "#e7b06e",
          900: "#e09c49",
        },
        accent: {
          50: "#fff4e6",
          100: "#ffe4b3",
          200: "#ffd480",
          300: "#ffc44d",
          400: "#ffb41a",
          500: "#ff7601", // Main accent color
          600: "#e66a01",
          700: "#cc5e01",
          800: "#b35201",
          900: "#994601",
        },
        warm: {
          50: "#fef8f4",
          100: "#fdeee3",
          200: "#fce4d2",
          300: "#fbdac1",
          400: "#fad0b0",
          500: "#f3a26d", // Main warm color
          600: "#e8945a",
          700: "#dd8647",
          800: "#d27834",
          900: "#c76a21",
        },
        // Semantic color mappings
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "bounce-gentle": "bounceGentle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        strong:
          "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)",
        primary: "0 4px 14px 0 rgba(0, 128, 157, 0.25)",
        accent: "0 4px 14px 0 rgba(255, 118, 1, 0.25)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00809d 0%, #006d85 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #fcecdd 0%, #f5d8b8 100%)",
        "gradient-accent": "linear-gradient(135deg, #ff7601 0%, #e66a01 100%)",
        "gradient-warm": "linear-gradient(135deg, #f3a26d 0%, #e8945a 100%)",
        "gradient-hero":
          "linear-gradient(135deg, #00809d 0%, #fcecdd 50%, #ff7601 100%)",
      },
    },
  },
  plugins: [],
};
