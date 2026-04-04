import type { ReactNode } from "react";

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "480px" | "640px" | "720px" | "full";
  "aria-label"?: string;
}

export default function GlassCard({
  children,
  className = "",
  maxWidth = "480px",
  "aria-label": ariaLabel,
}: GlassCardProps) {
  const Component = ariaLabel ? "section" : "div";
  const widthClass =
    maxWidth === "full" ? "w-full" : "";
  const widthStyle = maxWidth !== "full" ? { maxWidth } : undefined;

  return (
    <Component
      aria-label={ariaLabel}
      className={`glass-card px-6 sm:px-[49px] py-8 sm:py-[41px] w-full ${widthClass} ${className}`}
      style={widthStyle}
    >
      {children}
    </Component>
  );
}
