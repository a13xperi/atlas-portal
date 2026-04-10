"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { api, ApiError, type ReferenceVoice, type TwitterFollow } from "@/lib/api";

interface ImportFromXFollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceVoice[];
  onReferenceAdded: (voice: ReferenceVoice) => void;
}

type RowStatus = "idle" | "adding" | "added" | "error";

function normalizeHandle(handle: string | null | undefined) {
  return (handle ?? "").replace(/^@/, "").trim().toLowerCase();
}

function sortFollows(follows: TwitterFollow[]) {
  return [...follows].sort((left, right) => {
    if (right.followerCount !== left.followerCount) {
      return right.followerCount - left.followerCount;
    }

    return (left.handle || "").localeCompare(right.handle || "");
  });
}

function formatFollowerCount(count: number) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }

  return `${count}`;
}

export default function ImportFromXFollowsModal({
  isOpen,
  onClose,
  references,
  onReferenceAdded,
}: ImportFromXFollowsModalProps) {
  const [follows, setFollows] = useState<TwitterFollow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const existingHandles = useMemo(() => {
    const set = new Set<string>();
    for (const reference of references) {
      const handle = normalizeHandle(reference.handle ?? reference.name);
      if (handle) {
        set.add(handle);
      }
    }
    return set;
  }, [references]);

  const loadFollows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.twitter.follows();
      setFollows(sortFollows(response.follows));
    } catch (loadError: unknown) {
      if (loadError instanceof ApiError && loadError.statusCode === 401) {
        setError(
          "Your X account isn't linked or the token expired. Reconnect to import follows."
        );
      } else if (loadError instanceof ApiError && loadError.statusCode === 429) {
        setError("X is rate limiting us right now. Try again in a few minutes.");
      } else {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your X follows."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRowStatus({});
    setRowError({});
    void loadFollows();
  }, [isOpen, loadFollows]);

  const handleAdd = async (follow: TwitterFollow) => {
    const currentStatus = rowStatus[follow.id];
    if (currentStatus === "adding" || currentStatus === "added") {
      return;
    }

    setRowStatus((current) => ({ ...current, [follow.id]: "adding" }));
    setRowError((current) => {
      const next = { ...current };
      delete next[follow.id];
      return next;
    });

    try {
      const response = await api.voice.addReference(
        follow.displayName || follow.handle || "Reference",
        follow.handle || undefined
      );
      setRowStatus((current) => ({ ...current, [follow.id]: "added" }));
      onReferenceAdded(response.voice);
    } catch (addError: unknown) {
      setRowStatus((current) => ({ ...current, [follow.id]: "error" }));
      setRowError((current) => ({
        ...current,
        [follow.id]:
          addError instanceof Error
            ? addError.message
            : "Could not add this account.",
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import from X Follows"
      description="Add accounts you follow on X as reference voices for your blends."
    >
      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
          <p className="text-sm text-atlas-text-secondary">
            Loading your X follows...
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
            onClick={() => void loadFollows()}
            className="ml-2 font-semibold underline hover:text-atlas-text"
          >
            Try again
          </button>
        </div>
      ) : follows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" />
          <p className="mt-3 text-sm font-medium text-atlas-text">
            No follows available
          </p>
          <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
            Follow a few accounts on X and come back to import them.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-glass-border">
          {follows.map((follow) => {
            const normalizedHandle = normalizeHandle(follow.handle);
            const alreadyAdded =
              rowStatus[follow.id] === "added" ||
              (normalizedHandle && existingHandles.has(normalizedHandle));
            const status = rowStatus[follow.id] ?? "idle";
            const adding = status === "adding";

            return (
              <li
                key={follow.id}
                className="flex items-center gap-3 py-3"
                data-testid={`x-follow-row-${follow.id}`}
              >
                {follow.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={follow.avatarUrl}
                    alt={`${follow.displayName} avatar`}
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-glass-border object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/10 text-sm font-semibold uppercase text-atlas-teal"
                  >
                    {(follow.displayName || follow.handle || "?").charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-atlas-text">
                    {follow.displayName || follow.handle || "Unknown"}
                  </p>
                  <p className="truncate text-xs text-atlas-text-secondary">
                    @{follow.handle || "unknown"} ·{" "}
                    {formatFollowerCount(follow.followerCount)} followers
                  </p>
                  {rowError[follow.id] ? (
                    <p className="mt-1 text-xs text-atlas-error">
                      {rowError[follow.id]}
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
                    onClick={() => void handleAdd(follow)}
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
