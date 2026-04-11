'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { useCraftingAdvisor, CraftingAngle } from '@/hooks/useCraftingAdvisor';
import { AnalysisSummary } from './AnalysisSummary';
import { AngleCard } from './AngleCard';
import { TweetDraft } from '@/lib/api';

interface CraftingAdvisorProps {
  sourceContent: string;
  sourceType: string;
  blendId?: string;
  pageCount?: number;
  isCalibrationBlocked?: boolean;
  onDraftsGenerated: (drafts: TweetDraft[]) => void;
  onClose: () => void;
}

export function CraftingAdvisor({
  sourceContent,
  sourceType,
  blendId,
  pageCount,
  isCalibrationBlocked = false,
  onDraftsGenerated,
  onClose,
}: CraftingAdvisorProps) {
  const advisor = useCraftingAdvisor();
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const selectedCount = advisor.selectedAngleIds.size;
  const canGenerate =
    selectedCount > 0 && advisor.phase === 'presenting' && !isCalibrationBlocked;

  // Auto-start analysis on mount
  useEffect(() => {
    if (sourceContent && advisor.phase === 'idle') {
      void advisor.startAnalysis(sourceContent, sourceType, pageCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (isCalibrationBlocked) return;
    await advisor.generateSelected(sourceContent, sourceType, blendId);
    // drafts are passed up via the complete-state useEffect below
  };

  // When generation completes, pass drafts up
  useEffect(() => {
    if (advisor.phase === 'complete' && advisor.generatedDrafts.length > 0) {
      onDraftsGenerated(advisor.generatedDrafts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisor.phase]);

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    advisor.addCustomAngle(customInput.trim());
    setCustomInput('');
    setShowCustomInput(false);
  };

  // Complete state — show summary and close
  if (advisor.phase === 'complete') {
    return (
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-delphi-teal animate-pulse" />
            <span className="text-sm font-medium text-white">
              {advisor.generatedDrafts.length} draft{advisor.generatedDrafts.length !== 1 ? 's' : ''} ready in sidebar
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={advisor.reset}
              className="text-xs text-white/50 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              New analysis
            </button>
            <button
              onClick={onClose}
              aria-label="Close advisor"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-delphi-teal" aria-hidden="true" />
          <span className="text-sm font-semibold text-white">Craft with Atlas</span>
        </div>
        <button onClick={onClose} aria-label="Close advisor" className="text-white/40 hover:text-white/70 transition-colors">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Analyzing state */}
        {advisor.phase === 'analyzing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-delphi-teal border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-sm text-white/60">Atlas is reading your content…</span>
            </div>
            {/* Skeleton cards */}
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-atlas-surface/40 animate-pulse border border-glass-border" />
            ))}
          </div>
        )}

        {/* Presenting state */}
        {advisor.phase === 'presenting' && advisor.analysis && (
          <>
            <AnalysisSummary analysis={advisor.analysis} />

            <div className="border-t border-glass-border" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  Suggested angles
                </span>
                <span className="text-xs text-white/30">
                  {selectedCount > 0 ? `${selectedCount} selected` : 'Select 1–5'}
                </span>
              </div>

              <div className="space-y-2">
                {advisor.angles.map(angle => (
                  <AngleCard
                    key={angle.id}
                    angle={angle}
                    selected={advisor.selectedAngleIds.has(angle.id)}
                    disabled={selectedCount >= 5}
                    onToggle={advisor.toggleAngle}
                  />
                ))}
              </div>

              {/* Custom angle */}
              {showCustomInput ? (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    type="text"
                    aria-label="Custom angle description"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCustom();
                      if (e.key === 'Escape') setShowCustomInput(false);
                    }}
                    placeholder="Describe your angle…"
                    className="flex-1 text-sm bg-atlas-surface/50 border border-glass-border rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-delphi-teal/50"
                  />
                  <button
                    onClick={handleAddCustom}
                    disabled={!customInput.trim()}
                    className="text-xs px-3 py-2 rounded-lg bg-delphi-teal/20 text-delphi-teal border border-delphi-teal/30 hover:bg-delphi-teal/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors py-1"
                >
                  <Plus size={13} aria-hidden="true" />
                  Add your own angle
                </button>
              )}
            </div>

            {advisor.error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {advisor.error}
              </p>
            )}

            {isCalibrationBlocked && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Calibrate your voice first in Voice Studio before generating drafts.
              </p>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`
                w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${canGenerate
                  ? 'bg-gradient-to-r from-delphi-teal to-delphi-teal/60 text-atlas-bg hover:opacity-90 active:scale-[0.99]'
                  : 'bg-atlas-surface/50 text-white/30 cursor-not-allowed border border-glass-border'
                }
              `}
            >
              {isCalibrationBlocked
                ? 'Calibrate voice to generate'
                : selectedCount === 0
                ? 'Select at least one angle'
                : `Generate ${selectedCount} draft${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {/* Generating state */}
        {advisor.phase === 'generating' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-delphi-teal border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-sm text-white/60">
                Generating {selectedCount} draft{selectedCount !== 1 ? 's' : ''}…
              </span>
            </div>
            <div className="h-1.5 bg-atlas-surface/50 rounded-full overflow-hidden">
              <div className="h-full bg-delphi-teal/60 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {/* Error in idle */}
        {advisor.phase === 'idle' && advisor.error && (
          <div className="space-y-3">
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {advisor.error}
            </p>
            <button
              onClick={() => advisor.startAnalysis(sourceContent, sourceType, pageCount)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-atlas-surface/50 border border-glass-border text-white/60 hover:text-white hover:border-delphi-teal/30 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
