"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import ContentInput from "@/components/ui/ContentInput";
import GradientButton from "@/components/ui/GradientButton";
import { Mic, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, AnalyticsSummary } from "@/lib/api";

export default function CraftingPage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<TweetDraft | null>(null);
  const [activeVersion, setActiveVersion] = useState(0);
  const [blendValue, setBlendValue] = useState(30);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!token) return;
    try {
      const { drafts: d } = await api.drafts.list(token);
      setDrafts(d);
      if (d.length > 0 && !activeDraft) {
        setActiveDraft(d[0]);
      }
    } catch (e) {
      console.error("Failed to load drafts:", e);
    }
  }, [token, activeDraft]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const { summary: s } = await api.analytics.summary(token);
      setSummary(s);
    } catch (e) {
      console.error("Failed to load summary:", e);
    }
  }, [token]);

  useEffect(() => {
    loadDrafts();
    loadSummary();
  }, [loadDrafts, loadSummary]);

  const handleCreateDraft = async (text: string) => {
    if (!token || !text.trim()) return;
    setCreating(true);
    try {
      const { draft } = await api.drafts.create(token, text.trim(), "MANUAL");
      setDrafts((prev) => [draft, ...prev]);
      setActiveDraft(draft);
      setActiveVersion(0);
    } catch (e) {
      console.error("Failed to create draft:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleShip = async () => {
    if (!token || !activeDraft) return;
    setLoading(true);
    try {
      const { draft } = await api.drafts.update(token, activeDraft.id, { status: "APPROVED" });
      setActiveDraft(draft);
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? draft : d)));
    } catch (e) {
      console.error("Failed to ship draft:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!token || !activeDraft || !feedback.trim()) return;
    setLoading(true);
    try {
      const { draft } = await api.drafts.update(token, activeDraft.id, { feedback: feedback.trim() });
      setActiveDraft(draft);
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? draft : d)));
      setFeedback("");
    } catch (e) {
      console.error("Failed to submit feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !activeDraft) return;
    setLoading(true);
    try {
      await api.drafts.delete(token, activeDraft.id);
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

      {/* Content Input Zone */}
      <div className="mt-6">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Feed Atlas content — it crafts the tweet in your voice.
        </label>
        <div className="mt-3">
          <ContentInput onTextSubmit={handleCreateDraft} />
          {creating && (
            <div className="flex items-center gap-2 mt-2 text-atlas-text-secondary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating draft…
            </div>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-6 py-3">
        <select className="bg-atlas-nav border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none focus:border-atlas-teal">
          <option>My voice</option>
          <option>Blended</option>
          <option>Specific person</option>
        </select>
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-sm text-atlas-text-secondary shrink-0">Blend:</span>
          <input
            type="range" min={0} max={100} value={blendValue}
            onChange={(e) => setBlendValue(Number(e.target.value))}
            className="flex-1 accent-atlas-teal"
          />
          <span className="text-sm text-atlas-text w-10 text-right">{blendValue}%</span>
        </div>
        <button type="button" className="text-atlas-teal text-sm hover:underline shrink-0">
          Share this style with team
        </button>
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

      {/* Version Tabs */}
      {versionDrafts.length > 0 && (
        <div className="mt-6 flex gap-2">
          {versionDrafts.map((draft, i) => (
            <button
              key={draft.id}
              type="button"
              onClick={() => { setActiveVersion(i); setActiveDraft(draft); }}
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
          <GradientButton variant="outline-success" onClick={handleShip} disabled={loading}>
            {loading ? "Shipping…" : "Ship it"}
          </GradientButton>
          <GradientButton variant="outline-warning" onClick={() => document.getElementById("feedback-input")?.focus()}>
            Not quite — tell me what&apos;s off
          </GradientButton>
          <GradientButton variant="outline-teal" onClick={handleDelete} disabled={loading}>
            Discard
          </GradientButton>
        </div>
      )}

      {/* Feedback */}
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
    </AppShell>
  );
}
