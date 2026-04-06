'use client';

import { CraftingAngle } from '@/hooks/useCraftingAdvisor';

interface AngleCardProps {
  angle: CraftingAngle;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

const TONE_STYLES: Record<string, string> = {
  Provocative: 'bg-red-500/15 text-red-300 border-red-500/25',
  Analytical: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  Educational: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  Contrarian: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  Conversational: 'bg-green-500/15 text-green-300 border-green-500/25',
};

export function AngleCard({ angle, selected, disabled, onToggle }: AngleCardProps) {
  const toneStyle = TONE_STYLES[angle.tone] ?? TONE_STYLES.Analytical;
  const isDisabledNotSelected = disabled && !selected;

  return (
    <button
      onClick={() => onToggle(angle.id)}
      disabled={isDisabledNotSelected}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-200
        ${selected
          ? 'bg-delphi-teal/10 border-delphi-teal/50 ring-1 ring-delphi-teal/30'
          : isDisabledNotSelected
            ? 'bg-atlas-surface/30 border-glass-border opacity-40 cursor-not-allowed'
            : 'bg-atlas-surface/50 border-glass-border hover:border-delphi-teal/30 hover:bg-delphi-teal/5 cursor-pointer'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{angle.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${toneStyle}`}>
              {angle.tone}
            </span>
            <span className="text-xs text-white/40">
              {angle.structure === 'thread' ? '🧵 thread' : '✦ single'}
            </span>
          </div>
          <p className="text-xs text-white/60">{angle.description}</p>
          {angle.sampleOpener && (
            <p className="text-xs text-white/40 italic">
              &ldquo;{angle.sampleOpener}&rdquo;
            </p>
          )}
        </div>

        <div className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors
          ${selected
            ? 'bg-delphi-teal border-delphi-teal'
            : 'border-white/20 bg-transparent'
          }
        `}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
