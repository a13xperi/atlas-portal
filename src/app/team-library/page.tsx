"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, TeamDraft } from "@/lib/api";

export default function TeamLibraryPage() {
  const { user } = useAuth();
  const [libraryItems, setLibraryItems] = useState<TeamDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const draftsRes = await api.drafts.team(6);
      setLibraryItems(draftsRes.drafts);
      setTotalCount(draftsRes.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load team library");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const sortedItems = useMemo(() => {
    const items = [...(libraryItems ?? [])];
    if (sortBy === "engagement") items.sort((a, b) => (b.actualEngagement ?? 0) - (a.actualEngagement ?? 0));
    if (sortBy === "confidence") items.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    if (sortBy === "recent") items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  }, [libraryItems, sortBy]);

  const visibleItems = useMemo(() => {
    if (filterBy === "with-engagement") {
      return sortedItems.filter((item) => (item.actualEngagement ?? 0) > 0);
    }
    if (filterBy === "with-confidence") {
      return sortedItems.filter((item) => (item.confidence ?? 0) > 0);
    }
    return sortedItems;
  }, [filterBy, sortedItems]);

  function formatEngagement(item: TeamDraft) {
    const engagement = item.predictedEngagement ?? item.actualEngagement;
    return engagement ? `${(engagement / 1000).toFixed(1)}k` : "—";
  }

  return (
    <AppShell>
      {error && (
        <div role="alert" className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-extrabold tracking-tight text-2xl sm:text-4xl text-atlas-text">
          Team Style Library
        </h1>
        <p className="text-atlas-text-secondary mt-2">
          Curated editorial voices for the next generation of DeFi communication.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          aria-label="Sort team library styles"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-atlas-surface rounded-lg text-atlas-text-secondary px-3 py-2 text-sm border border-glass-border focus:outline-none focus:border-atlas-teal"
        >
          <option value="recent">Most Recent</option>
          <option value="engagement">Highest Engagement</option>
          <option value="confidence">Highest Confidence</option>
        </select>
        <select
          aria-label="Filter team library styles"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="bg-atlas-surface rounded-lg text-atlas-text-secondary px-3 py-2 text-sm border border-glass-border focus:outline-none focus:border-atlas-teal"
        >
          <option value="all">All Styles</option>
          <option value="with-engagement">With Engagement</option>
          <option value="with-confidence">With Confidence</option>
        </select>
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
      {visibleItems.length === 0 && !loading && (
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-12 text-center mb-8">
          <p className="text-atlas-text-secondary">No approved styles yet. Approve drafts in Crafting to build the library.</p>
        </div>
      )}
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="card-interactive flex flex-col rounded-2xl border border-glass-border bg-atlas-surface p-8"
          >
            <p className="text-lg text-atlas-text leading-relaxed">{item.content}</p>
            {item.feedback && (
              <p className="text-sm text-atlas-text-secondary mt-3 italic">{item.feedback}</p>
            )}
            <div className="mt-auto pt-4 border-t border-glass-border">
              <div className="flex items-center gap-2 mt-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-delphi-blue-500 to-atlas-teal flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {item.user?.handle?.[0]?.toUpperCase() || item.user?.displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-xs text-atlas-text-secondary truncate">
                  {item.user?.displayName || item.user?.handle || "Unknown"}
                </span>
              </div>
              {item.blendName && (
                <span className="text-[10px] text-atlas-teal">
                  via {item.blendName}
                </span>
              )}
              <p className="text-sm text-atlas-text-secondary font-medium">Team voice</p>
              <p className="text-xs text-atlas-teal font-bold mt-1">{formatEngagement(item)} Engagement</p>
            </div>
            <div className="mt-3 flex gap-4">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(item.content);
                }}
                className="text-xs font-bold text-atlas-teal hover:underline"
              >
                Use this style
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="text-xs font-bold text-atlas-text-secondary opacity-50 cursor-not-allowed"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer count */}
      <p className="text-sm text-atlas-text-secondary mt-6 text-center">
        {visibleItems.length} styles shown out of {totalCount}
      </p>

      {/* Management Bar */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <button
          type="button"
          disabled
          title="Coming soon"
          className="text-sm font-bold text-atlas-text transition-colors opacity-50 cursor-not-allowed"
        >
          Manage All
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="gradient-cta px-6 py-3 text-sm opacity-50 cursor-not-allowed"
        >
          Push a style to all
        </button>
      </div>
    </AppShell>
  );
}
