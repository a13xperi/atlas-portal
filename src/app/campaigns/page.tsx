"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ListOrdered,
  Loader2,
  Megaphone,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, Campaign } from "@/lib/api";

const STATUS_BADGES: Record<Campaign["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Planning", cls: "bg-atlas-text-muted/20 text-atlas-text-muted" },
  ACTIVE: { label: "Live", cls: "bg-atlas-teal/20 text-atlas-teal" },
  COMPLETED: { label: "Done", cls: "bg-atlas-success/20 text-atlas-success" },
  PAUSED: { label: "Paused", cls: "bg-atlas-warning/20 text-atlas-warning" },
};

export default function CampaignsPage() {
  return (
    <FeatureGate flagKey="campaigns">
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

        <Link href="/queue" className="mt-6 flex items-center justify-between rounded-xl border border-glass-border bg-atlas-surface p-4 transition-colors hover:border-atlas-teal/30">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-atlas-teal" />
            <span className="text-sm text-atlas-text">Your posting queue</span>
          </div>
          <span className="text-xs text-atlas-teal">View Queue →</span>
        </Link>

        <CampaignsTab />
      </div>
    </AppShell>
    </FeatureGate>
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
        <div className="flex items-center gap-2">
          <Link
            href="/campaigns/wizard"
            className="inline-flex items-center justify-center rounded-lg border border-atlas-teal bg-transparent px-4 py-2 text-sm font-semibold text-atlas-teal transition-all duration-200 hover:bg-atlas-teal/10"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Campaign Wizard
          </Link>
          <GradientButton onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Campaign
          </GradientButton>
        </div>
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

