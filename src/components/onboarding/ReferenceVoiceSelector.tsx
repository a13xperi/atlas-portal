"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { api, type ReferenceAccount } from "@/lib/api";
import {
  normalizeReferenceAccounts,
  REFERENCE_ACCOUNT_FALLBACK,
  REFERENCE_ACCOUNT_CATEGORY_ORDER,
  type ReferenceAccountCategory,
} from "@/lib/reference-accounts";

interface Props {
  accounts?: ReferenceAccount[];
  minRequired?: number;
  onContinue: () => void;
  onSelectionChange: (ids: string[]) => void;
  selected: string[];
}

type CategoryFilter = "All" | ReferenceAccountCategory;

export default function ReferenceVoiceSelector({
  accounts,
  minRequired = 2,
  onContinue,
  onSelectionChange,
  selected,
}: Props) {
  const normalized = normalizeReferenceAccounts(accounts);
  const initial = normalized.length > 0 ? normalized : REFERENCE_ACCOUNT_FALLBACK;
  const [availableAccounts, setAvailableAccounts] = useState<ReferenceAccount[]>(initial);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [isLoading, setIsLoading] = useState(initial.length === 0);

  useEffect(() => {
    const next = normalizeReferenceAccounts(accounts);
    if (next.length > 0) {
      setAvailableAccounts(next);
      setIsLoading(false);
    }
  }, [accounts]);

  useEffect(() => {
    let ignore = false;
    api.referenceAccounts
      .getAll()
      .then((response) => {
        if (ignore) return;
        const fetched = normalizeReferenceAccounts(response.accounts);
        setAvailableAccounts(fetched.length > 0 ? fetched : REFERENCE_ACCOUNT_FALLBACK);
      })
      .catch(() => {
        if (!ignore) setAvailableAccounts((c) => (c.length > 0 ? c : REFERENCE_ACCOUNT_FALLBACK));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  const visible =
    activeCategory === "All"
      ? availableAccounts
      : availableAccounts.filter((a) => a.category === activeCategory);

  const toggle = (id: string) => {
    onSelectionChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  };

  return (
    <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
          Reference voices
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
          Pick your reference voices
        </h2>
        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
          Choose at least {minRequired} accounts Atlas should learn from.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {REFERENCE_ACCOUNT_CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat as CategoryFilter)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-atlas-teal text-white"
                : "bg-atlas-surface text-atlas-text-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-4 py-8 text-center text-sm text-atlas-text-secondary">
          No accounts in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((account) => {
            const isSelected = selected.includes(account.id);
            const avatarUrl = account.profileImageUrl ?? account.avatarUrl;
            const label = account.displayName || account.handle || account.name || account.id;
            return (
              <button
                key={account.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Toggle ${label}`}
                onClick={() => toggle(account.id)}
                className={`relative rounded-3xl border bg-atlas-surface/70 p-4 text-center transition-all hover:cursor-pointer ${
                  isSelected
                    ? "border-atlas-teal ring-2 ring-atlas-teal scale-[1.03]"
                    : "border-glass-border hover:ring-1 hover:ring-atlas-teal/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-atlas-teal">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${label} avatar`}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-atlas-teal/20 text-xl font-semibold uppercase text-atlas-teal">
                    {label.charAt(0)}
                  </div>
                )}
                <p className="mt-3 text-xs text-atlas-text-muted">
                  {account.handle ? `@${account.handle}` : "\u00A0"}
                </p>
                <p className="mt-1 text-sm font-medium text-atlas-text">{label}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-glass-border bg-atlas-nav/95 p-4 backdrop-blur-xl">
        <p className="text-sm font-medium text-atlas-text">
          {selected.length} selected
          {selected.length < minRequired && (
            <span className="text-atlas-text-muted">
              {" "}— pick {minRequired - selected.length} more
            </span>
          )}
        </p>
        <GradientButton onClick={onContinue} disabled={selected.length < minRequired}>
          Continue →
        </GradientButton>
      </div>
    </div>
  );
}
