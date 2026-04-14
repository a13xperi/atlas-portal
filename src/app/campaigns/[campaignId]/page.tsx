"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  Loader2,
  Megaphone,
  Send,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign, TweetDraft } from "@/lib/api";

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

function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    load();
  }, [load]);

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
