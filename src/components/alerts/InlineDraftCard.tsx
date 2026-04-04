"use client";

import { useMemo, useState } from "react";
import StatusPill from "@/components/ui/StatusPill";
import { Alert, api, TweetDraft } from "@/lib/api";

const POST_CHARACTER_LIMIT = 280;

interface InlineDraftCardProps {
  alert: Alert;
}

function buildAlertSource(alert: Alert) {
  return [
    `Alert type: ${alert.type}`,
    alert.title.trim(),
    alert.context ? `Context: ${alert.context.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2000);
}

export default function InlineDraftCard({ alert }: InlineDraftCardProps) {
  const initialDraftText = alert.draftReply?.trim() ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<TweetDraft | null>(null);
  const [draftText, setDraftText] = useState(initialDraftText);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  const alertSource = useMemo(() => buildAlertSource(alert), [alert]);
  const hasDraft = draftText.trim().length > 0;
  const characterCount = draftText.length;
  const characterCountClassName =
    characterCount > POST_CHARACTER_LIMIT
      ? "text-atlas-error"
      : characterCount > 250
        ? "text-atlas-warning"
        : characterCount > 200
          ? "text-yellow-400"
          : "text-atlas-text-secondary";

  const generateDraft = async (shouldRegenerate = false) => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response =
        shouldRegenerate && draft?.id
          ? await api.drafts.regenerate(draft.id)
          : await api.drafts.generate(alertSource, "MANUAL");

      setDraft(response.draft);
      setDraftText(response.draft.content);
    } catch (draftError: unknown) {
      setError(
        draftError instanceof Error ? draftError.message : "Failed to generate draft"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);

    if (!hasDraft) {
      void generateDraft();
    }
  };

  const handleRegenerate = () => {
    void generateDraft(Boolean(draft?.id));
  };

  const handleCopy = async () => {
    if (!draftText.trim() || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draftText);
      setError(null);
    } catch {
      setError("Copy failed. Please try again.");
    }
  };

  const handleSaveDraft = async () => {
    if (!draftText.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const { draft: created } = await api.drafts.create(draftText, "TRENDING_TOPIC");
      setSavedDraftId(created.id);
    } catch {
      setError("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-glass-border/80 pt-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {hasDraft && <StatusPill label="Draft created" variant="posted" />}
        {!isOpen && (
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-2 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15"
          >
            Draft Post
          </button>
        )}
      </div>

      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          isOpen
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-glass-border bg-atlas-surface/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
                  Draft Workspace
                </p>
                <p className="mt-1 text-sm text-atlas-text-secondary">
                  Generated from this alert&apos;s title and context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary transition-colors hover:text-atlas-text"
              >
                Collapse
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
              >
                {error}
              </div>
            )}

            {isGenerating && !hasDraft ? (
              <div className="mt-4 rounded-xl border border-glass-border bg-glass px-4 py-6 text-sm text-atlas-text-secondary">
                Generating draft...
              </div>
            ) : (
              <textarea
                aria-label="Draft post text"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Your generated draft will appear here."
                className="mt-4 min-h-[156px] w-full rounded-xl border border-glass-border bg-atlas-bg/60 px-4 py-3 text-sm leading-6 text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs font-medium ${characterCountClassName}`}>
                {characterCount}/{POST_CHARACTER_LIMIT} characters
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draftText.trim()}
                  className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-2 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!draftText.trim() || isSaving || !!savedDraftId}
                  className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-3 py-2 text-xs font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savedDraftId ? "Saved ✓" : isSaving ? "Saving..." : "Save Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
