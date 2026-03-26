"use client";

import { useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { Search, Loader2, FileText, Bell, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, Alert } from "@/lib/api";
import Link from "next/link";

interface SearchResults {
  drafts: TweetDraft[];
  alerts: Alert[];
}

export default function SearchPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!token || !query.trim()) return;
    setSearching(true);
    try {
      const [draftsRes, alertsRes] = await Promise.all([
        api.drafts.list(token),
        api.alerts.feed(token),
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
  }, [token, query]);

  const totalResults = results ? results.drafts.length + results.alerts.length : 0;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex flex-col items-center text-center mb-8">
          <Search className="w-12 h-12 text-atlas-text-secondary mb-6" />
          <h1 className="font-heading text-2xl text-atlas-text">Search Atlas</h1>
          <p className="text-atlas-text-secondary mt-2 max-w-md">
            Search across drafts, alerts, and team content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search drafts, alerts, styles..."
            className="flex-1 bg-atlas-surface border border-glass-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="p-3 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text-secondary hover:text-atlas-teal transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {!token && query && (
          <p className="text-atlas-text-muted text-sm mt-6 text-center">
            Sign in to search your drafts and alerts.
          </p>
        )}

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
              <p className="text-atlas-text-muted text-sm text-center py-8">
                No results found. Try a different search term.
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
