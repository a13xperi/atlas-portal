"use client";

import { useEffect, useMemo, useState } from "react";
import TweetDeck from "@/components/tweet-tinder/TweetDeck";
import type { TwitterLike as DeckTweet } from "@/components/tweet-tinder/TweetCard";
import { api } from "@/lib/api";
import type { SwipeSignal } from "@/lib/oracle-types";

interface SwipeOwnTweetsStepProps {
  signals: SwipeSignal[];
  onCompleteSwipes: (signals: SwipeSignal[]) => void;
  onResetSwipes: () => void;
}

function toDeckTweet(tweet: Awaited<ReturnType<typeof api.twitter.topTweets>>["tweets"][number]): DeckTweet {
  return {
    id: tweet.id,
    text: tweet.text,
    author_handle: tweet.author_handle ?? "atlasanalyst",
    author_avatar: tweet.author_avatar ?? "",
    created_at: tweet.created_at ?? new Date().toISOString(),
    like_count: tweet.like_count,
    retweet_count: tweet.retweet_count,
  };
}

export default function SwipeOwnTweetsStep({
  signals,
  onCompleteSwipes,
  onResetSwipes,
}: SwipeOwnTweetsStepProps) {
  const [tweets, setTweets] = useState<DeckTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedDemoFallback, setUsedDemoFallback] = useState(false);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);

    api.twitter
      .topTweets()
      .then((response) => {
        if (ignore) {
          return;
        }

        setTweets(response.tweets.map(toDeckTweet));
        setUsedDemoFallback(response.fallback === "demo");
      })
      .catch((err: Error) => {
        if (!ignore) {
          setError(err.message || "Failed to load your tweets.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const likedCount = useMemo(
    () => signals.filter((signal) => signal.direction === "like").length,
    [signals]
  );
  const dislikedCount = signals.length - likedCount;

  if (signals.length > 0) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
          Your top tweets
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
          Swipe pass complete
        </h2>
        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
          You saved {signals.length} swipe signals: {likedCount} likes and {dislikedCount} skips.
          You can keep going, or reswipe if the set does not feel representative.
        </p>
        <button
          type="button"
          onClick={onResetSwipes}
          className="mt-5 rounded-full border border-glass-border bg-atlas-surface px-4 py-2 text-sm font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
        >
          Swipe again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-atlas-surface" />
        <div className="mt-4 h-80 animate-pulse rounded-2xl bg-atlas-surface" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-atlas-error/30 bg-atlas-error/10 p-5 text-sm text-atlas-error sm:p-6">
        {error}
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 text-sm text-atlas-text-secondary backdrop-blur-xl sm:p-6">
        I couldn&apos;t find enough tweets to swipe right now.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
          Your top tweets
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
          Show me what already sounds like you
        </h2>
        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
          Swipe right on tweets that feel unmistakably yours. Swipe left on the ones you would not want Atlas to imitate.
        </p>
        {usedDemoFallback && (
          <p className="mt-2 text-xs text-atlas-text-muted">
            Using preview tweets because live X data is not available in this environment.
          </p>
        )}
      </div>

      <TweetDeck
        tweets={tweets}
        finishCtaLabel="Save my swipes"
        onComplete={(likes, dislikes) => {
          onCompleteSwipes([
            ...likes.map((tweet) => ({
              tweetId: tweet.id,
              text: tweet.text,
              direction: "like" as const,
              source: "OWN" as const,
              handle: tweet.author_handle,
              reasons: [],
            })),
            ...dislikes.map((tweet) => ({
              tweetId: tweet.id,
              text: tweet.text,
              direction: "dislike" as const,
              source: "OWN" as const,
              handle: tweet.author_handle,
              reasons: [],
            })),
          ]);
        }}
      />
    </div>
  );
}
