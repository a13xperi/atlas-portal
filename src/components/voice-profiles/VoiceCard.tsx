"use client";

interface VoiceCardProps {
  name: string;
  isActive: boolean;
  isPersonal: boolean;
  isSelected: boolean;
  dimensions?: { humor?: number; formality?: number; brevity?: number; contrarianTone?: number };
  onSelect: () => void;
  onUse: () => void;
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-atlas-bg/60">
      <div
        className="h-1 rounded-full bg-atlas-teal/60"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function VoiceCard({
  name,
  isActive,
  isPersonal,
  isSelected,
  dimensions,
  onSelect,
  onUse,
}: VoiceCardProps) {
  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative rounded-2xl border p-5 text-left transition-all cursor-pointer ${
        isSelected
          ? "border-atlas-teal ring-1 ring-atlas-teal bg-atlas-surface"
          : "border-glass-border bg-glass/50 backdrop-blur-xl hover:border-atlas-teal/40"
      }`}
    >
      {/* Badge */}
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          isPersonal
            ? "bg-atlas-teal/15 text-atlas-teal"
            : "bg-glass text-atlas-text-muted"
        }`}
      >
        {isPersonal ? "Personal" : "Voice"}
      </span>

      {/* Name */}
      <p className="mt-2 font-heading text-sm font-semibold text-atlas-text truncate">
        {name}
      </p>

      {/* Mini dimension preview */}
      {dimensions && (
        <div className="mt-3 space-y-1.5">
          <MiniBar value={dimensions.humor ?? 50} />
          <MiniBar value={dimensions.formality ?? 50} />
          <MiniBar value={dimensions.brevity ?? 50} />
          <MiniBar value={dimensions.contrarianTone ?? 50} />
        </div>
      )}

      {/* Use / Active button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUse();
        }}
        disabled={isActive}
        className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
          isActive
            ? "bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/30 cursor-default"
            : "border border-glass-border text-atlas-text-secondary hover:border-atlas-teal hover:text-atlas-teal"
        }`}
      >
        {isActive ? "Active" : "Craft with this voice"}
      </button>
    </div>
  );
}
