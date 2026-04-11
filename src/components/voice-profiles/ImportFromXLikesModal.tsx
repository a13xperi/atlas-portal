"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { api, ApiError, type ReferenceVoice, type TwitterLike } from "@/lib/api";

interface ImportFromXLikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceVoice[];
  onReferenceAdded: (voice: ReferenceVoice) => void;
}

type RowStatus = "idle" | "adding" | "added" | "error";

interface LikedCreator {
  handle: string;
  avatarUrl: string | null;
  likeCount: number;
}

function normalizeHandle(handle: string | null | undefined) {
  return (handle ?? "").replace(/^@/, "").trim().toLowerCase();
}

function deduplicateCreators(likes: TwitterLike[]): LikedCreator[] {
  const map = new Map<string, LikedCreator>();
  for (const like of likes) {
    const handle = normalizeHandle(like.author_handle);
    if (!handle) continue;
    const existing = map.get(handle);
    if (existing) {
      existing.likeCount += 1;
    } else {
      map.set(handle, {
        handle,
        avatarUrl: like.author_avatar,
        likeCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    return a.handle.localeCompare(b.handle);
  });
}

export default function ImportFromXLikesModal({
  isOpen,
  onClose,
  references,
  onReferenceAdded,
}: ImportFromXLikesModalProps) {
  const [creators, setCreators] = useState<LikedCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const existingHandles = useMemo(() => {
    const set = new Set<string>();
    for (const reference of references) {
      const handle = normalizeHandle(reference.handle ?? reference.name);
      if (handle) set.add(handle);
    }
    return set;
  }, [references]);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.twitter.likes();
      setCreators(deduplicateCreators(response.likes));
    } catch (loadError: unknown) {
      if (loadError instanceof ApiError && loadError.statusCode === 401) {
        setError("Your X account isn't linked or the token expired. Reconnect to import from likes.");
      } else if (loadError instanceof ApiError && loadError.statusCode === 429) {
        setError("X is rate limiting us right now. Try again in a few minutes.");
      } else {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load creators from your likes."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setRowStatus({});
    setRowError({});
    void loadCreators();
  }, [isOpen, loadCreators]);

  const handleAdd = async (creator: LikedCreator) => {
    const currentStatus = rowStatus[creator.handle];
    if (currentStatus === "adding" || currentStatus === "added") return;

    setRowStatus((current) => ({ ...current, [creator.handle]: "adding" }));
    setRowError((current) => {
      const next = { ...current };
      delete next[creator.handle];
      return next;
    });

    try {
      const response = await api.voice.addReference(creator.handle, creator.handle);
      setRowStatus((current) => ({ ...current, [creator.handle]: "added" }));
      onReferenceAdded(response.voice);
    } catch (addError: unknown) {
      setRowStatus((current) => ({ ...current, [creator.handle]: "error" }));
      setRowError((current) => ({
        ...current,
        [creator.handle]:
          addError instanceof Error ? addError.message : "Could not add this account.",
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="From Your Likes"
      description="People whose tweets you've liked — add them as voice inspirations."
    >
      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
          <p className="text-sm text-atlas-text-secondary">
            Loading creators from your likes...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadCreators()}
            className="ml-2 font-semibold underline hover:text-atlas-text"
          >
            Try again
          </button>
        </div>
      ) : creators.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" />
          <p className="mt-3 text-sm font-medium text-atlas-text">
            No liked tweet creators found
          </p>
          <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
            Like some tweets on X first, then come back to import their creators.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-glass-border">
          {creators.map((creator) => {
            const alreadyAdded =
              rowStatus[creator.handle] === "added" ||
              existingHandles.has(creator.handle);
            const status = rowStatus[creator.handle] ?? "idle";
            const adding = status === "adding";

            return (
              <li
                key={creator.handle}
                className="flex items-center gap-3 py-3"
              >
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.avatarUrl}
                    alt={`@${creator.handle} avatar`}
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-glass-border object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/10 text-sm font-semibold uppercase text-atlas-teal"
                  >
                    {creator.handle.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-atlas-text">
                    @{creator.handle}
                  </p>
                  <p className="truncate text-xs text-atlas-text-secondary">
                    {creator.likeCount} tweet{creator.likeCount !== 1 ? "s" : ""} liked
                  </p>
                  {rowError[creator.handle] ? (
                    <p className="mt-1 text-xs text-atlas-error">
                      {rowError[creator.handle]}
                    </p>
                  ) : null}
                </div>

                {alreadyAdded ? (
                  <span
                    aria-label="Already added"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Added
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAdd(creator)}
                    disabled={adding}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal transition-colors hover:bg-atlas-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {adding ? "Adding..." : "Add"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
