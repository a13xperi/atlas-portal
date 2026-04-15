"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import TweetCard, { type TwitterLike } from "./TweetCard";
import SwipeActions from "./SwipeActions";
import { api } from "@/lib/api";

interface TweetDeckProps {
  tweets: TwitterLike[];
  onComplete?: (likes: TwitterLike[], dislikes: TwitterLike[]) => void | Promise<void>;
  finishCtaLabel?: string;
}

export default function TweetDeck({
  tweets,
  onComplete,
  finishCtaLabel,
}: TweetDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTweets, setLikedTweets] = useState<TwitterLike[]>([]);
  const [dislikedTweets, setDislikedTweets] = useState<TwitterLike[]>([]);
  const [phase, setPhase] = useState<"swiping" | "complete">("swiping");
  const [isAnimating, setIsAnimating] = useState(false);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "submitting" | "submitted"
  >("idle");
  const [blendSent, setBlendSent] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || currentIndex >= tweets.length) return;
      setIsAnimating(true);
      setExitDirection(direction);
      if (direction === "right") {
        setLikedTweets((prev) => [...prev, tweets[currentIndex]]);
      } else {
        setDislikedTweets((prev) => [...prev, tweets[currentIndex]]);
      }
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (nextIndex >= tweets.length) {
        setPhase("complete");
      }
    },
    [isAnimating, currentIndex, tweets]
  );

  const handleFinish = useCallback(async () => {
    const isDefaultFlow = typeof onComplete !== "function";
    const hasNothingToSubmit =
      isDefaultFlow && likedTweets.length === 0;

    if (submissionState !== "idle" || hasNothingToSubmit) {
      return;
    }

    setSubmissionState("submitting");

    try {
      if (onComplete) {
        await onComplete(likedTweets, dislikedTweets);
      } else {
        await api.voice.createBlend("Tweet Tinder Selection", [
          { label: "Liked Tweets", percentage: 100 },
        ]);
      }

      setSubmissionState("submitted");
    } catch {
      if (!onComplete) {
        // Silently fail — the user can retry from Voice Lab.
      }
      setSubmissionState("idle");
    }
  }, [dislikedTweets, likedTweets, onComplete, submissionState]);

  if (phase === "complete") {
    const canSubmit =
      typeof onComplete === "function" ? true : likedTweets.length > 0;
    const isSubmitted = submissionState === "submitted";
    const isSubmitting = submissionState === "submitting";
    const pendingCopy =
      typeof onComplete === "function"
        ? " Save them to keep going."
        : likedTweets.length > 0
          ? " Updating your voice profile..."
          : "";

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-glass-border bg-atlas-surface px-6 py-12 text-center">
        <CheckCircle className="h-12 w-12 text-atlas-teal" />
        <h3 className="mt-4 font-heading text-lg font-semibold text-atlas-text">
          All done!
        </h3>
        <p className="mt-2 text-sm text-atlas-text-secondary">
          You liked{" "}
          <span className="font-semibold text-atlas-teal">
            {likedTweets.length}
          </span>{" "}
          of {tweets.length} tweets.
          {pendingCopy}
        </p>
        {canSubmit && !isSubmitted && (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-atlas-teal/15 px-6 py-2 text-sm font-semibold text-atlas-teal transition-colors hover:bg-atlas-teal/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {finishCtaLabel ?? "Apply to voice profile"}
          </button>
        )}
        {isSubmitted && (
          <p className="mt-3 text-xs text-atlas-text-muted">
            {typeof onComplete === "function"
              ? "Swipes saved."
              : "Voice profile update submitted."}
          </p>
        )}
      </div>
    );
  }

  // Show up to 3 cards in the stack
  const visibleCards = tweets.slice(currentIndex, currentIndex + 3);

  return (
    <div className="space-y-6">
      {/* Card stack */}
      <div className="relative mx-auto h-80 w-full max-w-md">
        <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
          {visibleCards
            .map((tweet, i) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                onSwipe={handleSwipe}
                isTop={i === 0}
                stackIndex={i}
                exitDirection={exitDirection}
              />
            ))
            .reverse()}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <SwipeActions
        onSkip={() => handleSwipe("left")}
        onLike={() => handleSwipe("right")}
        disabled={isAnimating}
      />

      {/* Progress */}
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs text-atlas-text-muted">
          {currentIndex + 1} of {tweets.length}
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-atlas-bg">
          <div
            className="h-1 rounded-full bg-atlas-teal transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / tweets.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
