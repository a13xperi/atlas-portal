"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, RotateCcw } from "lucide-react";

export interface TwitterLike {
  id: string;
  text: string;
  author_handle: string;
  author_avatar: string;
  created_at: string;
  like_count: number;
  retweet_count: number;
}

interface TweetCardProps {
  tweet: TwitterLike;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
  stackIndex: number;
  exitDirection?: "left" | "right";
}

export default function TweetCard({
  tweet,
  onSwipe,
  isTop,
  stackIndex,
  exitDirection = "right",
}: TweetCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const skipOpacity = useTransform(x, [-80, 0], [1, 0]);

  const scale = 1 - stackIndex * 0.05;
  const yOffset = stackIndex * 8;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: 10 - stackIndex,
      }}
      initial={false}
      animate={{
        scale,
        y: yOffset,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className={`relative h-full w-full rounded-2xl border border-glass-border bg-atlas-surface p-6 shadow-xl ${
          isTop ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={isTop ? { x, rotate } : undefined}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={isTop ? handleDragEnd : undefined}
        exit={{
          x: exitDirection === "right" ? 400 : -400,
          opacity: 0,
          rotate: exitDirection === "right" ? 15 : -15,
          transition: { type: "spring", stiffness: 200, damping: 25 },
        }}
      >
        {/* Swipe Indicators */}
        {isTop && (
          <>
            <motion.div
              className="pointer-events-none absolute left-6 top-6 z-10 -rotate-12 rounded-lg border-2 border-green-400 px-3 py-1"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-lg font-bold text-green-400">LIKE</span>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-6 top-6 z-10 rotate-12 rounded-lg border-2 border-red-400 px-3 py-1"
              style={{ opacity: skipOpacity }}
            >
              <span className="text-lg font-bold text-red-400">SKIP</span>
            </motion.div>
          </>
        )}

        {/* Color overlays */}
        {isTop && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-green-500/10"
              style={{ opacity: likeOpacity }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-red-500/10"
              style={{ opacity: skipOpacity }}
            />
          </>
        )}

        {/* Tweet Content */}
        <div className="relative z-20 flex h-full flex-col justify-between">
          <p className="text-lg leading-relaxed text-atlas-text">{tweet.text}</p>

          <div className="mt-6 space-y-3">
            {/* Author row */}
            <div className="flex items-center gap-3">
              {tweet.author_avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={tweet.author_avatar}
                  alt={tweet.author_handle}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-teal/20 text-xs font-bold text-atlas-teal">
                  {tweet.author_handle?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="text-sm font-medium text-atlas-text-secondary">
                @{tweet.author_handle}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-atlas-text-muted">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {formatCount(tweet.like_count)}
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                {formatCount(tweet.retweet_count)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
