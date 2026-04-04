"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Flag,
  Loader2,
  Megaphone,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign, TweetDraft } from "@/lib/api";

type TopTab = "campaigns" | "queue";

const STATUS_BADGES: Record<Campaign["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Planning", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  ACTIVE: { label: "Live", cls: "bg-atlas-teal/20 text-atlas-teal" },
  COMPLETED: { label: "Done", cls: "bg-atlas-success/20 text-atlas-success" },
  PAUSED: { label: "Paused", cls: "bg-atlas-warning/20 text-atlas-warning" },
};

type QueueTab = "approved" | "draft" | "posted";

const QUEUE_TABS: { id: QueueTab; label: string; status: TweetDraft["status"] }[] = [
  { id: "approved", label: "Ready to Post", status: "APPROVED" },
  { id: "draft", label: "Drafts", status: "DRAFT" },
  { id: "posted", label: "Posted", status: "POSTED" },
];

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [topTab, setTopTab] = useState<TopTab>(tabParam === "queue" ? "queue" : "campaigns");

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 font-body sm:px-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-atlas-teal" />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
            Campaigns
          </h1>
        </div>
        <p className="mt-2 text-sm text-atlas-text-secondary">
          Define narratives, group your posts, and manage your posting queue.
        </p>

        <div className="mt-6 inline-flex rounded-xl border border-glass-border bg-glass/50 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setTopTab("campaigns")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${
              topTab === "campaigns"
                ? "bg-gradient-to-r from-atlas-teal to-atlas-teal/60 text-white"
                : "text-atlas-text-secondary hover:text-white"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Campaigns
          </button>
          <button
            type="button"
            onClick={() => setTopTab("queue")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${
              topTab === "queue"
                ? "bg-gradient-to-r from-atlas-teal to-atlas-teal/60 text-white"
                : "text-atlas-text-secondary hover:text-white"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Queue
          </button>
        </div>

        {topTab === "campaigns" ? <CampaignsTab /> : <QueueSection />}
      </div>
    </AppShell>
  );
}

