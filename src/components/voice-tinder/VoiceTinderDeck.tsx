"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import VoiceTinderCard, { type VoiceTweetData } from "./VoiceTinderCard";
import { api, type VoiceTinderSwipe } from "@/lib/api";

interface VoiceTinderDeckProps {
  tweets: VoiceTweetData[];
  onComplete?: () => void;
}

export default function VoiceTinderDeck({ tweets, onComplete }: VoiceTinderDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitDecision, setExitDecision] = useState<"KEEP" | "SKIP">("KEEP");

  const remaining = tweets.length - currentIndex;
  const progress = (currentIndex / tweets.length) * 100;

  const handleSwipe = useCallback(
    async (decision: "KEEP" | "SKIP", durationMs: number) => {
      if (isAnimating || isSubmitting || currentIndex >= tweets.length) return;

      const currentTweet = tweets[currentIndex];
      if (!currentTweet) return;

      setIsAnimating(true);
      setExitDecision(decision);

      const swipe: VoiceTinderSwipe = {
        tweetId: currentTweet.tweetId,
        text: currentTweet.text,
        authorHandle: currentTweet.authorHandle,
        source: currentTweet.source,
        referenceHandle: currentTweet.referenceHandle ?? undefined,
        decision,
        durationMs,
        metrics: currentTweet.metrics ?? undefined,
        postedAt: currentTweet.postedAt ?? undefined,
      };

      setIsSubmitting(true);
      try {
        await api.voiceTinder.swipe([swipe]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to record swipe:", err);
      } finally {
        setIsSubmitting(false);
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= tweets.length) {
        onComplete?.();
      }
    },
    [isAnimating, isSubmitting, currentIndex, tweets, onComplete]
  );

  const handleButtonSwipe = (decision: "KEEP" | "SKIP") => {
    handleSwipe(decision, 0);
  };

  // Show up to 5 cards in the stack
  const visibleCards = tweets.slice(currentIndex, currentIndex + 5);

  if (currentIndex >= tweets.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-glass-border bg-atlas-surface px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-atlas-teal/15">
          <Check className="h-6 w-6 text-atlas-teal" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-atlas-text">
          All caught up!
        </h3>
        <p className="mt-2 text-sm text-atlas-text-secondary">
          You&apos;ve reviewed all {tweets.length} tweets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card stack */}
      <div className="relative mx-auto h-96 w-full max-w-md">
        <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
          {visibleCards
            .map((tweet, i) => (
              <VoiceTinderCard
                key={tweet.id}
                tweet={tweet}
                onSwipe={handleSwipe}
                isTop={i === 0}
                stackIndex={i}
                exitDecision={exitDecision}
              />
            ))
            .reverse()}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="mx-auto flex max-w-md items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => handleButtonSwipe("SKIP")}
          disabled={isAnimating || isSubmitting}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-atlas-error/30 bg-atlas-error/10 text-atlas-error transition hover:bg-atlas-error/20 disabled:opacity-50"
          aria-label="Skip"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => handleButtonSwipe("KEEP")}
          disabled={isAnimating || isSubmitting}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/15 text-atlas-teal transition hover:bg-atlas-teal/25 disabled:opacity-50"
          aria-label="Keep"
        >
          <Check className="h-6 w-6" />
        </button>
      </div>

      {/* Progress */}
      <div className="mx-auto max-w-md text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-atlas-text-muted">
          <span>{remaining} remaining</span>
          {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-atlas-bg">
          <div
            className="h-1.5 rounded-full bg-atlas-teal transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
