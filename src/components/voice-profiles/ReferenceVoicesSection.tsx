"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PencilLine, Sparkles } from "lucide-react";
import ReferenceVoiceSelector from "@/components/onboarding/ReferenceVoiceSelector";
import GradientButton from "@/components/ui/GradientButton";
import Modal from "@/components/ui/Modal";
import { api, type ReferenceAccount, type ReferenceVoice } from "@/lib/api";
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
          // The reference library is best-effort here. Local selection still wins.
        }
      }

      try {
        const response = await api.voice.getReferences();
        onReferencesChange(response.voices);
      } catch {
        // Keep the locally cached selection even if the voice reference refresh fails.
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
