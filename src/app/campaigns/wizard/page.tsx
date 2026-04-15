"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CampaignDraftCard from "@/components/campaigns/CampaignDraftCard";
import {
  classifyFormat,
  recommendTiming,
  suggestAnalysts,
  buildStrategyBullets,
  type ContentFormat,
} from "@/lib/campaign-recommendations";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const FORMAT_LABELS: Record<ContentFormat | "all", string> = {
  all: "All",
  "one-liner": "One-liner",
  thread: "Thread",
  article: "Article",
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
  const [scheduleMode, setScheduleMode] = useState<"none" | "spread">("none");
  const [scheduleDays, setScheduleDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [savedCampaign, setSavedCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [formatFilter, setFormatFilter] = useState<ContentFormat | "all">("all");

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setContent(text);
    } else if ((file.type === "application/pdf" || file.name.endsWith(".pdf")) && content.trim() === "") {
      // One-shot PDF → campaign path
      try {
        setError("");
        setStep("analyzing");
        setStatusText("Extracting insights and drafting tweets...");
        const result = await api.campaigns.generateFromPdf(file, {
          name: campaignName || undefined,
        });
        setDrafts(
          (result.drafts || []).map((d: any) => ({
            ...d,
            qualityScore: d.score ?? 0,
            discarded: false,
          }))
        );
        if (result.campaignId) {
          setSavedCampaign({
            id: result.campaignId,
            title: campaignName.trim() || result.filename || "Untitled Campaign",
          });
        }
        setStatusText("");
        setStep("review");
      } catch (err: any) {
        setError(err.message || "Failed to generate campaign from PDF. Please try again.");
        setStep("upload");
      }
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Fallback: extract text and populate content when content field is not empty
      try {
        setStatusText("Extracting PDF text…");
        const form = new FormData();
        form.append("file", file);
        const accessToken = typeof window !== "undefined" ? sessionStorage.getItem("atlas_access_token") : null;
        const res = await fetch(`${API_URL}/api/upload/extract-text`, {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          credentials: "include",
          body: form,
        });
        if (!res.ok) throw new Error("PDF extraction failed");
        const { text: extracted } = (await res.json()) as { text: string };
        if (extracted.trim().length > 50) {
          setContent(extracted);
        } else {
          setError("PDF appeared empty. Try pasting the content directly.");
        }
      } catch {
        setError("Could not extract text from this PDF. Try pasting the content directly.");
      } finally {
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
      setSavedCampaign(null);
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
    setError("");
    try {
      const activeDrafts = drafts.filter((d) => !d.discarded);

      // Compute schedule slots if user opted to spread
      const scheduleSlots: (string | null)[] = activeDrafts.map((_, i) => {
        if (scheduleMode !== "spread" || activeDrafts.length === 0) return null;
        const days = Math.max(1, scheduleDays);
        const totalMs = days * 24 * 60 * 60 * 1000;
        // Evenly spaced; first slot 1 hour out, last slot at end of window
        const offset =
          activeDrafts.length === 1
            ? totalMs / 2
            : 60 * 60 * 1000 + (i * (totalMs - 60 * 60 * 1000)) / (activeDrafts.length - 1);
        return new Date(Date.now() + offset).toISOString();
      });

      // Persist edits + enqueue/schedule each draft
      for (let i = 0; i < activeDrafts.length; i++) {
        const draft = activeDrafts[i];
        await api.drafts.update(draft.id, { content: draft.content });
        const slot = scheduleSlots[i];
        if (slot) {
          await api.drafts.schedule(draft.id, slot);
        } else {
          await api.drafts.enqueue(draft.id);
        }
      }

      if (createCampaign && !savedCampaign && campaignName.trim()) {
        const { campaign } = await api.campaigns.create(campaignName.trim());
        for (let i = 0; i < activeDrafts.length; i++) {
          await api.campaigns.addDraft(campaign.id, activeDrafts[i].id, i + 1);
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

  const formatCounts = {
    all: activeDraftCount,
    "one-liner": drafts.filter((d) => !d.discarded && classifyFormat(d.content) === "one-liner").length,
    thread: drafts.filter((d) => !d.discarded && classifyFormat(d.content) === "thread").length,
    article: drafts.filter((d) => !d.discarded && classifyFormat(d.content) === "article").length,
  };

  const visibleDrafts = drafts.filter((d) => {
    if (d.discarded) return false;
    if (formatFilter === "all") return true;
    return classifyFormat(d.content) === formatFilter;
  });

  const strategyBullets = buildStrategyBullets(insights, drafts);

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

            {/* Strategy guide */}
            {strategyBullets.length > 0 && (
              <div className="rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
                <h3 className="mb-2 text-sm font-medium text-atlas-text">
                  Content strategy for this report
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-sm text-atlas-text-secondary">
                  {strategyBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-atlas-text-secondary">
              {insights.length} insights extracted, {activeDraftCount} drafts generated.
            </p>

            {/* Format filter */}
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "one-liner", "thread", "article"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormatFilter(fmt)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    formatFilter === fmt
                      ? "border border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                      : "border border-glass-border bg-atlas-surface text-atlas-text-muted hover:text-atlas-text"
                  }`}
                >
                  {FORMAT_LABELS[fmt]} ({formatCounts[fmt]})
                </button>
              ))}
            </div>

            {/* Draft cards */}
            <div className="space-y-5">
              {visibleDrafts.map((draft) => {
                const format = classifyFormat(draft.content);
                const timing = recommendTiming(draft.angle, format);
                const analysts = suggestAnalysts(draft.angle, format);
                return (
                  <CampaignDraftCard
                    key={draft.id}
                    draft={draft}
                    onContentChange={updateDraftContent}
                    onDiscard={discardDraft}
                    format={format}
                    timing={timing}
                    analysts={analysts}
                  />
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
