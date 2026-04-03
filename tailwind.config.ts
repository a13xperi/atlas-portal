import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "atlas-teal": "#4ecdc4",
        "atlas-steel": "#7b8fa1",
        "atlas-surface": "#2d3748",
        "atlas-bg": "#1a1a2e",
        "atlas-nav": "#16213e",
        "atlas-success": "#48bb78",
        "atlas-warning": "#ecc94b",
        "atlas-error": "#fc8181",
        "atlas-text": "#ffffff",
        "atlas-text-secondary": "#a0aec0",
        "atlas-text-muted": "#718096",
        glass: "rgba(255,255,255,0.08)",
        "glass-border": "rgba(255,255,255,0.15)",
        "atlas-surface-glass": "rgba(255,255,255,0.04)",
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        lg: "8px",
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        xl: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
