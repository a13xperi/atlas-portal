export const colors = {
  atlasTeal: "#4ecdc4",
  atlasSteel: "#7b8fa1",
  atlasSurface: "#2d3748",
  atlasBg: "#1a1a2e",
  atlasNav: "#16213e",
  atlasSuccess: "#48bb78",
  atlasWarning: "#ecc94b",
  atlasError: "#fc8181",
  atlasText: "#ffffff",
  atlasTextSecondary: "#a0aec0",
  atlasTextMuted: "#718096",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.15)",
} as const;

export const radii = {
  card: "16px",
  input: "8px",
} as const;

export const fonts = {
  heading: "'Playfair Display', serif",
  body: "'Inter', sans-serif",
} as const;

export const gradients = {
  cta: `linear-gradient(to right, ${colors.atlasTeal}, ${colors.atlasSteel})`,
  onboardingBg: "linear-gradient(to bottom, #0a1a0a, #1a2e1a, #0d1f0d)",
} as const;

export const shadows = {
  ctaHover: `0 0 20px ${colors.atlasTeal}40`,
  cardHover: "0 10px 30px rgba(0,0,0,0.3)",
} as const;
