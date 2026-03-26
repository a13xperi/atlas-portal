export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "480px" | "640px" | "720px" | "full";
}

export default function GlassCard({
  children,
  className = "",
  maxWidth = "480px",
}: GlassCardProps) {
  const widthClass =
    maxWidth === "full" ? "w-full" : "";
  const widthStyle = maxWidth !== "full" ? { maxWidth } : undefined;

  return (
    <div
      className={`glass-card px-6 sm:px-12 py-8 sm:py-10 w-full ${widthClass} ${className}`}
      style={widthStyle}
    >
      {children}
    </div>
  );
}
