"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  Eye,
  Heart,
  Loader2,
  Megaphone,
  MessageCircle,
  Repeat2,
  Send,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign, CampaignAnalytics, TweetDraft } from "@/lib/api";

type FilterTab = "ALL" | "APPROVED" | "PENDING" | "POSTED";

const STATUS_BADGES: Record<Campaign["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Planning", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  ACTIVE: { label: "Live", cls: "bg-atlas-teal/20 text-atlas-teal" },
  COMPLETED: { label: "Done", cls: "bg-atlas-success/20 text-atlas-success" },
  PAUSED: { label: "Paused", cls: "bg-atlas-warning/20 text-atlas-warning" },
};

const DRAFT_STATUS: Record<TweetDraft["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Pending", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  APPROVED: { label: "Approved", cls: "bg-atlas-teal/20 text-atlas-teal" },
  SCHEDULED: { label: "Scheduled", cls: "bg-atlas-warning/20 text-atlas-warning" },
  POSTED: { label: "Posted", cls: "bg-atlas-success/20 text-atlas-success" },
  ARCHIVED: { label: "Archived", cls: "bg-atlas-error/20 text-atlas-error" },
};

const TABS: FilterTab[] = ["ALL", "APPROVED", "PENDING", "POSTED"];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [postingAll, setPostingAll] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !campaignId) return;
    try {
      const { campaign: data } = await api.campaigns.get(campaignId);
      setCampaign(data);
      setError(null);
    } catch {
      setError("Campaign not found");
    } finally {
      setLoading(false);
    }
  }, [user, campaignId]);

  const loadAnalytics = useCallback(async () => {
    if (!user || !campaignId) return;
    setAnalyticsLoading(true);
    try {
      const data = await api.campaigns.analytics(campaignId);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => {
    load();
    loadAnalytics();
  }, [load, loadAnalytics]);

  const filteredDrafts = useMemo(() => {
    if (!campaign?.drafts) return [];
    if (activeTab === "ALL") return campaign.drafts;
    if (activeTab === "APPROVED") return campaign.drafts.filter((d) => d.status === "APPROVED");
    if (activeTab === "PENDING") return campaign.drafts.filter((d) => d.status === "DRAFT");
    if (activeTab === "POSTED") return campaign.drafts.filter((d) => d.status === "POSTED");
    return campaign.drafts;
  }, [campaign?.drafts, activeTab]);

  const handlePostAll = async () => {
    if (!campaign) return;
    setPostingAll(true);
    try {
      await api.campaigns.postAll(campaign.id);
      await load();
    } catch {
      // silent
    } finally {
      setPostingAll(false);
    }
  };

  const handleApprove = async (draftId: string) => {
    setActionId(draftId);
    try {
      await api.drafts.update(draftId, { status: "APPROVED" });
      await load();
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  };

  const handlePost = async (draftId: string) => {
    setActionId(draftId);
    try {
      await api.drafts.postToX(draftId);
      await load();
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (draftId: string) => {
    setActionId(draftId);
    try {
      await api.drafts.update(draftId, { status: "ARCHIVED" });
      await load();
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  };

  const hasPostedDrafts = (campaign?.drafts?.filter((d) => d.status === "POSTED").length ?? 0) > 0;
  const chartMax = useMemo(() => {
    const vals = analytics?.daily.map((d) => d.engagement) ?? [];
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [analytics]);

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
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 text-center">
            <p className="text-sm text-atlas-text-secondary">{error || "Campaign not found"}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
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
              <GradientButton
                onClick={handlePostAll}
                disabled={postingAll || (campaign.drafts?.filter((d) => d.status === "APPROVED").length ?? 0) === 0}
                variant="outline"
              >
                {postingAll ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                Post All Approved
              </GradientButton>
            </div>

            {/* Analytics Section */}
            {hasPostedDrafts && (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-atlas-teal" />
                  <h2 className="text-sm font-semibold text-atlas-text">Performance</h2>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
                  </div>
                ) : analytics ? (
                  <div className="space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <GlassCard className="p-4 text-center">
                        <Eye className="mx-auto mb-1 h-4 w-4 text-atlas-teal" />
                        <p className="font-heading text-lg font-bold text-atlas-text">{formatNumber(analytics.totals.impressions)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Impressions</p>
                      </GlassCard>
                      <GlassCard className="p-4 text-center">
                        <Heart className="mx-auto mb-1 h-4 w-4 text-atlas-success" />
                        <p className="font-heading text-lg font-bold text-atlas-text">{formatNumber(analytics.totals.likes)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Likes</p>
                      </GlassCard>
                      <GlassCard className="p-4 text-center">
                        <Repeat2 className="mx-auto mb-1 h-4 w-4 text-atlas-warning" />
                        <p className="font-heading text-lg font-bold text-atlas-text">{formatNumber(analytics.totals.retweets)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Retweets</p>
                      </GlassCard>
                      <GlassCard className="p-4 text-center">
                        <MessageCircle className="mx-auto mb-1 h-4 w-4 text-atlas-text-secondary" />
                        <p className="font-heading text-lg font-bold text-atlas-text">{formatNumber(analytics.totals.replies)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Replies</p>
                      </GlassCard>
                    </div>

                    {/* Mini bar chart */}
                    {analytics.daily.length > 0 && (
                      <GlassCard className="p-4">
                        <p className="mb-3 text-xs font-medium text-atlas-text">Engagement over time</p>
                        <div className="flex h-28 items-end gap-1">
                          {analytics.daily.map((day) => (
                            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                              <div
                                className="w-full rounded-t bg-atlas-teal/60"
                                style={{
                                  height: `${Math.min(100, Math.max(4, (day.engagement / chartMax) * 100))}%`,
                                }}
                                title={`${day.dayLabel}: ${day.engagement.toLocaleString()}`}
                              />
                              <span className="text-[9px] text-atlas-text-muted">{day.dayLabel}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    )}

                    {/* Per-tweet engagement */}
                    {analytics.tweets.length > 0 && (
                      <GlassCard className="p-4">
                        <p className="mb-3 text-xs font-medium text-atlas-text">Per-tweet engagement</p>
                        <div className="space-y-3">
                          {analytics.tweets.map((t) => (
                            <div
                              key={t.draftId}
                              className="rounded-xl border border-glass-border bg-atlas-surface p-3"
                            >
                              <p className="line-clamp-2 text-sm text-atlas-text">{t.content}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-atlas-text-muted">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {t.impressions.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {t.likes.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Repeat2 className="h-3 w-3" />
                                  {t.retweets.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {t.replies.toLocaleString()}
                                </span>
                                {t.postedAt && (
                                  <span className="ml-auto text-[10px]">
                                    {new Date(t.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Filter tabs */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {TABS.map((tab) => {
                const count =
                  tab === "ALL"
                    ? campaign.drafts?.length ?? 0
                    : tab === "APPROVED"
                    ? campaign.drafts?.filter((d) => d.status === "APPROVED").length ?? 0
                    : tab === "PENDING"
                    ? campaign.drafts?.filter((d) => d.status === "DRAFT").length ?? 0
                    : campaign.drafts?.filter((d) => d.status === "POSTED").length ?? 0;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-atlas-teal/20 text-atlas-teal"
                        : "text-atlas-text-muted hover:text-atlas-text"
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            {/* Drafts list */}
            <div className="space-y-3">
              {filteredDrafts.length === 0 ? (
                <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 text-center">
                  <p className="text-sm text-atlas-text-secondary">
                    No {activeTab === "ALL" ? "" : activeTab.toLowerCase()} tweets in this campaign.
                  </p>
                </div>
              ) : (
                filteredDrafts.map((draft) => {
                  const badge = DRAFT_STATUS[draft.status];
                  const isActing = actionId === draft.id;
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
                        <div className="flex shrink-0 flex-col gap-2">
                          {draft.status === "DRAFT" && (
                            <button
                              onClick={() => handleApprove(draft.id)}
                              disabled={isActing}
                              className="inline-flex items-center justify-center rounded-lg border border-atlas-success px-3 py-1.5 text-xs font-medium text-atlas-success transition-colors hover:bg-atlas-success/10 disabled:opacity-50"
                            >
                              {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              <span className="ml-1">Approve</span>
                            </button>
                          )}
                          {(draft.status === "DRAFT" || draft.status === "APPROVED") && (
                            <button
                              onClick={() => handlePost(draft.id)}
                              disabled={isActing}
                              className="inline-flex items-center justify-center rounded-lg bg-atlas-teal px-3 py-1.5 text-xs font-medium text-atlas-bg transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              <span className="ml-1">Post</span>
                            </button>
                          )}
                          {draft.status !== "ARCHIVED" && draft.status !== "POSTED" && (
                            <button
                              onClick={() => handleReject(draft.id)}
                              disabled={isActing}
                              className="inline-flex items-center justify-center rounded-lg border border-atlas-error px-3 py-1.5 text-xs font-medium text-atlas-error transition-colors hover:bg-atlas-error/10 disabled:opacity-50"
                            >
                              {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              <span className="ml-1">Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default CampaignDetailPage;
