"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign, TweetDraft } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-atlas-text-muted/20 text-atlas-text-muted",
  SCHEDULED: "bg-atlas-warning/20 text-atlas-warning",
  POSTED: "bg-atlas-success/20 text-atlas-success",
  APPROVED: "bg-atlas-teal/20 text-atlas-teal",
  ARCHIVED: "bg-atlas-error/20 text-atlas-error",
};

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const load = useCallback(async () => {
    if (!user || !campaignId) return;
    try {
      const { campaign: data } = await api.campaigns.get(campaignId);
      setCampaign(data);
    } catch {
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => { load(); }, [load]);

  const handleRemoveDraft = async (draftId: string) => {
    await api.campaigns.removeDraft(campaignId, draftId);
    load();
  };

  const handleSchedule = async (draftId: string) => {
    if (!scheduleDate) return;
    await api.drafts.schedule(draftId, new Date(scheduleDate).toISOString());
    setScheduling(null);
    setScheduleDate("");
    load();
  };

  const handleStatusChange = async (status: Campaign["status"]) => {
    await api.campaigns.update(campaignId, { status });
    load();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      </AppShell>
    );
  }

  if (!campaign) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-10 text-center">
          <p className="text-atlas-text-secondary">Campaign not found.</p>
        </div>
      </AppShell>
    );
  }

  const drafts = campaign.drafts ?? [];
  const scheduledCount = drafts.filter((d) => d.scheduledAt).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 font-body sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/campaigns")}
          className="mb-6 flex items-center gap-1.5 text-sm text-atlas-text-muted transition-colors hover:text-atlas-teal"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </button>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
              {campaign.name}
            </h1>
            {campaign.description && (
              <p className="mt-1 text-sm text-atlas-text-secondary">{campaign.description}</p>
            )}
            <p className="mt-2 text-xs text-atlas-text-muted">
              {drafts.length} draft{drafts.length !== 1 ? "s" : ""} &middot; {scheduledCount} scheduled
            </p>
          </div>
          <div className="flex gap-2">
            {campaign.status === "DRAFT" && (
              <GradientButton onClick={() => handleStatusChange("ACTIVE")}>
                Activate
              </GradientButton>
            )}
            {campaign.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => handleStatusChange("PAUSED")}
                className="rounded-lg border border-atlas-warning/40 bg-atlas-warning/10 px-3 py-2 text-xs font-semibold text-atlas-warning"
              >
                Pause
              </button>
            )}
            {campaign.status === "PAUSED" && (
              <GradientButton onClick={() => handleStatusChange("ACTIVE")}>
                Resume
              </GradientButton>
            )}
          </div>
        </div>

        {drafts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-atlas-text-muted" />
            <p className="text-sm text-atlas-text-secondary">
              No drafts in this campaign. Add drafts from the Crafting Station.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft, idx) => (
              <GlassCard key={draft.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 items-center gap-1 pt-0.5 text-atlas-text-muted">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-mono">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-atlas-text">
                      {draft.content.length > 200 ? draft.content.slice(0, 200) + "…" : draft.content}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[draft.status] ?? ""}`}>
                        {draft.status}
                      </span>
                      {draft.scheduledAt && (
                        <span className="flex items-center gap-1 text-[10px] text-atlas-warning">
                          <Clock className="h-3 w-3" />
                          {new Date(draft.scheduledAt).toLocaleString()}
                        </span>
                      )}
                      <span className="text-[10px] text-atlas-text-muted">
                        {draft.content.length}/280
                      </span>
                    </div>

                    {scheduling === draft.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="rounded-lg border border-glass-border bg-atlas-surface px-3 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSchedule(draft.id)}
                          disabled={!scheduleDate}
                          className="rounded-lg bg-atlas-teal/20 px-3 py-1.5 text-xs font-semibold text-atlas-teal disabled:opacity-50"
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          onClick={() => { setScheduling(null); setScheduleDate(""); }}
                          className="text-xs text-atlas-text-muted hover:text-atlas-text"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {!draft.scheduledAt && scheduling !== draft.id && (
                      <button
                        type="button"
                        onClick={() => setScheduling(draft.id)}
                        className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-warning"
                        title="Schedule"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDraft(draft.id)}
                      className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-error"
                      title="Remove from campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
