"use client";

import { useState, useCallback, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Search, Loader2, FileText, Bell, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, Alert, TrendingTopic, ResearchResultData } from "@/lib/api";
import Link from "next/link";

interface SearchResults {
  drafts: TweetDraft[];
  alerts: Alert[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [research, setResearch] = useState<ResearchResultData | null>(null);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trending topics on mount
  useEffect(() => {
    setLoadingTrending(true);
    api.trending.topics()
      .then(({ topics }) => setTrending(topics))
      .catch(() => { /* trending is optional */ })
      .finally(() => setLoadingTrending(false));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!user || !query.trim()) return;
    setSearching(true);
    setResearch(null);
    setError(null);
    try {
      const [draftsRes, alertsRes] = await Promise.all([
        api.drafts.list(),
        api.alerts.feed(),
      ]);

      const q = query.toLowerCase();
      const filteredDrafts = draftsRes.drafts.filter((d) =>
        d.content.toLowerCase().includes(q) || d.sourceType?.toLowerCase().includes(q)
      );
      const filteredAlerts = alertsRes.alerts.filter((a) =>
        a.title.toLowerCase().includes(q) || a.context?.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)
      );

      setResults({ drafts: filteredDrafts, alerts: filteredAlerts });
    } catch (e) {
      console.error("Search failed:", e);
      setResults({ drafts: [], alerts: [] });
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleResearch = useCallback(async (topic?: string) => {
    const q = topic || query;
    if (!q.trim()) return;
    setResearching(true);
    setError(null);
    try {
      const { result } = await api.research.conduct(q.trim());
      setResearch(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Research failed";
      setError(msg);
    } finally {
      setResearching(false);
    }
  }, [query]);

  const sentimentColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "bullish": return "text-atlas-success";
      case "bearish": return "text-atlas-error";
      case "mixed": return "text-atlas-warning";
      default: return "text-atlas-text-secondary";
    }
  };

  const totalResults = results ? results.drafts.length + results.alerts.length : 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Search className="w-12 h-12 text-atlas-text-secondary mb-6" />
          <h1 className="font-heading text-2xl text-atlas-text">Search & Research</h1>
          <p className="text-atlas-text-secondary mt-2 max-w-md">
            Search your drafts and alerts, explore trending topics, or deep-dive with AI research.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search drafts, alerts, or enter a research topic..."
            className="flex-1 bg-atlas-surface border border-glass-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="p-3 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text-secondary hover:text-atlas-teal transition-colors disabled:opacity-50"
            title="Search drafts & alerts"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => handleResearch()}
            disabled={researching || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-atlas-teal to-atlas-steel rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            title="Deep research with AI"
          >
            {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Research
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-2 hover:text-red-300">&#10005;</button>
          </div>
        )}

        {/* Trending Topics */}
        {trending.length > 0 && !results && !research && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-atlas-teal" />
              <h2 className="text-sm font-medium text-atlas-text">Trending Topics</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trending.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => { setQuery(topic.topic); handleResearch(topic.topic); }}
                  className="text-left bg-atlas-surface border border-glass-border rounded-xl p-4 hover:border-atlas-teal/50 transition-colors group"
                >
                  <p className="text-sm text-atlas-text font-medium group-hover:text-atlas-teal transition-colors">
                    {topic.headline}
                  </p>
                  {topic.context && (
                    <p className="text-xs text-atlas-text-secondary mt-1 line-clamp-2">{topic.context}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {topic.sentiment && (
                      <span className={`text-xs font-medium ${sentimentColor(topic.sentiment)}`}>
                        {topic.sentiment}
                      </span>
                    )}
                    {topic.relevance != null && (
                      <span className="text-xs text-atlas-text-muted">
                        Relevance: {Math.round(topic.relevance * 100)}%
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingTrending && !results && (
          <div className="mt-8 flex items-center justify-center gap-2 text-atlas-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading trending topics...
          </div>
        )}

        {/* Research Result */}
        {research && (
          <div className="mt-8 bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-atlas-teal" />
              <h2 className="text-sm font-medium text-atlas-text">Research: {research.query}</h2>
              <span className={`ml-auto text-xs font-medium ${sentimentColor(research.sentiment)}`}>
                {research.sentiment}
              </span>
            </div>
            <p className="text-sm text-atlas-text leading-relaxed">{research.summary}</p>

            {research.keyFacts.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-atlas-text-secondary uppercase tracking-wide mb-2">Key Facts</p>
                <ul className="space-y-1">
                  {research.keyFacts.map((fact, i) => (
                    <li key={i} className="text-sm text-atlas-text-secondary flex items-start gap-2">
                      <span className="text-atlas-teal mt-0.5">&#8226;</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {research.relatedTopics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {research.relatedTopics.map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setQuery(topic); handleResearch(topic); }}
                    className="px-2 py-1 text-xs rounded-full bg-atlas-surface border border-glass-border text-atlas-text-secondary hover:border-atlas-teal hover:text-atlas-teal transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs text-atlas-text-muted">
                Confidence: {Math.round(research.confidence * 100)}%
              </span>
              <Link
                href="/crafting"
                className="ml-auto flex items-center gap-1.5 text-xs text-atlas-teal hover:underline"
              >
                Craft a tweet from this <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Empty state — before any search */}
        {!results && !research && trending.length === 0 && !loadingTrending && (
          <div className="mt-10 text-center space-y-4">
            <p className="text-sm text-atlas-text-secondary">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["DeFi", "thread ideas", "ZK rollups", "market analysis", "engagement tips"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => { setQuery(term); }}
                  className="px-3 py-1.5 text-xs rounded-full bg-atlas-surface border border-glass-border text-atlas-text-secondary hover:border-atlas-teal hover:text-atlas-teal transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {!user && query && (
          <p className="text-atlas-text-muted text-sm mt-6 text-center">
            Sign in to search your drafts and alerts.
          </p>
        )}

        {/* Draft & Alert Results */}
        {results && (
          <div className="mt-8 space-y-6">
            <p className="text-sm text-atlas-text-secondary">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>

            {/* Drafts */}
            {results.drafts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-atlas-teal" />
                  <h2 className="text-sm font-medium text-atlas-text">Drafts ({results.drafts.length})</h2>
                </div>
                <div className="space-y-3">
                  {results.drafts.slice(0, 5).map((draft) => (
                    <Link key={draft.id} href="/crafting" className="block bg-atlas-surface border border-glass-border rounded-xl p-4 hover:border-atlas-teal/50 transition-colors">
                      <p className="text-sm text-atlas-text line-clamp-2">{draft.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-atlas-text-secondary">{draft.status}</span>
                        <span className="text-xs text-atlas-text-muted">{new Date(draft.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {results.alerts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-atlas-teal" />
                  <h2 className="text-sm font-medium text-atlas-text">Alerts ({results.alerts.length})</h2>
                </div>
                <div className="space-y-3">
                  {results.alerts.slice(0, 5).map((alert) => (
                    <Link key={alert.id} href="/alerts" className="block bg-atlas-surface border border-glass-border rounded-xl p-4 hover:border-atlas-teal/50 transition-colors">
                      <p className="text-sm text-atlas-text">{alert.title}</p>
                      <span className="text-xs text-atlas-text-secondary mt-1">{alert.type}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="text-center py-8">
                <p className="text-atlas-text-muted text-sm">No results found.</p>
                <button
                  type="button"
                  onClick={() => handleResearch()}
                  className="mt-3 text-sm text-atlas-teal hover:underline"
                >
                  Try AI research instead
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
