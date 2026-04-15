"use client";

export const ONBOARDING_TOPICS = [
  "AI & Crypto",
  "Macro",
  "Stablecoins/RWA",
  "DeFi",
  "NFTs/Gaming",
  "Regulation",
] as const;

export interface TopicPickerProps {
  selected: string[];
  onChange: (topics: string[]) => void;
  minRequired?: number;
}

export default function TopicPicker({
  selected,
  onChange,
  minRequired = 1,
}: TopicPickerProps) {
  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-heading font-bold text-xl text-atlas-text">
          What topics do you cover?
        </h2>
        <p className="text-sm text-atlas-text-secondary">
          Pick at least {minRequired} — Atlas uses these to find relevant content
          and send you alerts.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {ONBOARDING_TOPICS.map((topic) => {
          const isSelected = selected.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-atlas-teal/30 ${
                isSelected
                  ? "border-atlas-teal bg-atlas-teal text-atlas-bg shadow-sm shadow-atlas-teal/30"
                  : "border-glass-border bg-atlas-surface text-atlas-text-secondary hover:border-atlas-teal/50 hover:bg-atlas-teal/10 hover:text-atlas-text"
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && selected.length < minRequired && (
        <p className="text-center text-xs text-atlas-warning">
          Pick {minRequired - selected.length} more
        </p>
      )}
    </div>
  );
}
