"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import ContentInput from "@/components/ui/ContentInput";
import GradientButton from "@/components/ui/GradientButton";
import { Mic, Loader2, Image as ImageIcon, Palette } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, TrendingTopic, GeneratedImage, SavedBlend, AnalyticsSummary } from "@/lib/api";

export default function CraftingPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<TweetDraft | null>(null);
  const [activeVersion, setActiveVersion] = useState(0);
  const [voiceMode, setVoiceMode] = useState<"my_voice" | "blended" | "specific">("my_voice");
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [selectedBlendId, setSelectedBlendId] = useState<string | null>(null);
  const [blendValue, setBlendValue] = useState(30);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [visualConcept, setVisualConcept] = useState<GeneratedImage | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeDraftInitialized = useRef(false);

  const loadDrafts = useCallback(async () => {
    try {
      const { drafts: d } = await api.drafts.list();
      setDrafts(d);
      if (d.length > 0 && !activeDraftInitialized.current) {
        setActiveDraft(d[0]);
        activeDraftInitialized.current = true;
      }
    } catch (e) {
      console.error("Failed to load drafts:", e);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const { summary: s } = await api.analytics.summary();
      setSummary(s);
    } catch (e) {
      console.error("Failed to load summary:", e);
    }
  }, []);

  const loadBlends = useCallback(async () => {
    try {
      const { blends: b } = await api.voice.getBlends();
      setBlends(b);
    } catch { /* blends optional */ }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      const { topics } = await api.trending.topics();
      setTrendingTopics(topics);
    } catch (e) {
      // Trending is optional — don't block the page
    }
  }, []);

  useEffect(() => {
    loadDrafts();
    loadSummary();
    loadTrending();
    loadBlends();
  }, [loadDrafts, loadSummary, loadTrending, loadBlends]);

  const handleFileDrop = async (files: FileList) => {
    if (!user || files.length === 0) return;
    const file = files[0];
    // Read text content from the file
    try {
      const text = await file.text();
      if (!text.trim()) return;
      setCreating(true);
      setError(null);
      const { draft } = await api.drafts.generate(
        text.trim().slice(0, 10000), // Cap at 10k chars
        "REPORT",
        selectedBlendId || undefined
      );
      setDrafts((prev) => [draft, ...prev]);
      setActiveDraft(draft);
      setActiveVersion(0);
      activeDraftInitialized.current = true;
    } catch (e: unknown) {
      console.error("Failed to process file:", e);
      setError(e instanceof Error ? e.message : "Failed to process file");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDraft = async (text: string) => {
    if (!user || !text.trim()) return;
    setCreating(true);
    setError(null);
    try {
      // Detect source type from content
      const sourceType = text.trim().startsWith("http") ? "ARTICLE" : "MANUAL";
      const { draft } = await api.drafts.generate(text.trim(), sourceType, selectedBlendId || undefined);
      setDrafts((prev) => [draft, ...prev]);
      setActiveDraft(draft);
      setActiveVersion(0);
      activeDraftInitialized.current = true;
    } catch (e: unknown) {
      console.error("Failed to generate draft:", e);
      setError(e instanceof Error ? e.message : "Failed to generate draft");
    } finally {
      setCreating(false);
    }
  };

  const handleShip = async () => {
    if (!user || !activeDraft) return;
    setLoading(true);
    setError(null);
    try {
      const { draft } = await api.drafts.update(activeDraft.id, { status: "APPROVED" });
      setActiveDraft(draft);
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? draft : d)));
    } catch (e: unknown) {
      console.error("Failed to ship draft:", e);
      setError(e instanceof Error ? e.message : "Failed to ship draft");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!user || !activeDraft || !feedback.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { draft } = await api.drafts.regenerate(activeDraft.id, feedback.trim());
      setDrafts((prev) => [draft, ...prev]);
      setActiveDraft(draft);
      setActiveVersion(0);
      setFeedback("");
    } catch (e) {
      // Fallback: just save feedback if regenerate fails (e.g. no sourceContent)
      try {
        const { draft } = await api.drafts.update(activeDraft.id, { feedback: feedback.trim() });
        setActiveDraft(draft);
        setDrafts((prev) => prev.map((d) => (d.id === draft.id ? draft : d)));
        setFeedback("");
      } catch (e2: unknown) {
        console.error("Failed to submit feedback:", e2);
        setError(e2 instanceof Error ? e2.message : "Failed to submit feedback");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleTryAgain = async () => {
    if (!user || !activeDraft) return;
    setCreating(true);
    setError(null);
    try {
      const { draft } = await api.drafts.regenerate(activeDraft.id);
      setDrafts((prev) => [draft, ...prev]);
      setActiveDraft(draft);
      setActiveVersion(0);
    } catch (e: unknown) {
      console.error("Failed to regenerate:", e);
      setError(e instanceof Error ? e.message : "Failed to regenerate draft");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateVisual = async (style: string = "quote_card") => {
    if (!user || !activeDraft) return;
    setGeneratingImage(true);
    setError(null);
    try {
      const { image } = await api.images.generateForDraft(activeDraft.id, style);
      setVisualConcept(image);
    } catch (e: unknown) {
      console.error("Image generation failed:", e);
      setError(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !activeDraft) return;
    setLoading(true);
    try {
      await api.drafts.delete(activeDraft.id);
      const remaining = drafts.filter((d) => d.id !== activeDraft.id);
      setDrafts(remaining);
      setActiveDraft(remaining[0] || null);
    } catch (e) {
      console.error("Failed to delete draft:", e);
    } finally {
      setLoading(false);
    }
  };

  // Show up to 3 most recent drafts as "versions"
  const versionDrafts = drafts.slice(0, 3);
  const feedbackCount = summary?.feedbackGiven ?? 0;
  const draftsRefined = summary?.refinements ?? 0;
  const usagePercent = summary ? Math.min((summary.draftsCreated / Math.max(summary.draftsCreated + 5, 1)) * 100, 100) : 0;

  return (
    <AppShell>
      {/* Usage Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-atlas-surface border border-glass-border rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 gap-3 sm:gap-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <svg className="w-10 h-10 shrink-0" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#2d3748" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none" stroke="#4ecdc4" strokeWidth="3"
              strokeDasharray={`${(usagePercent / 100) * 100.5} ${100.5}`}
              strokeLinecap="round" transform="rotate(-90 20 20)"
            />
          </svg>
          <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-atlas-text-secondary">
            <span>Feedback given: {feedbackCount} this week</span>
            <span>Drafts refined: {draftsRefined}</span>
          </div>
        </div>
        <Link href="/analytics" className="text-atlas-teal text-sm hover:underline shrink-0">
          View full analytics →
        </Link>
      </div>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="mt-6">
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Trending now — click to craft a tweet
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {trendingTopics.slice(0, 6).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleCreateDraft(`${t.headline}. ${t.context || ""}`)}
                className="px-3 py-1.5 text-xs rounded-full bg-atlas-surface border border-glass-border text-atlas-text hover:border-atlas-teal hover:text-atlas-teal transition-colors"
              >
                {t.headline.length > 50 ? t.headline.slice(0, 50) + "…" : t.headline}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Input Zone */}
      <div className="mt-6">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Feed Atlas content — it crafts the tweet in your voice.
        </label>
        <div className="mt-3">
          <ContentInput
            onTextSubmit={handleCreateDraft}
            onDrop={handleFileDrop}
            onTrendingClick={() => {
              const el = document.getElementById("trending-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
          {creating && (
            <div className="flex items-center gap-2 mt-2 text-atlas-teal text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Crafting your tweet…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-between mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="ml-2 hover:text-red-300">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-6 py-3">
        <select
          value={voiceMode}
          onChange={(e) => {
            const mode = e.target.value as "my_voice" | "blended" | "specific";
            setVoiceMode(mode);
            if (mode === "my_voice") setSelectedBlendId(null);
          }}
          className="bg-atlas-nav border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none focus:border-atlas-teal"
        >
          <option value="my_voice">My voice</option>
          <option value="blended">Blended</option>
          <option value="specific">Specific person</option>
        </select>
        {voiceMode === "blended" && blends.length > 0 && (
          <select
            value={selectedBlendId || ""}
            onChange={(e) => setSelectedBlendId(e.target.value || null)}
            className="bg-atlas-nav border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none focus:border-atlas-teal"
          >
            <option value="">Pick a blend…</option>
            {blends.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-sm text-atlas-text-secondary shrink-0">
            {selectedBlendId ? `My Voice ↔ ${blends.find((b) => b.id === selectedBlendId)?.name || "Blend"}` : "Blend:"}
          </span>
          <input
            type="range" min={0} max={100} value={blendValue}
            onChange={(e) => setBlendValue(Number(e.target.value))}
            className="flex-1 accent-atlas-teal"
          />
          <span className="text-sm text-atlas-text w-10 text-right">{blendValue}%</span>
        </div>
      </div>

      {/* Draft Preview */}
      {activeDraft ? (
        <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <p className="text-atlas-text leading-relaxed">{activeDraft.content}</p>
          {activeDraft.status === "APPROVED" && (
            <span className="inline-block mt-3 text-xs text-atlas-success bg-atlas-success/10 px-2 py-1 rounded">
              Shipped
            </span>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-6 text-center text-atlas-text-secondary">
          <p>No drafts yet. Feed some content above to get started.</p>
        </div>
      )}

      {/* Indicators */}
      {activeDraft && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-atlas-surface border border-glass-border border-l-4 border-l-atlas-success rounded-2xl p-4">
            <p className="text-atlas-text-secondary text-xs uppercase tracking-wider">Confidence</p>
            <p className="text-atlas-success font-heading text-2xl font-bold">
              {activeDraft.confidence ? `${Math.round(activeDraft.confidence * 100)}%` : "—"}
            </p>
          </div>
          <div className="bg-atlas-surface border border-glass-border border-l-4 border-l-atlas-teal rounded-2xl p-4">
            <p className="text-atlas-text-secondary text-xs uppercase tracking-wider">Predicted engagement</p>
            <p className="text-atlas-teal font-heading text-2xl font-bold">
              {activeDraft.predictedEngagement ? `~${(activeDraft.predictedEngagement / 1000).toFixed(1)}K` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Generate Visual */}
      {activeDraft && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateVisual("quote_card")}
              disabled={generatingImage}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-atlas-surface border border-glass-border text-atlas-text-secondary hover:text-atlas-teal hover:border-atlas-teal transition-colors disabled:opacity-50"
            >
              {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
              {generatingImage ? "Generating…" : "Generate visual"}
            </button>
            <select
              onChange={(e) => handleGenerateVisual(e.target.value)}
              disabled={generatingImage}
              className="bg-atlas-surface border border-glass-border rounded-lg px-2 py-2 text-xs text-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
            >
              <option value="">Style…</option>
              <option value="infographic">Infographic</option>
              <option value="quote_card">Quote Card</option>
              <option value="thumbnail">Thumbnail</option>
            </select>
          </div>

          {/* Visual Concept Display */}
          {visualConcept?.concept && (
            <div className="mt-3 bg-atlas-nav border border-glass-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-atlas-teal" />
                <span className="text-xs text-atlas-teal uppercase tracking-wide">Visual Concept</span>
              </div>
              <p className="text-sm text-atlas-text">{visualConcept.concept.concept}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-atlas-text-secondary">Colors:</span>
                {visualConcept.concept.colorScheme?.map((color, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-glass-border" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <p className="text-xs text-atlas-text-secondary mt-1">Layout: {visualConcept.concept.layout}</p>
            </div>
          )}
        </div>
      )}

      {/* Version Tabs */}
      {versionDrafts.length > 0 && (
        <div className="mt-6 flex gap-2">
          {versionDrafts.map((draft, i) => (
            <button
              key={draft.id}
              type="button"
              onClick={() => { setActiveVersion(i); setActiveDraft(draft); setVisualConcept(null); }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeVersion === i
                  ? "text-atlas-teal border-b-2 border-atlas-teal"
                  : "text-atlas-text-secondary hover:text-atlas-text"
              }`}
            >
              Version {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {activeDraft && activeDraft.status !== "APPROVED" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <GradientButton variant="outline-success" onClick={handleShip} disabled={loading || creating}>
            {loading ? "Shipping…" : "Ship it"}
          </GradientButton>
          <GradientButton variant="outline-warning" onClick={() => document.getElementById("feedback-input")?.focus()}>
            Not quite — tell me what&apos;s off
          </GradientButton>
          <GradientButton variant="outline-teal" onClick={handleTryAgain} disabled={creating}>
            {creating ? "Regenerating…" : "Try again"}
          </GradientButton>
        </div>
      )}

      {/* Feedback — hide after shipping */}
      {activeDraft && activeDraft.status !== "APPROVED" && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <input
              id="feedback-input"
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFeedback(); }}
              placeholder="Tell me what's off — type or drop a voice note."
              className="flex-1 bg-atlas-surface rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-glass-border focus:outline-none focus:border-atlas-teal"
            />
            <button
              type="button"
              className="p-3 bg-atlas-surface rounded-lg border border-glass-border text-atlas-text-secondary hover:text-atlas-teal transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <p className="text-atlas-text-muted text-sm italic mt-2">
            Don&apos;t worry about hurting my feelings.
          </p>
        </div>
      )}
    </AppShell>
  );
}
