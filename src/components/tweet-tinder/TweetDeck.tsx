"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, useAnimation } from "framer-motion";
import { CheckCircle } from "lucide-react";
import TweetCard, { type TwitterLike } from "./TweetCard";
import SwipeActions from "./SwipeActions";
import { api } from "@/lib/api";

interface TweetDeckProps {
  tweets: TwitterLike[];
}

export default function TweetDeck({ tweets }: TweetDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTweets, setLikedTweets] = useState<TwitterLike[]>([]);
  const [phase, setPhase] = useState<"swiping" | "complete">("swiping");
  const [isAnimating, setIsAnimating] = useState(false);
  const [blendSent, setBlendSent] = useState(false);
  const controls = useAnimation();
  const directionRef = useRef<"left" | "right">("right");

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || currentIndex >= tweets.length) return;
      setIsAnimating(true);
      directionRef.current = direction;

      const exitX = direction === "right" ? 400 : -400;
      const exitRotate = direction === "right" ? 15 : -15;

      controls
        .start({
          x: exitX,
          opacity: 0,
          rotate: exitRotate,
          transition: { type: "spring", stiffness: 200, damping: 25 },
        })
        .then(() => {
          if (direction === "right") {
            setLikedTweets((prev) => [...prev, tweets[currentIndex]]);
          }

          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);

          if (nextIndex >= tweets.length) {
            setPhase("complete");
          }

          controls.set({ x: 0, opacity: 1, rotate: 0 });
          setIsAnimating(false);
        });
    },
    [isAnimating, currentIndex, tweets, controls]
  );

  const handleCardSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || currentIndex >= tweets.length) return;

      if (direction === "right") {
        setLikedTweets((prev) => [...prev, tweets[currentIndex]]);
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= tweets.length) {
        setPhase("complete");
      }
    },
    [isAnimating, currentIndex, tweets]
  );

  const handleFinish = useCallback(() => {
    if (blendSent || likedTweets.length === 0) return;
    setBlendSent(true);
    // Fire-and-forget voice blend update
    api.voice
      .createBlend("Tweet Tinder Selection", [
        { label: "Liked Tweets", percentage: 100 },
      ])
      .catch(() => {
        // Silently fail — the user can retry from Voice Lab
      });
  }, [blendSent, likedTweets]);

  if (phase === "complete") {
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
          {likedTweets.length > 0 && " Updating your voice profile..."}
        </p>
        {likedTweets.length > 0 && !blendSent && (
          <button
            type="button"
            onClick={handleFinish}
            className="mt-4 rounded-lg bg-atlas-teal/15 px-6 py-2 text-sm font-semibold text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            Apply to voice profile
          </button>
        )}
        {blendSent && (
          <p className="mt-3 text-xs text-atlas-text-muted">
            Voice profile update submitted.
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
        <AnimatePresence>
          {visibleCards
            .map((tweet, i) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                onSwipe={handleCardSwipe}
                isTop={i === 0}
                stackIndex={i}
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
