"use client";

import { useState } from "react";
import { Loader2, Link2, MessageSquareQuote } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { api, FetchedTweet } from "@/lib/api";

export const REPLY_ANGLES = ["Direct", "Curious", "Concise"] as const;

export type ReplyAngle = (typeof REPLY_ANGLES)[number];

interface ReplyModeProps {
  creating: boolean;
  error: string | null;
  onDismissError: () => void;
  onGenerateReply: (tweetText: string) => Promise<boolean | void> | boolean | void;
  onReplyAngleChange: (angle: ReplyAngle) => void;
  selectedReplyAngle: ReplyAngle;
}

const FETCH_FAILURE_MESSAGE =
  "Could not fetch tweet. Paste the tweet text directly instead.";

export default function ReplyMode({
  creating,
  error,
  onDismissError,
  onGenerateReply,
  onReplyAngleChange,
  selectedReplyAngle,
}: ReplyModeProps) {
  const [tweetUrl, setTweetUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchedTweet, setFetchedTweet] = useState<FetchedTweet | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [fallbackTweetText, setFallbackTweetText] = useState("");

  const replySourceText = fetchedTweet?.text ?? fallbackTweetText.trim();
  const showReplyComposer = Boolean(fetchedTweet) || Boolean(fetchError);

  const handleFetch = async () => {
    const trimmedUrl = tweetUrl.trim();

    if (!trimmedUrl) {
      setUrlError("Paste a tweet URL to continue.");
      return;
    }

    setUrlError("");
    setFetchError("");
    setFetchedTweet(null);
    setFallbackTweetText("");
    setFetching(true);

    try {
      const { tweet } = await api.tweets.fetchByUrl({ url: trimmedUrl });
      setFetchedTweet(tweet);
    } catch (fetchTweetError) {
      console.error("Failed to fetch tweet:", fetchTweetError);
      setFetchError(FETCH_FAILURE_MESSAGE);
    } finally {
      setFetching(false);
    }
  };

  const handleDraftReply = async () => {
    if (!replySourceText) return;
    await onGenerateReply(replySourceText);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-5 sm:p-6">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Paste a tweet URL and Atlas will draft the reply in your voice.
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-muted" />
            <input
              type="url"
              value={tweetUrl}
              onChange={(event) => setTweetUrl(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleFetch();
                }
              }}
              aria-label="Tweet URL input"
              placeholder="https://x.com/handle/status/1234567890"
              className="w-full rounded-lg border border-glass-border bg-atlas-surface py-3 pl-11 pr-4 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
            />
          </div>
          <GradientButton onClick={() => void handleFetch()} disabled={fetching}>
            <span className="inline-flex items-center gap-2">
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {fetching ? "Fetching…" : "Fetch"}
            </span>
          </GradientButton>
        </div>
        <p className="mt-2 text-sm text-atlas-text-muted">
          Paste an `x.com` or `twitter.com` status URL to pull the original tweet.
        </p>
        {urlError ? (
          <p className="mt-2 text-sm text-atlas-error">{urlError}</p>
        ) : null}
        {fetchError ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
          >
            {fetchError}
          </div>
        ) : null}
        {fetchError ? (
          <textarea
            value={fallbackTweetText}
            onChange={(event) => setFallbackTweetText(event.currentTarget.value)}
            rows={5}
            aria-label="Tweet text fallback"
            placeholder="Paste the tweet text here so Atlas can draft a reply."
            className="mt-3 w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          />
        ) : null}
      </div>

      {showReplyComposer ? (
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <ReplyAngleSelector
              selectedAngle={selectedReplyAngle}
              onAngleChange={onReplyAngleChange}
            />

            {fetchedTweet ? (
              <div className="rounded-2xl border border-glass-border bg-atlas-nav p-4">
                <div className="flex items-center gap-2 text-atlas-teal">
                  <MessageSquareQuote className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">
                    Original tweet
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-atlas-text">
                  {fetchedTweet.text}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-atlas-text-secondary">
                Atlas will use the tweet above as context and draft the reply below.
              </p>
              <GradientButton
                onClick={() => void handleDraftReply()}
                disabled={creating || !replySourceText}
              >
                {creating ? "Drafting…" : "Draft Reply"}
              </GradientButton>
            </div>

            {error ? (
              <div
                role="alert"
                className="flex items-center justify-between rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={onDismissError}
                  className="ml-3 text-atlas-error transition-colors hover:text-atlas-text"
                >
                  ✕
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface ReplyAngleSelectorProps {
  selectedAngle: ReplyAngle;
  onAngleChange: (angle: ReplyAngle) => void;
}

function ReplyAngleSelector({
  selectedAngle,
  onAngleChange,
}: ReplyAngleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
        Reply angle
      </p>
      <div
        role="tablist"
        aria-label="Reply angle"
        className="inline-flex flex-wrap rounded-xl bg-glass p-1 backdrop-blur-xl"
      >
        {REPLY_ANGLES.map((angle) => {
          const isActive = angle === selectedAngle;

          return (
            <button
              key={angle}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onAngleChange(angle)}
              className={`text-sm transition-colors ${
                isActive
                  ? "rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel px-4 py-2 text-white"
                  : "px-4 py-2 text-atlas-text-secondary hover:text-white"
              }`}
            >
              {angle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