function CampaignsTab() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newThesis, setNewThesis] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { campaigns: data = [] } = await api.campaigns.list();
      setCampaigns(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { campaign } = await api.campaigns.create(newName.trim(), newThesis.trim() || undefined);
      setCampaigns((prev) => [campaign, ...prev]);
      setNewName("");
      setNewThesis("");
      setShowCreate(false);
    } catch { /* silent */ } finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    await api.campaigns.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="mt-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-atlas-text-muted">
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
        </p>
        <GradientButton onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Campaign
        </GradientButton>
      </div>

      {showCreate && (
        <GlassCard className="mb-6 p-5">
          <h3 className="mb-3 text-sm font-semibold text-atlas-text">Define your campaign</h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Campaign name — e.g., ETH Staking Bull Case"
            className="mb-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
          />
          <textarea
            value={newThesis}
            onChange={(e) => setNewThesis(e.target.value)}
            placeholder="What's the thesis? What narrative are you championing?"
            rows={3}
            className="mb-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
          />
          <GradientButton onClick={handleCreate} disabled={!newName.trim() || creating} fullWidth>
            {creating ? "Creating…" : "Create Campaign"}
          </GradientButton>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="w-full max-w-2xl mx-auto p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-atlas-text-muted" />
          <p className="text-sm text-atlas-text-secondary">
            No campaigns yet. Create one to define a narrative and group posts around it.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const badge = STATUS_BADGES[campaign.status];
            return (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <GlassCard className="p-5 transition-colors hover:border-atlas-teal/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-atlas-text">{campaign.name}</h2>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="mt-1 text-sm text-atlas-text-secondary line-clamp-2">{campaign.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-atlas-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <span>{campaign.draftCount} post{campaign.draftCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }}
                      className="shrink-0 rounded-lg p-2 text-atlas-text-muted transition-colors hover:text-atlas-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QueueSection() {
  const { user } = useAuth();
  const [queueTab, setQueueTab] = useState<QueueTab>("approved");
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadDraftId, setThreadDraftId] = useState<string | null>(null);
  const [threadResult, setThreadResult] = useState<Record<string, string[]>>({});
  const [postingId, setPostingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentStatus = QUEUE_TABS.find((t) => t.id === queueTab)!.status;

  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setDrafts((await api.drafts.list(currentStatus)).drafts); }
    catch { setDrafts([]); }
    finally { setLoading(false); }
  }, [user, currentStatus]);

  useEffect(() => { void loadDrafts(); }, [loadDrafts]);

  const act = async (fn: () => Promise<void>, msg: string, errMsg: string) => {
    try { await fn(); setActionMessage(msg); void loadDrafts(); }
    catch { setActionMessage(errMsg); }
  };

  return (
    <div className="mt-6">
      <div className="mb-4 inline-flex rounded-lg border border-glass-border bg-atlas-surface p-0.5">
        {QUEUE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setQueueTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              queueTab === tab.id ? "bg-atlas-teal/15 text-atlas-teal" : "text-atlas-text-muted hover:text-atlas-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-glass-border bg-glass/50 px-4 py-3 text-sm text-atlas-text-secondary">
          {actionMessage}
          <button type="button" onClick={() => setActionMessage(null)} className="ml-2 text-atlas-text-muted hover:text-atlas-text">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-atlas-teal" /></div>
      ) : drafts.length === 0 ? (
        <GlassCard className="w-full max-w-2xl mx-auto p-10 text-center">
          <Send className="mx-auto mb-3 h-10 w-10 text-atlas-text-muted" />
          <p className="text-sm text-atlas-text-secondary">
            {queueTab === "approved" ? "Queue is empty. Approve drafts from Crafting." : queueTab === "posted" ? "No posts yet." : "No drafts. Generate some in Crafting."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, index) => (
            <GlassCard key={draft.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {queueTab === "approved" && (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-atlas-teal/15 text-xs font-bold text-atlas-teal">{index + 1}</span>
                  )}
                  <p className="text-sm leading-relaxed text-atlas-text">{draft.content}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {draft.confidence != null && (
                    <span className="rounded-full bg-glass px-2 py-0.5 text-[10px] text-atlas-text-muted">{Math.round(draft.confidence * 100)}%</span>
                  )}
                  <span className="text-xs text-atlas-text-muted">{draft.content.length}/280</span>
                </div>
              </div>

              {threadResult[draft.id] && (
                <div className="mt-4 space-y-2 border-t border-glass-border/50 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-teal">Thread ({threadResult[draft.id].length})</p>
                  {threadResult[draft.id].map((tweet, i) => (
                    <div key={i} className="rounded-lg border border-glass-border/50 bg-atlas-bg/30 px-3 py-2">
                      <p className="text-xs text-atlas-text-secondary"><span className="mr-1.5 font-mono text-atlas-text-muted">{i + 1}/{threadResult[draft.id].length}</span>{tweet}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-glass-border/50 pt-3">
                {queueTab === "draft" && (
                  <button type="button" onClick={() => void act(() => api.drafts.update(draft.id, { status: "APPROVED" }).then(() => {}), "Moved to queue", "Failed")}
                    className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal">
                    Add to Queue
                  </button>
                )}
                {queueTab === "approved" && (
                  <>
                    <button type="button" disabled={threadDraftId === draft.id}
                      onClick={async () => {
                        setThreadDraftId(draft.id);
                        try { const res = await api.drafts.thread(draft.id); setThreadResult((p) => ({ ...p, [draft.id]: res.thread })); }
                        catch { setActionMessage("Thread failed."); }
                        finally { setThreadDraftId(null); }
                      }}
                      className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50">
                      {threadDraftId === draft.id ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Threading…</span> : "Thread"}
                    </button>
                    <button type="button" disabled={postingId === draft.id}
                      onClick={async () => {
                        setPostingId(draft.id);
                        try { await api.drafts.postToX(draft.id); setActionMessage("Posted!"); void loadDrafts(); }
                        catch { setActionMessage("Post failed."); }
                        finally { setPostingId(null); }
                      }}
                      className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                      {postingId === draft.id ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Posting…</span> : "Post to X"}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => void act(() => api.drafts.update(draft.id, { status: "ARCHIVED" }).then(() => {}), "Archived", "Failed")}
                  className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-atlas-text-muted transition-colors hover:border-atlas-error/50 hover:text-atlas-error">
                  Archive
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
