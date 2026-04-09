"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  Megaphone,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign, TweetDraft } from "@/lib/api";

const STATUS_BADGES: Record<Campaign["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Planning", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  ACTIVE: { label: "Live", cls: "bg-atlas-teal/20 text-atlas-teal" },
  COMPLETED: { label: "Done", cls: "bg-atlas-success/20 text-atlas-success" },
  PAUSED: { label: "Paused", cls: "bg-atlas-warning/20 text-atlas-warning" },
};

const DRAFT_STATUS: Record<TweetDraft["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  APPROVED: { label: "Approved", cls: "bg-atlas-teal/20 text-atlas-teal" },
  SCHEDULED: { label: "Scheduled", cls: "bg-atlas-warning/20 text-atlas-warning" },
  POSTED: { label: "Posted", cls: "bg-atlas-success/20 text-atlas-success" },
  ARCHIVED: { label: "Archived", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user || !id) return;
    try {
      const { campaign: data } = await api.campaigns.get(id);
      setCampaign(data);
      setEditName(data.name);
      setEditDesc(data.description || "");
    } catch {
      setError("Campaign not found");
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!campaign || !editName.trim()) return;
    setSaving(true);
    try {
      const { campaign: updated } = await api.campaigns.update(campaign.id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
      });
      setCampaign(updated);
      setEditing(false);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: Campaign["status"]) => {
    if (!campaign) return;
    try {
      const { campaign: updated } = await api.campaigns.update(campaign.id, { status });
      setCampaign(updated);
    } catch { /* silent */ }
  };

  const handleRemoveDraft = async (draftId: string) => {
    if (!campaign) return;
    try {
      await api.campaigns.removeDraft(campaign.id, draftId);
      setCampaign((prev) =>
        prev
          ? {
              ...prev,
              draftCount: prev.draftCount - 1,
              drafts: prev.drafts?.filter((d) => d.id !== draftId),
            }
          : prev
      );
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    await api.campaigns.delete(campaign.id);
    router.push("/campaigns");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 font-body sm:px-6">
        <Link
          href="/campaigns"
          className="mb-6 inline-flex items-center gap-1 text-sm text-atlas-text-muted transition-colors hover:text-atlas-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
          </div>
        ) : error || !campaign ? (
          <GlassCard className="p-10 text-center">
            <p className="text-sm text-atlas-text-secondary">{error || "Campaign not found"}</p>
          </GlassCard>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              {editing ? (
                <GlassCard className="p-5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-base font-semibold text-atlas-text focus:border-atlas-teal focus:outline-none"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Campaign thesis / description"
                    rows={2}
                    className="mb-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <GradientButton onClick={handleSave} disabled={!editName.trim() || saving}>
                      {saving ? "Saving..." : "Save"}
                    </GradientButton>
                    <button
                      onClick={() => { setEditing(false); setEditName(campaign.name); setEditDesc(campaign.description || ""); }}
                      className="rounded-lg border border-glass-border px-4 py-2 text-sm text-atlas-text-muted hover:text-atlas-text"
                    >
                      Cancel
                    </button>
                  </div>
                </GlassCard>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-6 w-6 text-atlas-teal" />
                      <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
                        {campaign.name}
                      </h1>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGES[campaign.status].cls}`}>
                        {STATUS_BADGES[campaign.status].label}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="mt-2 text-sm text-atlas-text-secondary">{campaign.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-atlas-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span>{campaign.draftCount} post{campaign.draftCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-atlas-text-muted transition-colors hover:text-atlas-text"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="rounded-lg p-2 text-atlas-text-muted transition-colors hover:text-atlas-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status controls */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-xs text-atlas-text-muted">Status:</span>
              {(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"] as Campaign["status"][]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    campaign.status === s
                      ? STATUS_BADGES[s].cls
                      : "text-atlas-text-muted hover:text-atlas-text"
                  }`}
                >
                  {STATUS_BADGES[s].label}
                </button>
              ))}
            </div>

            {/* Progress + engagement summary */}
            {campaign.drafts && campaign.drafts.length > 0 && (() => {
              const totalDrafts = campaign.drafts.length;
              const postedDrafts = campaign.drafts.filter((d) => d.status === "POSTED").length;
              const scheduledDrafts = campaign.drafts.filter((d) => d.status === "SCHEDULED").length;
              const queuedDrafts = campaign.drafts.filter((d) => d.status === "APPROVED" || d.status === "DRAFT").length;
              const progressPct = Math.round((postedDrafts / totalDrafts) * 100);
              const totalEngagement = campaign.drafts.reduce(
                (acc, d) => acc + (d.actualEngagement ?? 0),
                0,
              );
              const predictedEngagement = campaign.drafts.reduce(
                (acc, d) => acc + (d.predictedEngagement ?? 0),
                0,
              );
              return (
                <GlassCard className="mb-6 p-5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-atlas-text-muted">
                      Campaign Progress
                    </span>
                    <span className="text-sm font-semibold text-atlas-text">
                      {postedDrafts}/{totalDrafts} posted ({progressPct}%)
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-atlas-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-atlas-teal to-atlas-teal/60 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <div className="text-atlas-text-muted">Scheduled</div>
                      <div className="mt-0.5 text-base font-semibold text-atlas-text">{scheduledDrafts}</div>
                    </div>
                    <div>
                      <div className="text-atlas-text-muted">In Queue</div>
                      <div className="mt-0.5 text-base font-semibold text-atlas-text">{queuedDrafts}</div>
                    </div>
                    <div>
                      <div className="text-atlas-text-muted">Engagement</div>
                      <div className="mt-0.5 text-base font-semibold text-atlas-text">
                        {totalEngagement.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-atlas-text-muted">Predicted</div>
                      <div className="mt-0.5 text-base font-semibold text-atlas-text">
                        {predictedEngagement.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })()}

            {/* Drafts */}
            <div>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-atlas-text-muted">
                Posts ({campaign.drafts?.length ?? campaign.draftCount})
              </h2>
              {!campaign.drafts || campaign.drafts.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-atlas-text-muted" />
                  <p className="text-sm text-atlas-text-secondary">
                    No posts in this campaign yet. Generate drafts from the{" "}
                    <Link href="/campaigns/wizard" className="text-atlas-teal hover:underline">
                      Campaign Wizard
                    </Link>{" "}
                    or add existing drafts.
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {campaign.drafts.map((draft) => {
                    const badge = DRAFT_STATUS[draft.status];
                    return (
                      <GlassCard key={draft.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                                {badge.label}
                              </span>
                              {draft.confidence != null && (
                                <span className="text-[10px] text-atlas-text-muted">
                                  {Math.round(draft.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-atlas-text">{draft.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-atlas-text-muted">
                              <span>
                                {new Date(draft.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                              {draft.sourceType && <span>· {draft.sourceType}</span>}
                              {draft.scheduledAt && (
                                <span className="text-atlas-warning">
                                  · scheduled {new Date(draft.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                              {draft.actualEngagement != null && draft.actualEngagement > 0 && (
                                <span className="text-atlas-success">
                                  · {draft.actualEngagement.toLocaleString()} engagement
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveDraft(draft.id)}
                            className="shrink-0 rounded-lg p-2 text-atlas-text-muted transition-colors hover:text-atlas-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
