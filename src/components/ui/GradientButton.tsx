"use client";

export interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  variant?: "primary" | "outline-success" | "outline-warning" | "outline-teal";
  type?: "button" | "submit";
}

const variantClasses: Record<
  NonNullable<GradientButtonProps["variant"]>,
  string
> = {
  primary: "gradient-cta",
  "outline-success":
    "bg-transparent border border-atlas-success text-atlas-success hover:bg-atlas-success/10 rounded-lg font-semibold transition-all duration-200",
  "outline-warning":
    "bg-transparent border border-atlas-warning text-atlas-warning hover:bg-atlas-warning/10 rounded-lg font-semibold transition-all duration-200",
  "outline-teal":
    "bg-transparent border border-atlas-teal text-atlas-teal hover:bg-atlas-teal/10 rounded-lg font-semibold transition-all duration-200",
};

export default function GradientButton({
  children,
  onClick,
  fullWidth = false,
  variant = "primary",
  type = "button",
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variantClasses[variant]} px-6 py-3 text-sm cursor-pointer ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}
