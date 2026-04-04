"use client";

export const REPLY_ANGLES = ["Direct", "Curious", "Concise"] as const;

export type ReplyAngle = (typeof REPLY_ANGLES)[number];

interface ReplyAngleSelectorProps {
  selectedAngle: ReplyAngle;
  onAngleChange: (angle: ReplyAngle) => void;
}

export default function ReplyAngleSelector({
  selectedAngle,
  onAngleChange,
}: ReplyAngleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
        Reply angle
      </p>
      <div
        role="tablist"
        aria-label="Reply angle"
        className="inline-flex flex-wrap rounded-xl bg-glass p-1 backdrop-blur-xl"
      >
        {REPLY_ANGLES.map((angle) => {
          const isActive = angle === selectedAngle;

          return (
            <button
              key={angle}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onAngleChange(angle)}
              className={`text-sm transition-colors ${
                isActive
                  ? "rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-4 py-2 text-white"
                  : "px-4 py-2 text-atlas-text-secondary hover:text-white"
              }`}
            >
              {angle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
