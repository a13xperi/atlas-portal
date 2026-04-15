"use client";

import { useEffect } from "react";
import { Heart, Repeat2, MessageCircle } from "lucide-react";

interface TopTweet {
  text: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
}

interface DimensionExample {
  dimension: string;
  score: number;
  tweetExcerpt: string;
}

interface VoiceEvidencePanelProps {
  topTweets: TopTweet[];
  dimensionExamples: DimensionExample[];
  tweetsAnalyzed: number;
  onConfirm: () => void;
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

export default function VoiceEvidencePanel({
  topTweets,
  dimensionExamples,
  tweetsAnalyzed,
  onConfirm,
}: VoiceEvidencePanelProps) {
  useEffect(() => {
    if (!topTweets || topTweets.length === 0) {
      onConfirm();
    }
  }, [topTweets, onConfirm]);

  if (!topTweets || topTweets.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-atlas-text">
          Here&apos;s what shaped your scores
        </h3>
        <p className="text-xs text-atlas-text-muted">
          Analyzed {tweetsAnalyzed} tweet{tweetsAnalyzed === 1 ? "" : "s"} to build your voice profile.
        </p>
      </div>

      {topTweets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-atlas-text-secondary">Top tweets</p>
          <div className="space-y-2">
            {topTweets.slice(0, 3).map((tweet, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-atlas-surface border border-glass-border p-3"
              >
                <p className="text-sm text-atlas-text leading-relaxed">
                  &ldquo;{truncate(tweet.text, 120)}&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-atlas-text-muted">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {tweet.likeCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3.5 w-3.5" />
                    {tweet.retweetCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {tweet.replyCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dimensionExamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-atlas-text-secondary">Dimension examples</p>
          <ul className="space-y-2">
            {dimensionExamples.slice(0, 3).map((ex, idx) => (
              <li
                key={idx}
                className="text-sm text-atlas-text border-l-2 border-atlas-teal pl-3"
              >
                <span className="font-medium">{ex.dimension}</span>{" "}
                <span className="text-atlas-text-muted">{ex.score}/10</span>
                <span className="mx-1 text-atlas-text-muted">—</span>
                <span className="text-atlas-text-secondary italic">
                  &ldquo;{truncate(ex.tweetExcerpt, 80)}&rdquo;
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-atlas-teal px-4 py-2.5 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90"
        >
          Looks right →
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl border border-glass-border bg-atlas-surface px-4 py-2.5 text-sm font-medium text-atlas-text transition-colors hover:bg-atlas-bg"
        >
          Adjust manually
        </button>
      </div>
    </div>
  );
}
