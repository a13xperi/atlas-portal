"use client";

import { FormEvent, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { api, TweetDraft, VoiceProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  VOICE_DIMENSION_SECTIONS,
  formatVoiceDimensionValue,
  pickVoiceDimensions,
} from "@/lib/voice-profile-dimensions";

const SEARCH_SUGGESTIONS = [
  "ETH ETF",
  "market structure",
  "formality",
  "confidence",
  "rollups",
];

const SEARCHABLE_VOICE_DIMENSIONS = VOICE_DIMENSION_SECTIONS.flatMap(
  (section) => section.dimensions
);
const RECENT_SEARCHES_STORAGE_KEY = "atlas_recent_searches";

const DRAFT_STATUS_VARIANTS: Record<
  TweetDraft["status"],
  "posted" | "draft" | "feedback"
> = {
  DRAFT: "draft",
  APPROVED: "feedback",
  SCHEDULED: "feedback",
  POSTED: "posted",
  ARCHIVED: "draft",
};

const DRAFT_STATUS_LABELS: Record<TweetDraft["status"], string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
  ARCHIVED: "Archived",
};

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Timestamp unavailable";
  }

  return timestampFormatter.format(date);
}

function formatPreview(content: string) {
  if (content.length <= 220) {
    return content;
  }

  return `${content.slice(0, 217).trimEnd()}...`;
}

function formatMaturityLabel(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) {
    return "Beginner";
  }

  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

