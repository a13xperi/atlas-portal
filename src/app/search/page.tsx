"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill, { StatusPillProps } from "@/components/ui/StatusPill";
import {
  api,
  ReferenceVoice,
  SavedBlend,
  TweetDraft,
  VoiceProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type VoiceSearchResult = {
  id: string;
  kind: "profile" | "reference" | "blend";
  title: string;
  description: string;
  meta: string;
  searchValue: string;
};

const draftStatusVariants: Record<TweetDraft["status"], StatusPillProps["variant"]> = {
  DRAFT: "draft",
  APPROVED: "feedback",
  POSTED: "posted",
  ARCHIVED: "draft",
};

const voiceTypeLabels: Record<VoiceSearchResult["kind"], string> = {
  profile: "Profile",
  reference: "Reference voice",
  blend: "Blend",
};

const draftTimestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDraftTimestamp(createdAt: string) {
  return draftTimestampFormatter.format(new Date(createdAt));
}

function formatVoiceMaturity(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) {
    return "Beginner";
  }

  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function buildVoiceSearchResults(
  profile: VoiceProfile | null,
  references: ReferenceVoice[],
  blends: SavedBlend[]
) {
  const results: VoiceSearchResult[] = [];

  if (profile) {
    const maturity = formatVoiceMaturity(profile.maturity);
    const profileMeta = `Humor ${profile.humor} • Formality ${profile.formality} • Brevity ${profile.brevity} • Contrarian tone ${profile.contrarianTone}`;

    results.push({
      id: profile.id,
      kind: "profile",
      title: "Your voice profile",
      description: `${maturity} profile calibrated from ${profile.tweetsAnalyzed} analyzed tweets.`,
      meta: profileMeta,
      searchValue: normalizeSearchValue(
        [
          "voice profile",
          maturity,
          profile.tweetsAnalyzed,
          profileMeta,
          "humor",
          "formality",
          "brevity",
          "contrarian tone",
        ].join(" ")
      ),
    });
  }

  references.forEach((reference) => {
    results.push({
      id: reference.id,
      kind: "reference",
      title: reference.name,
      description: reference.handle
        ? `Imported from @${reference.handle}`
        : "Saved as a reference voice for future blends.",
      meta: reference.isActive ? "Active reference voice" : "Inactive reference voice",
      searchValue: normalizeSearchValue(
        [
          reference.name,
          reference.handle ?? "",
          "reference voice",
          reference.isActive ? "active" : "inactive",
        ].join(" ")
      ),
    });
  });

  blends.forEach((blend) => {
    const blendMix = blend.voices
      .map((voice) => `${voice.percentage}% ${voice.label}`)
      .join(" • ");

    results.push({
      id: blend.id,
      kind: "blend",
      title: blend.name,
      description: blendMix || "Saved blend configuration.",
      meta: `${blend.voices.length} voice${blend.voices.length === 1 ? "" : "s"} in this blend`,
      searchValue: normalizeSearchValue(
        [blend.name, blendMix, "blend", blend.voices.map((voice) => voice.label).join(" ")].join(" ")
      ),
    });
  });

  return results;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [voiceResults, setVoiceResults] = useState<VoiceSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    const loadSearchData = async () => {
      setLoading(true);
      setError(null);

      const [draftsResult, profileResult, referencesResult, blendsResult] =
        await Promise.allSettled([
          api.drafts.list(),
          api.voice.getProfile(),
          api.voice.getReferences(),
          api.voice.getBlends(),
        ]);

      if (isCancelled) {
        return;
      }

      if (draftsResult.status === "fulfilled") {
        setDrafts(draftsResult.value.drafts);
      } else {
        setDrafts([]);
        setError(
          draftsResult.reason instanceof Error
            ? draftsResult.reason.message
            : "Failed to load search results"
        );
      }

      const profile = profileResult.status === "fulfilled" ? profileResult.value.profile : null;
      const references = referencesResult.status === "fulfilled" ? referencesResult.value.voices : [];
      const blends = blendsResult.status === "fulfilled" ? blendsResult.value.blends : [];

      setVoiceResults(buildVoiceSearchResults(profile, references, blends));
      setLoading(false);
    };

    void loadSearchData();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const normalizedQuery = normalizeSearchValue(deferredQuery);
  const hasQuery = normalizedQuery.length > 0;

  const filteredDrafts = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return drafts.filter((draft) =>
      normalizeSearchValue(
        [draft.content, draft.sourceContent ?? "", draft.sourceType ?? ""].join(" ")
      ).includes(normalizedQuery)
    );
  }, [drafts, hasQuery, normalizedQuery]);

  const filteredVoiceResults = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return voiceResults.filter((result) => result.searchValue.includes(normalizedQuery));
  }, [hasQuery, normalizedQuery, voiceResults]);

  const totalResults = filteredDrafts.length + filteredVoiceResults.length;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
            Search
          </p>
          <h1 className="mt-2 font-heading text-3xl text-atlas-text">
            Search drafts and voice profiles
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-atlas-text-secondary">
            Find draft ideas by content and jump back into the voice assets that shape your tone.
          </p>
        </div>

        <label htmlFor="search-query" className="sr-only">
          Search drafts and voice profiles
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-atlas-text-secondary"
          />
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search drafts or voice profiles..."
            className="w-full bg-atlas-surface rounded-lg border border-glass-border px-4 py-3 pl-11 text-atlas-text placeholder:text-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
        </div>

        {error ? (
          <GlassCard
            aria-label="Search error"
            maxWidth="full"
            className="mt-4 !px-4 !py-4 text-sm text-atlas-error"
          >
            {error}
          </GlassCard>
        ) : null}

        {loading ? (
          <GlassCard
            aria-label="Loading search data"
            maxWidth="full"
            className="mt-6 !px-4 !py-4 text-sm text-atlas-text-secondary"
          >
            Loading drafts and voice profiles...
          </GlassCard>
        ) : null}

        {!loading && !hasQuery ? (
          <GlassCard
            aria-label="Search guidance"
            maxWidth="full"
            className="mt-6 !px-4 !py-4"
          >
            <p className="text-lg font-medium text-atlas-text">Start with a keyword</p>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              Try a market theme, draft phrase, reference voice name, or saved blend title.
            </p>
          </GlassCard>
        ) : null}

        {!loading && hasQuery ? (
          <p className="mt-6 text-sm text-atlas-text-secondary">
            {totalResults} result{totalResults === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
          </p>
        ) : null}

        {!loading && hasQuery && totalResults === 0 ? (
          <GlassCard
            aria-label="No search results"
            maxWidth="full"
            className="mt-6 !px-4 !py-4"
          >
            <p className="text-lg font-medium text-atlas-text">No results found</p>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              Try a shorter phrase, a different keyword, or the exact name of a saved voice or blend.
            </p>
          </GlassCard>
        ) : null}

        {!loading && filteredDrafts.length > 0 ? (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-atlas-text">
                Drafts ({filteredDrafts.length})
              </h2>
            </div>
            <div className="space-y-3">
              {filteredDrafts.map((draft) => (
                <Link key={draft.id} href="/crafting" className="block">
                  <GlassCard
                    aria-label={`Draft result ${draft.id}`}
                    maxWidth="full"
                    className="!px-4 !py-4 transition-colors hover:border-atlas-teal/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-3 text-sm leading-6 text-atlas-text">
                          {draft.content}
                        </p>
                        {draft.sourceType ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-atlas-text-muted">
                            {draft.sourceType}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <StatusPill
                          label={draft.status}
                          variant={draftStatusVariants[draft.status]}
                        />
                        <span className="text-xs text-atlas-text-secondary">
                          {formatDraftTimestamp(draft.createdAt)}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && filteredVoiceResults.length > 0 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-atlas-text">
                Voice Profiles ({filteredVoiceResults.length})
              </h2>
            </div>
            <div className="space-y-3">
              {filteredVoiceResults.map((result) => (
                <Link key={result.id} href="/voice-profiles" className="block">
                  <GlassCard
                    aria-label={`${voiceTypeLabels[result.kind]} result ${result.id}`}
                    maxWidth="full"
                    className="!px-4 !py-4 transition-colors hover:border-atlas-teal/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-atlas-text">{result.title}</p>
                        <p className="mt-2 text-sm text-atlas-text-secondary">
                          {result.description}
                        </p>
                        <p className="mt-2 text-xs text-atlas-text-muted">{result.meta}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-atlas-surface px-3 py-1 text-xs font-medium text-atlas-text-secondary">
                        {voiceTypeLabels[result.kind]}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
