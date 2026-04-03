"use client";

import { FormEvent, ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

export interface NewsModeProps {
  creating?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  onArticleUrlChange?: (value: string) => void;
  onGenerateNews: (
    articleUrl: string,
    fallbackText?: string
  ) => Promise<{ showFallback?: boolean } | void>;
  urlPreviewCard?: ReactNode;
}

export default function NewsMode({
  creating = false,
  error,
  onDismissError,
  onArticleUrlChange,
  onGenerateNews,
  urlPreviewCard,
}: NewsModeProps) {
  const [articleUrl, setArticleUrl] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await onGenerateNews(
      articleUrl,
      showFallback ? fallbackText : ""
    );

    setShowFallback(Boolean(result?.showFallback));
  };

  return (
    <form
      className="mt-6 space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl"
      onSubmit={handleSubmit}
    >
      <div>
        <label
          htmlFor="news-article-url"
          className="text-xs uppercase tracking-wide text-atlas-text-secondary"
        >
          Paste an article URL
        </label>
        <input
          id="news-article-url"
          type="url"
          value={articleUrl}
          onChange={(event) => {
            const nextArticleUrl = event.target.value;

            setArticleUrl(nextArticleUrl);
            onArticleUrlChange?.(nextArticleUrl);
          }}
          placeholder="Paste an article URL…"
          aria-label="Article URL input"
          className="mt-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
        />
      </div>

      {urlPreviewCard}

      {showFallback ? (
        <div>
          <label
            htmlFor="news-fallback-text"
            className="text-xs uppercase tracking-wide text-atlas-text-secondary"
          >
            Article text or key points
          </label>
          <textarea
            id="news-fallback-text"
            value={fallbackText}
            onChange={(event) => setFallbackText(event.target.value)}
            placeholder="Paste the article text or key points"
            aria-label="Article text fallback"
            rows={5}
            className="mt-3 w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
          <p className="mt-2 text-xs text-atlas-text-muted">
            Atlas will use this fallback text if the article URL cannot be fetched.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-2 text-sm text-atlas-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="ml-2 transition-colors hover:text-atlas-text"
          >
            x
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <GradientButton disabled={creating} type="submit">
          {creating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Post...
            </span>
          ) : (
            "Generate Post"
          )}
        </GradientButton>
        {!showFallback ? (
          <button
            type="button"
            onClick={() => setShowFallback(true)}
            className="text-sm text-atlas-text-secondary transition-colors hover:text-atlas-teal"
          >
            Paste text instead
          </button>
        ) : null}
      </div>
    </form>
  );
}
