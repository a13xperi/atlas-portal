"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useRef } from "react";

export interface VoiceTweetData {
  id: string;
  tweetId: string;
  text: string;
  authorHandle: string;
  source: "OWN" | "REFERENCE";
  referenceHandle?: string | null;
  metrics?: Record<string, number> | null;
  postedAt?: string | null;
}

interface VoiceTinderCardProps {
  tweet: VoiceTweetData;
  onSwipe: (decision: "KEEP" | "SKIP", durationMs: number) => void;
  isTop: boolean;
  stackIndex: number;
  exitDecision?: "KEEP" | "SKIP";
}

export default function VoiceTinderCard({
  tweet,
  onSwipe,
  isTop,
  stackIndex,
  exitDecision = "KEEP",
}: VoiceTinderCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const keepOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const startTimeRef = useRef<number>(Date.now());

  const scale = 1 - stackIndex * 0.05;
  const yOffset = stackIndex * 8;

  function handleDragStart() {
    startTimeRef.current = Date.now();
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const duration = Date.now() - startTimeRef.current;
    const committedRight = info.offset.x > 140 || info.velocity.x > 500;
    const committedLeft = info.offset.x < -140 || info.velocity.x < -500;
    if (committedRight) {
      onSwipe("KEEP", duration);
    } else if (committedLeft) {
      onSwipe("SKIP", duration);
    }
  }

  const isOwn = tweet.source === "OWN";
  const badgeLabel = isOwn ? "MY TWEET" : `@${tweet.referenceHandle ?? tweet.authorHandle}`;
  const badgeClass = isOwn
    ? "bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/30"
    : "bg-purple-500/15 text-purple-300 border border-purple-400/30";

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: 10 - stackIndex }}
      initial={false}
      animate={{ scale, y: yOffset }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className={`relative h-full w-full rounded-2xl border border-glass-border bg-atlas-surface p-6 shadow-xl ${
          isTop ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={isTop ? { x, rotate } : undefined}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragStart={isTop ? handleDragStart : undefined}
        onDragEnd={isTop ? handleDragEnd : undefined}
        exit={{
          x: exitDecision === "KEEP" ? 500 : -500,
          opacity: 0,
          rotate: exitDecision === "KEEP" ? 18 : -18,
          transition: { type: "spring", stiffness: 200, damping: 25 },
        }}
      >
        {/* Swipe decision indicators */}
        {isTop && (
          <>
            <motion.div
              className="pointer-events-none absolute left-6 top-6 z-10 -rotate-12 rounded-lg border-2 border-atlas-teal px-3 py-1"
              style={{ opacity: keepOpacity }}
            >
              <span className="text-lg font-bold text-atlas-teal">
                MY VOICE ✓
              </span>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-6 top-6 z-10 rotate-12 rounded-lg border-2 border-atlas-error px-3 py-1"
              style={{ opacity: skipOpacity }}
            >
              <span className="text-lg font-bold text-atlas-error">
                NOT ME ✗
              </span>
            </motion.div>
          </>
        )}

        {/* Color overlays */}
        {isTop && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-atlas-teal/10"
              style={{ opacity: keepOpacity }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-atlas-error/10"
              style={{ opacity: skipOpacity }}
            />
          </>
        )}

        {/* Tweet content */}
        <div className="relative z-20 flex h-full flex-col justify-between">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
            >
              {badgeLabel}
            </span>
            <p className="mt-5 text-lg leading-relaxed text-atlas-text">
              {tweet.text}
            </p>
          </div>

          {tweet.postedAt && (
            <div className="mt-6 text-xs text-atlas-text-muted">
              {new Date(tweet.postedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
