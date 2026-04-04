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
        "atlas-surface": "#0A1628",
        "atlas-bg": "#010411",
        "atlas-nav": "#0A1225",
        "atlas-success": "#48bb78",
        "atlas-warning": "#ecc94b",
        "atlas-error": "#fc8181",
        "atlas-text": "#ffffff",
        "atlas-text-secondary": "#a0aec0",
        "atlas-text-muted": "#718096",
        glass: "rgba(255,255,255,0.05)",
        "glass-border": "rgba(255,255,255,0.10)",
        "atlas-surface-glass": "rgba(255,255,255,0.03)",
        // Delphi unified design system
        "delphi-blue-900": "#0D216B",
        "delphi-blue-700": "#1E3A8A",
        "delphi-blue-500": "#3B82F6",
        "delphi-blue-400": "#60A5FA",
        "delphi-blue-300": "#93C5FD",
        "delphi-teal": "#4ecdc4",
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        lg: "8px",
      },
      fontFamily: {
        heading: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        lg: "12px",
        xl: "12px",
      },
      keyframes: {
        "oracle-dot": {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-4px)" },
        },
      },
      animation: {
        "oracle-dot": "oracle-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
