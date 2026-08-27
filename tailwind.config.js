/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#050B14",
        card: {
          DEFAULT: "#0B1220",
          secondary: "#101A2B",
          hover: "#15243B"
        },
        border: {
          DEFAULT: "#1E293B",
          subtle: "#172336",
          active: "#2563EB"
        },
        navy: {
          950: "#03070D",
          900: "#050B14",
          850: "#080F1D",
          800: "#0B1220",
          700: "#101A2B",
          600: "#17243B",
          500: "#1F3152"
        },
        brand: {
          primary: "#2563EB",
          bright: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.15)",
          hover: "#1D4ED8"
        },
        trade: {
          profit: "#22C55E",
          loss: "#EF4444",
          breakeven: "#F59E0B",
          profitBg: "rgba(34, 197, 94, 0.1)",
          lossBg: "rgba(239, 68, 68, 0.1)",
          breakevenBg: "rgba(245, 158, 11, 0.1)"
        },
        slateText: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(37, 99, 235, 0.25)",
        glowBright: "0 0 25px -5px rgba(56, 189, 248, 0.3)"
      }
    },
  },
  plugins: [],
};
