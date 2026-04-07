'use client';

import { ContentAnalysis } from '@/hooks/useCraftingAdvisor';

interface AnalysisSummaryProps {
  analysis: ContentAnalysis;
}

const SENTIMENT_STYLES: Record<string, string> = {
  bullish: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  bearish: 'bg-red-500/20 text-red-300 border-red-500/30',
  neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  mixed: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  const sentimentStyle = SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.neutral;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Analysis</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${sentimentStyle}`}>
          {analysis.sentiment}
        </span>
        {analysis.pageCount && (
          <span className="text-xs text-white/40">{analysis.pageCount} pages</span>
        )}
      </div>

      <p className="text-sm text-white/70 leading-relaxed">{analysis.summary}</p>

      {analysis.keyThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.keyThemes.map((theme, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-delphi-teal/10 text-delphi-teal border border-delphi-teal/20"
            >
              {theme.length > 40 ? theme.slice(0, 40) + '…' : theme}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
