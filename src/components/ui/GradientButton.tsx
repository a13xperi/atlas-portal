"use client";

import { Children, isValidElement, type ReactNode } from "react";

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  variant?: "primary" | "outline-success" | "outline-warning" | "outline-teal";
  type?: "button" | "submit";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  "aria-label"?: string;
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

function getAccessibleText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return getAccessibleText(child.props.children);
      }

      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function GradientButton({
  children,
  onClick,
  fullWidth = false,
  variant = "primary",
  type = "button",
  size = "default",
  disabled = false,
  "aria-label": ariaLabel,
}: GradientButtonProps) {
  const sizeClasses =
    size === "lg"
      ? "px-6 py-4 text-lg font-bold"
      : size === "sm"
        ? "px-4 py-2 text-sm"
        : "px-6 py-3 text-sm";
  const accessibleLabel = ariaLabel ?? (getAccessibleText(children) || undefined);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={accessibleLabel}
      aria-disabled={disabled || undefined}
      className={`${variantClasses[variant]} ${sizeClasses} cursor-pointer ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
