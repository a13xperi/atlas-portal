"use client";

import { useEffect, useState } from "react";
import { AtSign, ChevronDown } from "lucide-react";
import TweetDeck from "@/components/tweet-tinder/TweetDeck";
import { type TwitterLike } from "@/components/tweet-tinder/TweetCard";
import { api } from "@/lib/api";

export default function TweetTinderSection() {
  const [tweets, setTweets] = useState<TwitterLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hasTwitter, setHasTwitter] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if X is connected first
    api.auth.x
      .status()
      .then((res) => {
        setHasTwitter(res.linked === true);
        if (!res.linked) {
          setLoading(false);
          return;
        }
        // Fetch likes
        return api.twitter.likes().then((data) => {
          // data could be an array directly or have a likes property
          const list = Array.isArray(data) ? data : (data as { likes?: TwitterLike[] }).likes ?? [];
          setTweets(list);
        });
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load tweets");
      })
      .finally(() => setLoading(false));
  }, []);

  // Don't render if X isn't connected and we've confirmed that
  if (hasTwitter === false) {
    return (
      <div className="rounded-2xl border border-glass-border bg-atlas-surface p-6">
        <div className="flex items-center gap-3 text-atlas-text-muted">
          <AtSign className="h-5 w-5" />
          <p className="text-sm">
            Connect your X account to unlock Tweet Tinder voice calibration.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-atlas-surface" />
        <div className="h-80 animate-pulse rounded-2xl bg-atlas-surface" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
        {error}
      </div>
    );
  }

  if (tweets.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-glass-border bg-atlas-surface p-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-lg font-semibold text-atlas-text">
            Refine Your Voice
          </h2>
          <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-xs font-semibold text-atlas-teal">
            {tweets.length} tweets
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-atlas-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="mt-6">
          <p className="mb-6 text-sm text-atlas-text-secondary">
            Swipe through tweets from voices you follow. Like the ones that sound
            like you to sharpen your voice profile.
          </p>
          <TweetDeck tweets={tweets} />
        </div>
      )}
    </div>
  );
}
