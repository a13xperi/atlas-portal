"use client";

import { useEffect, useMemo, useState } from "react";
import TweetDeck from "@/components/tweet-tinder/TweetDeck";
import type { TwitterLike as DeckTweet } from "@/components/tweet-tinder/TweetCard";
import { api } from "@/lib/api";
import type { SwipeSignal } from "@/lib/oracle-types";

interface SwipeReferenceTweetsStepProps {
  handles: string[];
  signals: SwipeSignal[];
  onRecordSignals: (signals: SwipeSignal[]) => void;
  onResetSignals: () => void;
}

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function toDeckTweet(
  tweet: Awaited<ReturnType<typeof api.twitter.topTweetsByHandle>>["tweets"][number]
): DeckTweet {
  return {
    id: tweet.id,
    text: tweet.text,
    author_handle: tweet.author_handle ?? "reference",
    author_avatar: tweet.author_avatar ?? "",
    created_at: tweet.created_at ?? new Date().toISOString(),
    like_count: tweet.like_count,
    retweet_count: tweet.retweet_count,
  };
}

export default function SwipeReferenceTweetsStep({
  handles,
  signals,
  onRecordSignals,
  onResetSignals,
}: SwipeReferenceTweetsStepProps) {
  const [tweetsByHandle, setTweetsByHandle] = useState<Record<string, DeckTweet[]>>({});
  const [loading, setLoading] = useState(true);
  const [usedDemoFallback, setUsedDemoFallback] = useState<Record<string, boolean>>({});
  const normalizedHandles = useMemo(
    () =>
      Array.from(
        new Set(
          handles
            .map((handle) => normalizeHandle(handle))
            .filter(Boolean)
        )
      ),
    [handles]
  );

  useEffect(() => {
    let ignore = false;

    if (normalizedHandles.length === 0) {
      setTweetsByHandle({});
      setUsedDemoFallback({});
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all(
      normalizedHandles.map(async (handle) => {
        const response = await api.twitter.topTweetsByHandle(handle);
        return {
          handle,
          tweets: response.tweets.map(toDeckTweet),
          fallback: response.fallback === "demo",
        };
      })
    )
      .then((results) => {
        if (ignore) {
          return;
        }

        setTweetsByHandle(
          results.reduce<Record<string, DeckTweet[]>>((accumulator, result) => {
            accumulator[result.handle] = result.tweets;
            return accumulator;
          }, {})
        );
        setUsedDemoFallback(
          results.reduce<Record<string, boolean>>((accumulator, result) => {
            accumulator[result.handle] = result.fallback;
            return accumulator;
          }, {})
        );
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [normalizedHandles]);

  const processedHandles = useMemo(
    () =>
      new Set(
        signals
          .map((signal) => normalizeHandle(signal.handle ?? ""))
          .filter(Boolean)
      ),
    [signals]
  );

  const nextHandle = normalizedHandles.find(
    (handle) => !processedHandles.has(handle)
  );
  const completedCount = nextHandle
    ? normalizedHandles.indexOf(nextHandle)
    : normalizedHandles.length;

  if (normalizedHandles.length === 0) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 text-sm text-atlas-text-secondary backdrop-blur-xl sm:p-6">
        Add at least one reference handle first.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-atlas-surface" />
        <div className="mt-4 h-80 animate-pulse rounded-2xl bg-atlas-surface" />
      </div>
    );
  }

  if (!nextHandle) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
          Reference tweets
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
          Reference swipe pass complete
        </h2>
        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
          You finished all {normalizedHandles.length} reference decks. Keep going, or reswipe if the mix does not feel right yet.
        </p>
        <button
          type="button"
          onClick={onResetSignals}
          className="mt-5 rounded-full border border-glass-border bg-atlas-surface px-4 py-2 text-sm font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
        >
          Swipe them again
        </button>
      </div>
    );
  }

  const nextTweets = tweetsByHandle[nextHandle] ?? [];

  if (nextTweets.length === 0) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 text-sm text-atlas-text-secondary backdrop-blur-xl sm:p-6">
        I couldn&apos;t find enough tweets for @{nextHandle} to swipe yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
        Reference tweets
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
        Swipe @
        {nextHandle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
        Deck {completedCount + 1} of {normalizedHandles.length}. Keep the tweets that feel like the right direction for your blend and skip the rest.
      </p>
      {usedDemoFallback[nextHandle] && (
        <p className="mt-2 text-xs text-atlas-text-muted">
          Using preview tweets because live X data is not available for this handle right now.
        </p>
      )}

      <div className="mt-5">
        <TweetDeck
          tweets={nextTweets}
          finishCtaLabel={`Save @${nextHandle} swipes`}
          onComplete={(likes, dislikes) => {
            onRecordSignals([
              ...likes.map((tweet) => ({
                tweetId: tweet.id,
                text: tweet.text,
                direction: "like" as const,
                source: "REF" as const,
                handle: nextHandle,
                reasons: [],
              })),
              ...dislikes.map((tweet) => ({
                tweetId: tweet.id,
                text: tweet.text,
                direction: "dislike" as const,
                source: "REF" as const,
                handle: nextHandle,
                reasons: [],
              })),
            ]);
          }}
        />
      </div>
    </div>
  );
}
