"use client";

import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

interface NewsModeProps {
  creating: boolean;
  error: string | null;
  onDismissError: () => void;
  onGenerateNews: (
    articleUrl: string,
    fallbackText?: string
  ) => Promise<{ showFallback?: boolean } | void>;
}

export default function NewsMode({
  creating,
  error,
  onDismissError,
  onGenerateNews,
}: NewsModeProps) {
  const [articleUrl, setArticleUrl] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [showFallback, setShowFallback] = useState(false);
  const [urlError, setUrlError] = useState("");

  const handleGenerate = async () => {
    const trimmedUrl = articleUrl.trim();

    if (!trimmedUrl) {
      setUrlError("Paste an article URL to continue.");
      return;
    }

    setUrlError("");
    const result = await onGenerateNews(trimmedUrl, fallbackText.trim());

    if (result?.showFallback) {
      setShowFallback(true);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-5 sm:p-6">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Paste an article URL and Atlas will turn it into an X post in your voice.
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-muted" />
            <input
              type="url"
              value={articleUrl}
              onChange={(event) => setArticleUrl(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleGenerate();
                }
              }}
              aria-label="Article URL input"
              placeholder="https://example.com/article"
              className="w-full rounded-lg border border-glass-border bg-atlas-surface py-3 pl-11 pr-4 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
            />
          </div>
          <GradientButton onClick={() => void handleGenerate()} disabled={creating}>
            <span className="inline-flex items-center gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creating ? "Generating…" : "Generate Post"}
            </span>
          </GradientButton>
        </div>
        {urlError ? (
          <p className="mt-2 text-sm text-atlas-error">{urlError}</p>
        ) : null}
        {showFallback ? (
          <textarea
            value={fallbackText}
            onChange={(event) => setFallbackText(event.currentTarget.value)}
            rows={6}
            aria-label="Article text fallback"
            placeholder="Paste the article text or key points"
            className="mt-3 w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          />
        ) : null}
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            className="ml-3 text-atlas-error transition-colors hover:text-atlas-text"
          >
            x
          </button>
        </div>
      ) : null}
    </div>
  );
}
