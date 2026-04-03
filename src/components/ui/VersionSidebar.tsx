"use client";

import { TweetDraft } from "@/lib/api";

interface DiffToken {
  text: string;
  type: "same" | "added" | "removed";
}

function wordDiff(prev: string, curr: string): DiffToken[] {
  const pWords = prev.split(/(\s+)/);
  const cWords = curr.split(/(\s+)/);

  // DP LCS table
  const m = pWords.length;
  const n = cWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (pWords[i] === cWords[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && pWords[i] === cWords[j]) {
      tokens.push({ text: pWords[i], type: "same" });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] <= dp[i][j + 1])) {
      tokens.push({ text: cWords[j], type: "added" });
      j++;
    } else {
      tokens.push({ text: pWords[i], type: "removed" });
      i++;
    }
  }
  return tokens;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  drafts: TweetDraft[];
  activeDraft: TweetDraft;
  onSelect: (draft: TweetDraft) => void;
  onClose: () => void;
}

export default function VersionSidebar({ drafts, activeDraft, onSelect, onClose }: Props) {
  // Group by sourceContent to form a version family; fall back to all drafts if no sourceContent
  const family = activeDraft.sourceContent
    ? drafts
        .filter((d) => d.sourceContent === activeDraft.sourceContent)
        .sort((a, b) => a.version - b.version)
    : drafts.slice(0, 8).sort((a, b) => a.version - b.version);

  return (
    <aside className="w-72 shrink-0 bg-atlas-nav border border-glass-border rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm text-atlas-text">Version History</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-atlas-text-secondary hover:text-atlas-text text-lg leading-none"
          aria-label="Close version history"
        >
          ×
        </button>
      </div>

      {family.length <= 1 && (
        <p className="text-xs text-atlas-text-secondary italic">
          No other versions yet. Use &ldquo;Try again&rdquo; or provide feedback to generate new versions.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {family.map((draft, idx) => {
          const isActive = draft.id === activeDraft.id;
          const prev = family[idx - 1];
          const tokens = prev ? wordDiff(prev.content, draft.content) : null;

          return (
            <button
              key={draft.id}
              type="button"
              onClick={() => onSelect(draft)}
              className={`text-left rounded-xl p-3 border transition-colors ${
                isActive
                  ? "border-atlas-teal bg-atlas-teal/5"
                  : "border-glass-border bg-atlas-surface hover:border-atlas-teal/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isActive ? "text-atlas-teal" : "text-atlas-text-secondary"}`}>
                  v{draft.version}
                </span>
                <span className="text-xs text-atlas-text-muted">{timeAgo(draft.createdAt)}</span>
              </div>

              {/* Feedback that prompted this version */}
              {draft.feedback && (
                <p className="text-xs text-atlas-text-secondary italic mb-2 border-l-2 border-atlas-teal/40 pl-2">
                  &ldquo;{draft.feedback}&rdquo;
                </p>
              )}

              {/* Diff vs previous, or plain preview for v1 */}
              {tokens ? (
                <p className="text-xs text-atlas-text leading-relaxed line-clamp-4">
                  {tokens.filter((t) => t.type !== "removed").map((t, i) => (
                    <span
                      key={i}
                      className={t.type === "added" ? "bg-atlas-teal/20 text-atlas-teal rounded px-0.5" : ""}
                    >
                      {t.text}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-xs text-atlas-text leading-relaxed line-clamp-3">{draft.content}</p>
              )}

              {draft.confidence !== undefined && draft.confidence !== null && (
                <p className="text-xs text-atlas-text-muted mt-1">
                  {Math.round(draft.confidence * 100)}% confidence
                  {draft.predictedEngagement ? ` · ~${(draft.predictedEngagement / 1000).toFixed(1)}K` : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
