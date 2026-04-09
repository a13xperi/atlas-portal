"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2, PencilLine, RefreshCw, Sparkles, Twitter } from "lucide-react";
import ReferenceVoiceSelector from "@/components/onboarding/ReferenceVoiceSelector";
import GradientButton from "@/components/ui/GradientButton";
import Modal from "@/components/ui/Modal";
import {
  api,
  type ReferenceAccount,
  type ReferenceVoice,
  type TwitterFollow,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/tokens";
import {
  getEqualReferenceWeights,
  getReferenceAccountLookup,
  mergeReferenceSelectionIds,
  normalizeReferenceAccount,
  normalizeReferenceAccounts,
  persistReferenceSelections,
  readStoredReferenceSelection,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";

interface ReferenceVoicesSectionProps {
  onReferencesChange: (voices: ReferenceVoice[]) => void;
  references: ReferenceVoice[];
}

function followToReferenceAccount(follow: TwitterFollow): ReferenceAccount {
  return {
    id: `x:${follow.id}`,
    handle: follow.handle,
    displayName: follow.displayName || `@${follow.handle}`,
    name: follow.displayName || follow.handle,
    profileImageUrl: follow.avatarUrl,
    avatarUrl: follow.avatarUrl,
    category: "From X",
  };
}

export default function ReferenceVoicesSection({
  onReferencesChange,
  references,
}: ReferenceVoicesSectionProps) {
  const { user } = useAuth();
  const [catalog, setCatalog] =
    useState<ReferenceAccount[]>(REFERENCE_ACCOUNT_FALLBACK);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, true>>({});
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Discover from X
  const [followAccounts, setFollowAccounts] = useState<ReferenceAccount[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [followsLoaded, setFollowsLoaded] = useState(false);
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  const loadFollows = () => {
    setFollowsLoading(true);
    setFollowsError(null);
    api.twitter
      .follows()
      .then((response) => {
        setFollowAccounts(response.follows.map(followToReferenceAccount));
        setFollowsLoaded(true);
      })
      .catch((err: Error & { statusCode?: number }) => {
        if (err?.statusCode === 401) {
          setFollowsError("Connect your X account to import follows.");
        } else if (err?.statusCode === 429) {
          setFollowsError("X rate limit reached. Try again in a minute.");
        } else {
          setFollowsError("Couldn't load your X follows. Try again.");
        }
      })
      .finally(() => setFollowsLoading(false));
  };

  const addFollowAsReference = async (account: ReferenceAccount) => {
    if (pendingFollowIds.has(account.id)) {
      return;
    }
    setPendingFollowIds((prev) => {
      const next = new Set(prev);
      next.add(account.id);
      return next;
    });

    try {
      setCatalog((prev) =>
        prev.find((entry) => entry.id === account.id) ? prev : [account, ...prev]
      );

      const nextIds = selectedIds.includes(account.id)
        ? selectedIds
        : [...selectedIds, account.id];

      const weights = getEqualReferenceWeights(nextIds);
      await persistReferenceSelections({
        userId: user?.id,
        ids: nextIds,
        weights,
        saveRemote: api.referenceAccounts.saveSelections,
      });

      try {
        await api.voice.addReference(
          account.displayName || account.name || account.handle || account.id,
          account.handle || account.id
        );
      } catch {
        // best-effort
      }

      try {
        const response = await api.voice.getReferences();
        onReferencesChange(response.voices);
      } catch {
        // ignore refresh failure
      }

      setSelectedIds(nextIds);
    } finally {
      setPendingFollowIds((prev) => {
        const next = new Set(prev);
        next.delete(account.id);
        return next;
      });
    }
  };

  useEffect(() => {
    let ignore = false;

    api.referenceAccounts
      .getAll()
      .then((response) => {
        if (ignore) {
          return;
        }

        const normalizedAccounts = normalizeReferenceAccounts(response.accounts);
        setCatalog(
          normalizedAccounts.length > 0
            ? normalizedAccounts
            : REFERENCE_ACCOUNT_FALLBACK
        );
      })
      .catch(() => {
        if (!ignore) {
          setCatalog(REFERENCE_ACCOUNT_FALLBACK);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const storedSelection = readStoredReferenceSelection(user?.id);
    const mergedIds = mergeReferenceSelectionIds(
      storedSelection?.ids ?? [],
      references
    );

    setSelectedIds(mergedIds);
  }, [references, user?.id]);

  useEffect(() => {
    if (isEditing) {
      setDraftSelectedIds(selectedIds);
    }
  }, [isEditing, selectedIds]);

  const catalogLookup = getReferenceAccountLookup(catalog);
  const selectedAccounts = selectedIds.map((id) => {
    const existingAccount = catalogLookup.get(id);

    if (existingAccount) {
      return existingAccount;
    }

    const matchingReference = references.find((reference) => {
      const normalizedHandle = reference.handle?.replace(/^@/, "");
      return normalizedHandle === id || reference.id === id;
    });

    return normalizeReferenceAccount({
      id,
      handle: matchingReference?.handle ?? id,
      name: matchingReference?.name ?? id,
      profileImageUrl: matchingReference?.avatarUrl ?? null,
    });
  });

  const handleSaveSelection = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const weights = getEqualReferenceWeights(draftSelectedIds);

      await persistReferenceSelections({
        userId: user?.id,
        ids: draftSelectedIds,
        weights,
        saveRemote: api.referenceAccounts.saveSelections,
      });

      const existingHandles = new Set(
        references.map((reference) =>
          (reference.handle ?? reference.name ?? reference.id)
            .replace(/^@/, "")
            .toLowerCase()
        )
      );

      for (const id of draftSelectedIds) {
        if (existingHandles.has(id.toLowerCase())) {
          continue;
        }

        const account = catalogLookup.get(id);

        try {
          await api.voice.addReference(
            account?.displayName || account?.name || id,
            account?.handle || id
          );
        } catch {
          // best-effort
        }
      }

      try {
        const response = await api.voice.getReferences();
        onReferencesChange(response.voices);
      } catch {
        // ignore
      }

      setSelectedIds(draftSelectedIds);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mt-8 rounded-2xl border border-glass-border bg-atlas-surface-glass p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-delphi-blue-400">
              Reference voices
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-atlas-text">
              Accounts shaping your current voice mix
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
              Atlas keeps this set in sync with onboarding and uses it as the
              foundation for blend experiments.
            </p>
          </div>

          <GradientButton
            size="sm"
            variant="outline-teal"
            onClick={() => setIsEditing(true)}
          >
            <span className="flex items-center gap-2">
              <PencilLine className="h-4 w-4" />
              Edit
            </span>
          </GradientButton>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold text-atlas-teal">
            {selectedAccounts.length} selected
          </span>
          <span className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-1 text-xs text-atlas-text-secondary">
            Even split across selected accounts
          </span>
        </div>

        {selectedAccounts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-4 py-8 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-atlas-teal" />
            <p className="mt-3 text-sm text-atlas-text-secondary">
              No reference voices selected yet. Pick at least two to start
              shaping a richer voice profile.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-2xl border border-glass-border bg-atlas-surface/70 p-4"
              >
                {account.profileImageUrl && !avatarErrors[account.id] ? (
                  <Image
                    alt={`${account.displayName || account.name || account.handle} avatar`}
                    className="h-12 w-12 rounded-full border border-glass-border object-cover"
                    height={48}
                    onError={() =>
                      setAvatarErrors((current) => ({
                        ...current,
                        [account.id]: true,
                      }))
                    }
                    src={account.profileImageUrl}
                    width={48}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-atlas-teal/30 text-sm font-semibold uppercase"
                    style={{
                      backgroundColor: `${colors.atlasTeal}1A`,
                      color: colors.atlasTeal,
                    }}
                  >
                    {(account.handle || account.id).charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-atlas-text">
                    {account.displayName || account.name || account.handle || account.id}
                  </p>
                  <p className="truncate text-xs text-atlas-text-secondary">
                    @{account.handle || account.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discover from X */}
      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface-glass p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-delphi-blue-400">
              <Twitter className="h-3.5 w-3.5" />
              Discover from X
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-atlas-text">
              Pull reference voices from accounts you follow
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
              Atlas can scan the people you already follow on X and surface
              them as candidates for your voice mix.
            </p>
          </div>

          <GradientButton
            size="sm"
            variant="outline-teal"
            onClick={loadFollows}
          >
            <span className="flex items-center gap-2">
              {followsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : followsLoaded ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Twitter className="h-4 w-4" />
              )}
              {followsLoading
                ? "Loading"
                : followsLoaded
                  ? "Refresh"
                  : "Load my X follows"}
            </span>
          </GradientButton>
        </div>

        {followsError && (
          <div className="mt-4 rounded-xl border border-atlas-error/40 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
            {followsError}
          </div>
        )}

        {!followsLoaded && !followsLoading && !followsError && (
          <div className="mt-5 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-4 py-8 text-center">
            <Twitter className="mx-auto h-5 w-5 text-atlas-teal" />
            <p className="mt-3 text-sm text-atlas-text-secondary">
              Click{" "}
              <span className="font-medium text-atlas-text">
                Load my X follows
              </span>{" "}
              to pull the people you already follow on X. You can add any of
              them as reference voices in one click.
            </p>
          </div>
        )}

        {followsLoading && (
          <div className="mt-6 flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
          </div>
        )}

        {followsLoaded &&
          !followsLoading &&
          followAccounts.length === 0 &&
          !followsError && (
            <div className="mt-5 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-4 py-8 text-center text-sm text-atlas-text-secondary">
              We didn&rsquo;t find any follows on your X account yet.
            </div>
          )}

        {followsLoaded && followAccounts.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {followAccounts.map((account) => {
              const isSelected = selectedIds.includes(account.id);
              const isPending = pendingFollowIds.has(account.id);
              const label =
                account.displayName ||
                account.name ||
                account.handle ||
                account.id;
              const avatarUrl =
                account.profileImageUrl ?? account.avatarUrl ?? null;
              return (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Add ${label} as a reference voice`}
                  onClick={() => addFollowAsReference(account)}
                  disabled={isSelected || isPending}
                  className={`relative rounded-3xl border bg-atlas-surface/70 p-4 text-center transition-all hover:cursor-pointer disabled:cursor-default ${
                    isSelected
                      ? "border-atlas-teal ring-2 ring-atlas-teal"
                      : "border-glass-border hover:ring-1 hover:ring-atlas-teal/50"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-atlas-teal">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                  {isPending && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-atlas-teal/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    </span>
                  )}
                  {avatarUrl && !avatarErrors[account.id] ? (
                    <Image
                      alt={`${label} avatar`}
                      className="mx-auto h-16 w-16 rounded-full object-cover"
                      height={64}
                      width={64}
                      src={avatarUrl}
                      onError={() =>
                        setAvatarErrors((current) => ({
                          ...current,
                          [account.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-atlas-teal/20 text-xl font-semibold uppercase text-atlas-teal">
                      {label.charAt(0)}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-atlas-text-muted">
                    {account.handle ? `@${account.handle}` : "\u00A0"}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-atlas-text">
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        description={
          isSaving
            ? "Saving your selections..."
            : "Choose the reference accounts Atlas should learn from."
        }
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit reference voices"
      >
        <ReferenceVoiceSelector
          onContinue={handleSaveSelection}
          onSelectionChange={setDraftSelectedIds}
          selected={draftSelectedIds}
        />
      </Modal>
    </>
  );
}
