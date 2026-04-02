export interface StatusPillProps {
  label: string;
  variant: "posted" | "draft" | "feedback" | "speed" | "error";
}

const variantClasses: Record<StatusPillProps["variant"], string> = {
  posted: "bg-atlas-success/20 text-atlas-success",
  draft: "bg-atlas-teal/20 text-atlas-teal",
  feedback: "bg-atlas-warning/20 text-atlas-warning",
  speed: "bg-atlas-warning/20 text-atlas-warning",
  error: "bg-atlas-error/20 text-atlas-error",
};

export default function StatusPill({ label, variant }: StatusPillProps) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
