"use client";

import { useRef, useState } from "react";
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

const ANGLE_COLORS: Record<string, string> = {
  "contrarian take": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "data highlight": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  prediction: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "practical advice": "bg-green-500/20 text-green-400 border-green-500/30",
  "narrative arc": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "hot take": "bg-red-500/20 text-red-400 border-red-500/30",
  explainer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

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
  const [saving, setSaving] = useState(false);
  const [savedCampaign, setSavedCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setContent(text);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // For PDFs, read as text — real PDF parsing happens server-side
      // but for now we read what we can from the file
      const text = await file.text();
      if (text.trim().length > 50) {
        setContent(text);
      } else {
        setError("Could not extract text from this PDF. Try pasting the content directly.");
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
      const result = await api.drafts.batchFromContent(content, sourceType, {
        sourceUrl: sourceUrl || undefined,
      });

      setInsights(result.insights || []);
      setDrafts(
        (result.drafts || []).map((d: any) => ({
          ...d,
          discarded: false,
        }))
      );
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

  const handleSaveAll = async (createCampaign: boolean) => {
    setSaving(true);
    try {
      const activeDrafts = drafts.filter((d) => !d.discarded);

      // Update any edited drafts
      for (const draft of activeDrafts) {
        await api.drafts.update(draft.id, { content: draft.content });
        await api.drafts.enqueue(draft.id);
      }

      if (createCampaign && campaignName.trim()) {
        const { campaign } = await api.campaigns.create(campaignName.trim());
        for (const draft of activeDrafts) {
          await api.campaigns.addDraft(campaign.id, draft.id);
        }
        setSavedCampaign({ id: campaign.id, title: campaign.name });
      }

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to save drafts.");
    } finally {
      setSaving(false);
    }
  };

  const activeDraftCount = drafts.filter((d) => !d.discarded).length;

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
            <p className="mt-1 text-sm text-atlas-text-secondary">
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

                return (
                  <div
                    key={draft.id}
                    className="rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl"
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
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-atlas-error">{error}</p>
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
