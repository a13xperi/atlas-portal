"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Search className="w-12 h-12 text-atlas-text-secondary mb-6" />
        <h1 className="font-heading text-2xl text-atlas-text">
          Search Atlas
        </h1>
        <p className="text-atlas-text-secondary mt-2 text-center max-w-md">
          Search across drafts, tweets, voice profiles, team styles, and alerts.
        </p>
        <div className="mt-8 w-full max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drafts, voices, styles, alerts..."
            className="w-full bg-atlas-surface border border-glass-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          />
        </div>
        {query && (
          <p className="text-atlas-text-muted text-sm mt-6">
            Search is not yet connected. Results for &ldquo;{query}&rdquo; will appear here.
          </p>
        )}
      </div>
    </AppShell>
  );
}
