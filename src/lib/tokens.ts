export const colors = {
  atlasTeal: "#4ecdc4",
  atlasSteel: "#7b8fa1",
  atlasSurface: "#0A1628",
  atlasBg: "#010411",
  atlasNav: "#0A1225",
  atlasSuccess: "#48bb78",
  atlasWarning: "#ecc94b",
  atlasError: "#fc8181",
  atlasText: "#ffffff",
  atlasTextSecondary: "#a0aec0",
  atlasTextMuted: "#718096",
  glass: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.10)",
  surfaceGlass: "rgba(255,255,255,0.03)",
  // Delphi unified design system
  delphiBlue900: "#0D216B",
  delphiBlue700: "#1E3A8A",
  delphiBlue500: "#3B82F6",
  delphiBlue400: "#60A5FA",
  delphiBlue300: "#93C5FD",
  delphiTeal: "#4ecdc4",
} as const;

export const radii = {
  card: "16px",
  input: "8px",
} as const;

export const fonts = {
  heading: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
} as const;

export const gradients = {
  cta: `linear-gradient(to right, ${colors.atlasTeal}, ${colors.atlasSteel})`,
  onboardingBg: `linear-gradient(to bottom, ${colors.atlasBg}, ${colors.atlasNav}, ${colors.atlasBg})`,
  appBg: `linear-gradient(to bottom, ${colors.atlasBg}, ${colors.atlasSurface}, ${colors.atlasBg})`,
  // Delphi unified design system
  brand: `linear-gradient(135deg, ${colors.delphiBlue500}, ${colors.delphiBlue400})`,
  bridge: `linear-gradient(90deg, ${colors.delphiBlue500}, ${colors.delphiTeal})`,
} as const;

export const shadows = {
  ctaHover: `0 0 20px ${colors.atlasTeal}40`,
  cardHover: "0 10px 30px rgba(0,0,0,0.3)",
} as const;
