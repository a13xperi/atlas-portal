"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  Mic,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type WizardStep = "upload" | "analyzing" | "review" | "done";
type SourceType = "REPORT" | "ARTICLE";

interface GeneratedDraft {
  id: string;
  content: string;
  angle: string;
  qualityScore: number;
  discarded: boolean;
}

interface InsightData {
  title: string;
  summary: string;
  keyQuote: string;
  angle: string;
}

interface SaveResult {
  draftId: string;
  success: boolean;
  error?: string;
}

const ANGLE_COLORS: Record<string, string> = {
  "contrarian take": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "data highlight": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  prediction: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "practical advice": "bg-green-500/20 text-green-400 border-green-500/30",
  "narrative arc": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "hot take": "bg-red-500/20 text-red-400 border-red-500/30",
  explainer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

// TODO(gap-3): POST /api/campaigns/generate has no frontend caller. Wire it here
// or in the crafting page if the backend intends campaigns to be generated from
// a single draft rather than from bulk content.

// TODO(gap-5): Add "add existing drafts" UI on campaign detail page. Backend
// already supports POST /api/campaigns/{id}/drafts with { draftId, sortOrder }.

// TODO(gap-6): Campaign progress shows 0/0 engagement for new campaigns.
// Hide engagement stats when totalEngagement === 0 && predictedEngagement === 0
// in src/app/campaigns/[id]/page.tsx.

// TODO(gap-10): Campaign-level scheduling is not yet supported by the backend.
// The UI currently only schedules per-draft. A backend endpoint such as
// PATCH /api/campaigns/{id}/schedule with { publishAt, intervalHours } is
// needed before a campaign-level scheduler can be built.

export default function CampaignWizardPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("REPORT");
  const [sourceUrl, setSourceUrl] = useState("");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const [insights, setInsights] = useState<InsightData[]>([]);
  const [drafts, setDrafts] = useState<GeneratedDraft[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"none" | "spread">("none");
  const [scheduleDays, setScheduleDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<SaveResult[] | null>(null);
  const [savedCampaign, setSavedCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string>("Personal Voice");

  // Gap-11: Surface active voice in wizard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedBlendId = window.localStorage.getItem("atlas_active_blend");
    if (savedBlendId) {
      // We don't have the blend name without fetching, so show a generic label.
      // A future improvement could fetch /api/voice/blends and map the id.
      setActiveVoiceLabel("Saved Blend");
    } else {
      setActiveVoiceLabel("Personal Voice");
    }
  }, []);

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setContent(text);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Gap-1: Use single-round generate-from-pdf endpoint when available
      try {
        setStatusText("Analyzing PDF…");
        const result = await api.drafts.generateFromPdf(file, sourceType, {
          sourceUrl: sourceUrl || undefined,
          createCampaign: campaignName.trim() ? true : undefined,
          campaignTitle: campaignName.trim() || undefined,
        });
        setInsights(result.insights || []);
        setDrafts(
          (result.drafts || []).map((d: any) => ({
            ...d,
            discarded: false,
          }))
        );
        if (result.campaign) {
          setSavedCampaign({ id: result.campaign.id, title: result.campaign.title });
        }
        setStatusText("");
        setStep("review");
      } catch {
        setError("Could not analyze this PDF. Try pasting the content directly.");
        setStatusText("");
      }
    } else {
      const text = await file.text();
      setContent(text);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleAnalyze = async () => {
    if (content.trim().length < 50) {
      setError("Content must be at least 50 characters.");
      return;
    }

    setError("");
    setStep("analyzing");
    setStatusText("Extracting insights...");

    try {
      // Gap-2: Create campaign during generation so drafts are never orphaned
      const result = await api.drafts.batchFromContent(content, sourceType, {
        sourceUrl: sourceUrl || undefined,
        createCampaign: campaignName.trim() ? true : undefined,
        campaignTitle: campaignName.trim() || undefined,
      });

      setInsights(result.insights || []);
      setDrafts(
        (result.drafts || []).map((d: any) => ({
          ...d,
          discarded: false,
        }))
      );
      if (result.campaign) {
        setSavedCampaign({ id: result.campaign.id, title: result.campaign.title });
      }
      setStatusText("");
      setStep("review");
    } catch (err: any) {
      setError(err.message || "Failed to analyze content. Please try again.");
      setStep("upload");
    }
  };

  const updateDraftContent = (id: string, newContent: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, content: newContent } : d))
    );
  };

  const discardDraft = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, discarded: true } : d))
    );
  };

  const handleSaveAll = async (createCampaign: boolean, retryFailed = false) => {
    setSaving(true);
    setError("");
    try {
      const activeDrafts = drafts.filter((d) => !d.discarded);
      const candidates = retryFailed && saveResults
        ? activeDrafts.filter((d) => saveResults.some((r) => r.draftId === d.id && !r.success))
        : activeDrafts;

      // Compute schedule slots if user opted to spread
      const scheduleSlots: (string | null)[] = candidates.map((_, i) => {
        if (scheduleMode !== "spread" || candidates.length === 0) return null;
        const days = Math.max(1, scheduleDays);
        const totalMs = days * 24 * 60 * 60 * 1000;
        const offset =
          candidates.length === 1
            ? totalMs / 2
            : 60 * 60 * 1000 + (i * (totalMs - 60 * 60 * 1000)) / (candidates.length - 1);
        return new Date(Date.now() + offset).toISOString();
      });

      // Gap-7: Error recovery — track each draft individually so partial
      // failures can be retried without losing already-saved work.
      const results: SaveResult[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const draft = candidates[i];
        try {
          await api.drafts.update(draft.id, { content: draft.content });
          const slot = scheduleSlots[i];
          if (slot) {
            await api.drafts.schedule(draft.id, slot);
          } else {
            await api.drafts.enqueue(draft.id);
          }
          results.push({ draftId: draft.id, success: true });
        } catch (err: any) {
          results.push({ draftId: draft.id, success: false, error: err.message || "Failed" });
        }
      }

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        setSaveResults(results);
        setError(`${failed.length} draft${failed.length !== 1 ? "s" : ""} could not be saved. You can retry below.`);
        setSaving(false);
        return;
      }

      // If campaign wasn't created during generation, create it now
      if (createCampaign && campaignName.trim() && !savedCampaign) {
        const { campaign } = await api.campaigns.create(campaignName.trim());
        for (let i = 0; i < activeDrafts.length; i++) {
          await api.campaigns.addDraft(campaign.id, activeDrafts[i].id, i + 1);
        }
        setSavedCampaign({ id: campaign.id, title: campaign.name });
      } else if (savedCampaign && createCampaign && campaignName.trim()) {
        // Ensure all drafts are linked if campaign was pre-created
        for (let i = 0; i < activeDrafts.length; i++) {
          try {
            await api.campaigns.addDraft(savedCampaign.id, activeDrafts[i].id, i + 1);
          } catch {
            // May already be linked; ignore duplicate errors
          }
        }
      }

      setSaveResults(null);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to save drafts.");
    } finally {
      setSaving(false);
    }
  };

  const activeDraftCount = drafts.filter((d) => !d.discarded).length;
  const failedDraftIds = new Set(saveResults?.filter((r) => !r.success).map((r) => r.draftId) ?? []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 font-body sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/campaigns"
            className="rounded-lg border border-glass-border bg-atlas-surface p-2 text-atlas-text-muted transition-colors hover:text-atlas-text"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-atlas-teal" />
              <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
                Campaign Wizard
              </h1>
            </div>
            <p className="mt-1 text-sm text-atlas-text-muted">
              Drop a report or article and get multiple tweet drafts from different angles.
            </p>
          </div>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-2xl border border-dashed border-glass-border bg-atlas-bg/30 p-8 text-center transition-colors hover:border-atlas-teal/50"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto flex flex-col items-center gap-3"
              >
                <Upload className="h-10 w-10 text-atlas-text-muted" />
                <span className="text-sm text-atlas-text-secondary">
                  Drop a PDF or text file, or click to browse
                </span>
              </button>
            </div>

            {/* Source type selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-atlas-text-muted">Source type:</span>
              <button
                type="button"
                onClick={() => setSourceType("REPORT")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  sourceType === "REPORT"
                    ? "border border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                    : "border border-glass-border bg-atlas-surface text-atlas-text-muted hover:text-atlas-text"
                }`}
              >
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                Report
              </button>
              <button
                type="button"
                onClick={() => setSourceType("ARTICLE")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  sourceType === "ARTICLE"
                    ? "border border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                    : "border border-glass-border bg-atlas-surface text-atlas-text-muted hover:text-atlas-text"
                }`}
              >
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                Article
              </button>
            </div>

            {/* Source URL */}
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL (optional)"
              className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            />

            {/* Content textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste article or report text here..."
              rows={10}
              className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            />

            {content.length > 0 && (
              <p className="text-xs text-atlas-text-muted">
                {content.length.toLocaleString()} characters
              </p>
            )}

            {/* Gap-11: Surface active voice */}
            <div className="flex items-center gap-2 rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-xs text-atlas-text-muted">
              <Mic className="h-3.5 w-3.5 text-atlas-teal" />
              <span>Writing as:</span>
              <span className="font-medium text-atlas-text">{activeVoiceLabel}</span>
            </div>

            {error && (
              <p className="text-sm text-atlas-error">{error}</p>
            )}

            <GradientButton
              onClick={handleAnalyze}
              disabled={content.trim().length < 50}
              fullWidth
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Content
            </GradientButton>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-atlas-teal" />
            <p className="text-sm text-atlas-text-secondary">{statusText}</p>
            <p className="mt-2 text-xs text-atlas-text-muted">
              This may take a minute or two...
            </p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-6">
            {/* Campaign name input */}
            <div className="rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
              <label className="mb-2 block text-sm font-medium text-atlas-text">
                Campaign Name (optional)
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., ETH Staking Analysis — April 2026"
                className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            </div>

            {/* Scheduling */}
            <div className="rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
              <label className="mb-3 block text-sm font-medium text-atlas-text">
                Posting Schedule
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleMode("none")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    scheduleMode === "none"
                      ? "border border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                      : "border border-glass-border bg-atlas-surface text-atlas-text-muted hover:text-atlas-text"
                  }`}
                >
                  Queue only
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("spread")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    scheduleMode === "spread"
                      ? "border border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                      : "border border-glass-border bg-atlas-surface text-atlas-text-muted hover:text-atlas-text"
                  }`}
                >
                  Spread evenly
                </button>
                {scheduleMode === "spread" && (
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-xs text-atlas-text-muted">over</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scheduleDays}
                      onChange={(e) =>
                        setScheduleDays(Math.max(1, parseInt(e.target.value || "1", 10)))
                      }
                      className="w-16 rounded-lg border border-glass-border bg-atlas-surface px-2 py-1 text-center text-sm text-atlas-text focus:border-atlas-teal focus:outline-none"
                    />
                    <span className="text-xs text-atlas-text-muted">days</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-atlas-text-muted">
                {scheduleMode === "spread"
                  ? `${activeDraftCount} post${activeDraftCount !== 1 ? "s" : ""} will be scheduled across the next ${scheduleDays} day${scheduleDays !== 1 ? "s" : ""}.`
                  : "Posts will be added to your queue without a fixed time."}
              </p>
            </div>

            {/* Summary */}
            <p className="text-sm text-atlas-text-secondary">
              {insights.length} insights extracted, {activeDraftCount} drafts generated.
            </p>

            {/* Draft cards */}
            <div className="space-y-5">
              {drafts.map((draft, index) => {
                if (draft.discarded) return null;
                const insight = insights[index];
                const angleClass =
                  ANGLE_COLORS[draft.angle] ||
                  "bg-atlas-text-muted/20 text-atlas-text-muted border-atlas-text-muted/30";
                const failed = failedDraftIds.has(draft.id);

                return (
                  <div
                    key={draft.id}
                    className={`rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl ${
                      failed ? "ring-1 ring-atlas-error/40" : ""
                    }`}
                  >
                    {/* Insight header */}
                    {insight && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-atlas-text-muted">
                          {insight.title}
                        </p>
                        <p className="mt-0.5 text-xs text-atlas-text-muted/70">
                          {insight.summary}
                        </p>
                      </div>
                    )}

                    {/* Angle badge + actions */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${angleClass}`}
                      >
                        {draft.angle}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Quality bar */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-atlas-text-muted">Quality</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-atlas-surface">
                            <div
                              className="h-full rounded-full bg-atlas-teal"
                              style={{
                                width: `${Math.min(100, draft.qualityScore)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => discardDraft(draft.id)}
                          className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-error"
                          aria-label="Discard draft"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editable draft content */}
                    <textarea
                      value={draft.content}
                      onChange={(e) =>
                        updateDraftContent(draft.id, e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                    />

                    {failed && saveResults && (
                      <p className="mt-2 text-xs text-atlas-error">
                        {saveResults.find((r) => r.draftId === draft.id)?.error || "Failed to save"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-4">
                <p className="text-sm text-atlas-error">{error}</p>
                {failedDraftIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSaveAll(!!campaignName.trim(), true)}
                    disabled={saving}
                    className="mt-3 inline-flex items-center rounded-lg border border-glass-border bg-atlas-surface px-3 py-1.5 text-sm text-atlas-text hover:bg-atlas-nav disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Retry {failedDraftIds.size} failed draft{failedDraftIds.size !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}

            {/* Bulk actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="rounded-lg border border-glass-border bg-atlas-surface px-4 py-2 text-sm text-atlas-text hover:bg-atlas-nav"
              >
                <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
                Back
              </button>
              <div className="flex flex-1 gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveAll(false)}
                  disabled={saving || activeDraftCount === 0}
                  className="rounded-lg border border-glass-border bg-atlas-surface px-4 py-2 text-sm text-atlas-text hover:bg-atlas-nav disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Save All to Queue
                </button>
                <GradientButton
                  onClick={() => handleSaveAll(true)}
                  disabled={saving || activeDraftCount === 0}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Create Campaign & Save
                </GradientButton>
              </div>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-atlas-teal/20">
              <Check className="h-7 w-7 text-atlas-teal" />
            </div>
            <h2 className="font-heading text-xl font-bold text-atlas-text">
              Drafts saved!
            </h2>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              {activeDraftCount} draft{activeDraftCount !== 1 ? "s" : ""} added to your queue.
              {savedCampaign && (
                <>
                  {" "}Campaign &quot;{savedCampaign.title}&quot; created.
                </>
              )}
            </p>
            <div className="mt-6 flex gap-3">
              {savedCampaign && (
                <Link
                  href={`/campaigns/${savedCampaign.id}`}
                  className="rounded-lg border border-glass-border bg-atlas-surface px-4 py-2 text-sm text-atlas-text hover:bg-atlas-nav"
                >
                  View Campaign
                </Link>
              )}
              <Link href="/queue">
                <GradientButton>
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  Go to Queue
                </GradientButton>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