function tokenizeSearch(query: string) {
  return query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    const savedQueries = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);

    if (!savedQueries) {
      return;
    }

    try {
      const parsedQueries = JSON.parse(savedQueries);

      if (Array.isArray(parsedQueries)) {
        setRecentQueries(
          parsedQueries
            .filter((savedQuery): savedQuery is string => typeof savedQuery === "string")
            .slice(0, 5)
        );
      }
    } catch {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSearchData = async () => {
      setLoading(true);
      setError(null);

      const [draftsResult, voiceResult] =
        await Promise.allSettled([
          api.drafts.list(),
          api.voice.getProfile(),
        ]);

      if (cancelled) {
        return;
      }

      if (draftsResult.status === "fulfilled") {
        setDrafts(
          [...(draftsResult.value.drafts ?? [])].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime()
          )
        );
      } else {
        setDrafts([]);
        setError("Search is temporarily unavailable. Please try again.");
      }

      if (
        voiceResult.status === "fulfilled" &&
        voiceResult.value.profile
      ) {
        setVoiceProfile(voiceResult.value.profile);
      } else {
        setVoiceProfile(user.voiceProfile ?? null);
      }

      setLoading(false);
    };

    void loadSearchData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveQuery = (nextQuery: string) => {
    setRecentQueries((currentRecentQueries) => {
      const updatedQueries = [
        nextQuery,
        ...currentRecentQueries.filter((recentQuery) => recentQuery !== nextQuery),
      ].slice(0, 5);

      localStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(updatedQueries)
      );

      return updatedQueries;
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    setQuery(trimmedQuery);

    if (trimmedQuery) {
      saveQuery(trimmedQuery);
    }
  };

  const handleQuickSearch = (nextQuery: string) => {
    setQuery(nextQuery);
    saveQuery(nextQuery);
  };

  const filteredDrafts = deferredQuery
    ? drafts.filter((draft) =>
        draft.content.toLowerCase().includes(deferredQuery)
      )
    : drafts.slice(0, 8);

  const voiceDimensions = pickVoiceDimensions(voiceProfile);
  const voiceTraits = SEARCHABLE_VOICE_DIMENSIONS.map(({ field, label }) => ({
    field,
    label,
    value: voiceDimensions[field],
  }));
  const queryTokens = tokenizeSearch(deferredQuery);
  const matchedVoiceTraits = voiceTraits.filter(({ label }) => {
    const normalizedLabel = label.toLowerCase();

    return (
      normalizedLabel.includes(deferredQuery) ||
      queryTokens.some(
        (token) =>
          normalizedLabel.includes(token) || token.includes(normalizedLabel)
      )
    );
  });
  const defaultVoiceTraits = [...voiceTraits]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
  const voiceMetaTerms = [
    "voice",
    "profile",
    "tone",
    "style",
    formatMaturityLabel(voiceProfile?.maturity).toLowerCase(),
  ];
  const queryTouchesVoice = queryTokens.some((token) =>
    voiceMetaTerms.some((term) => term.includes(token) || token.includes(term))
  );
  const shouldShowVoiceCard = Boolean(
    voiceProfile &&
      (!deferredQuery || queryTouchesVoice || matchedVoiceTraits.length > 0)
  );
  const visibleVoiceTraits =
    deferredQuery && matchedVoiceTraits.length > 0
      ? matchedVoiceTraits.slice(0, 3)
      : defaultVoiceTraits;
  const totalMatches =
    filteredDrafts.length + (deferredQuery && shouldShowVoiceCard ? 1 : 0);
  const showEmptyState =
    !loading && filteredDrafts.length === 0 && !shouldShowVoiceCard;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading font-extrabold tracking-tight text-2xl text-atlas-text sm:text-3xl">
            Search drafts and voice profiles
          </h1>
          <p className="mt-2 text-sm text-atlas-text-secondary sm:text-base">
            Filter saved drafts by content and quickly jump to the voice settings that shape your tone.
          </p>
        </div>

        <GlassCard
          maxWidth="full"
          aria-label="Search controls"
          className="space-y-4 px-4 py-4 sm:px-6 sm:py-6"
        >
          <form className="relative" onSubmit={handleSearchSubmit}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-atlas-text-secondary" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search drafts or voice profiles..."
              spellCheck={false}
              className="w-full bg-atlas-surface rounded-lg border border-glass-border text-atlas-text px-4 py-3 pl-11 placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-atlas-text-secondary">
            <span>Popular searches:</span>
            {SEARCH_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleQuickSearch(suggestion)}
                className="rounded-full border border-glass-border bg-atlas-surface px-3 py-1 transition-colors hover:border-atlas-teal hover:text-atlas-text"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {!query.trim() && recentQueries.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-atlas-text-muted">Recent searches</p>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((recentQuery) => (
                  <button
                    key={recentQuery}
                    type="button"
                    onClick={() => handleQuickSearch(recentQuery)}
                    className="rounded-full border border-glass-border bg-atlas-surface px-3 py-1.5 text-xs text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                  >
                    {recentQuery}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </GlassCard>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <GlassCard
              maxWidth="full"
              aria-label="Loading search results"
              className="px-4 py-6 text-center sm:px-4 sm:py-6"
            >
              <p className="text-sm text-atlas-text-secondary">
                Loading your searchable drafts...
              </p>
            </GlassCard>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-atlas-text-secondary">
                  {deferredQuery
                    ? `Showing ${totalMatches} result${
                        totalMatches === 1 ? "" : "s"
                      } for "${query.trim()}".`
                    : `Browsing ${filteredDrafts.length} recent draft${
                        filteredDrafts.length === 1 ? "" : "s"
                      }.`}
                </p>
                {voiceProfile ? (
                  <p className="text-xs text-atlas-text-secondary">
                    Voice profile ready: {formatMaturityLabel(voiceProfile.maturity)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                {shouldShowVoiceCard ? (
                  <Link href="/voice-profiles" className="block">
                    <GlassCard
                      maxWidth="full"
                      aria-label="Voice profile result"
                      className="px-4 py-4 transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-secondary">
                            Voice Profile
                          </p>
                          <h2 className="mt-2 font-heading font-bold tracking-tight text-xl text-atlas-text">
                            {deferredQuery ? "Voice profile match" : "Current voice profile"}
                          </h2>
                          <p className="mt-2 text-sm text-atlas-text-secondary">
                            {deferredQuery && matchedVoiceTraits.length > 0
                              ? `Matched traits: ${matchedVoiceTraits
                                  .slice(0, 3)
                                  .map((trait) => trait.label)
                                  .join(", ")}.`
                              : "Searchable tone settings pulled from your active profile."}
                          </p>
                        </div>
                        <StatusPill
                          label={formatMaturityLabel(voiceProfile?.maturity)}
                          variant="feedback"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {visibleVoiceTraits.map((trait) => (
                          <span
                            key={trait.field}
                            className="rounded-full border border-glass-border bg-atlas-surface px-3 py-1 text-xs text-atlas-text-secondary"
                          >
                            {trait.label}: {formatVoiceDimensionValue(trait.value)}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-xs text-atlas-text-secondary">
                        Based on {voiceProfile?.tweetsAnalyzed ?? 0} tweets analyzed.
                      </p>
                    </GlassCard>
                  </Link>
                ) : null}

                {filteredDrafts.map((draft) => (
                  <Link key={draft.id} href="/crafting" className="block">
                    <GlassCard
                      maxWidth="full"
                      aria-label={`Draft result ${draft.id}`}
                      className="px-4 py-4 transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="line-clamp-3 text-sm leading-6 text-atlas-text sm:max-w-[80%]">
                          {formatPreview(draft.content)}
                        </p>
                        <StatusPill
                          label={DRAFT_STATUS_LABELS[draft.status]}
                          variant={DRAFT_STATUS_VARIANTS[draft.status]}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-atlas-text-secondary">
                        <span>{formatTimestamp(draft.createdAt)}</span>
                        {draft.sourceType ? (
                          <span className="rounded-full border border-glass-border bg-atlas-surface px-2 py-1">
                            {draft.sourceType}
                          </span>
                        ) : null}
                      </div>
                    </GlassCard>
                  </Link>
                ))}

                {showEmptyState ? (
                  <GlassCard
                    maxWidth="full"
                    aria-label="No search results"
                    className="px-4 py-10 text-center sm:px-4 sm:py-10"
                  >
                    <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text">
                      No results found
                    </h2>
                    <p className="mt-2 text-sm text-atlas-text-secondary">
                      {deferredQuery
                        ? 'Try a ticker, a theme from your drafts, or a voice trait like "formality" or "brevity".'
                        : 'Create a draft in Crafting or try a voice trait like "confidence" or "brevity".'}
                    </p>
                  </GlassCard>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
