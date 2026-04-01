"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft } from "@/lib/api";

interface StyleCard {
  tweet: string;
  subtext?: string;
  blend: string;
  engagement: string;
  authorHandle?: string;
}

export default function TeamLibraryPage() {
  const { token } = useAuth();
  const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const draftsRes = await api.drafts.list(token, "APPROVED");
      const drafts = draftsRes.drafts;

      const cards: StyleCard[] = drafts.slice(0, 6).map((d: TweetDraft) => ({
        tweet: d.content,
        blend: "Team voice",
        engagement: d.predictedEngagement
          ? `${(d.predictedEngagement / 1000).toFixed(1)}k`
          : d.actualEngagement
          ? `${(d.actualEngagement / 1000).toFixed(1)}k`
          : "—",
      }));
      setStyleCards(cards);
      setTotalCount(drafts.length);
    } catch (e: any) {
      setError(e.message || "Failed to load team library");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppShell>
      {error && (
        <div role="alert" className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-4xl text-atlas-text">
          Team Style Library
        </h1>
        <p className="text-atlas-text-secondary mt-2">
          Curated editorial voices for the next generation of DeFi communication.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {["By analyst", "By voice type", "By engagement"].map((filter) => (
          <select
            key={filter}
            className="bg-atlas-surface border border-glass-border rounded-lg px-4 py-2.5 text-sm text-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          >
            <option>{filter}</option>
          </select>
        ))}
      </div>

      {/* Masonry Grid */}
      {loading && (
        <div className="columns-1 md:columns-2 gap-6 space-y-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="break-inside-avoid bg-atlas-surface border border-glass-border rounded-2xl p-8 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4 border-t border-glass-border space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}
      {styleCards.length === 0 && !loading && (
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-12 text-center mb-8">
          <p className="text-atlas-text-secondary">No approved styles yet. Approve drafts in Crafting to build the library.</p>
        </div>
      )}
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {styleCards.map((card, i) => (
          <div key={i} className="bg-atlas-surface border border-glass-border rounded-2xl p-8 flex flex-col">
            <p className="text-lg text-atlas-text leading-relaxed">{card.tweet}</p>
            {card.subtext && (
              <p className="text-sm text-atlas-text-secondary mt-3 italic">{card.subtext}</p>
            )}
            <div className="mt-auto pt-4 border-t border-glass-border">
              <p className="text-sm text-atlas-text-secondary font-medium">{card.blend}</p>
              <p className="text-xs text-atlas-teal font-bold mt-1">{card.engagement} Engagement</p>
            </div>
            <div className="mt-3 flex gap-4">
              <button type="button" className="text-xs font-bold text-atlas-teal hover:underline">Use this style</button>
              <button type="button" className="text-xs font-bold text-atlas-text-secondary hover:text-atlas-text">Preview</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer count */}
      <p className="text-sm text-atlas-text-secondary mt-6 text-center">
        {styleCards.length} styles shown out of {totalCount}
      </p>

      {/* Management Bar */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <button type="button" className="text-sm font-bold text-atlas-text hover:text-atlas-teal transition-colors">Manage All</button>
        <GradientButton>Push a style to all</GradientButton>
      </div>
    </AppShell>
  );
}
