"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Plus, X } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { api, type ReferenceAccount, type TwitterFollow } from "@/lib/api";
import {
  normalizeReferenceAccounts,
  REFERENCE_ACCOUNT_FALLBACK,
  REFERENCE_ACCOUNT_CATEGORY_ORDER,
  type ReferenceAccountCategory,
} from "@/lib/reference-accounts";

type SourceTab = "curated" | "follows";

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
  minRequired = 1,
  onContinue,
  onSelectionChange,
  selected,
}: Props) {
  const normalized = normalizeReferenceAccounts(accounts);
  const initial = normalized.length > 0 ? normalized : REFERENCE_ACCOUNT_FALLBACK;
  const [availableAccounts, setAvailableAccounts] = useState<ReferenceAccount[]>(initial);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [isLoading, setIsLoading] = useState(initial.length === 0);
  const [customHandle, setCustomHandle] = useState("");
  const [customError, setCustomError] = useState("");
  const customErrorId = useId();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const customInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddCustom = () => {
    const handle = customHandle.replace(/^@/, "").trim().toLowerCase();
    if (!handle) return;
    if (!/^[a-zA-Z0-9_]{1,50}$/.test(handle)) {
      setCustomError("Enter a valid X handle (letters, numbers, underscores)");
      return;
    }
    setCustomError("");
    const id = handle;
    if (!availableAccounts.find((a) => a.id === id)) {
      const newAccount: ReferenceAccount = {
        id,
        handle,
        name: handle,
        displayName: `@${handle}`,
        profileImageUrl: null,
        avatarUrl: null,
        category: "Custom" as ReferenceAccountCategory,
      };
      setAvailableAccounts((prev) => [newAccount, ...prev]);
    }
    if (!selected.includes(id)) {
      onSelectionChange([...selected, id]);
    }
    setCustomHandle("");
    customInputRef.current?.focus();
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
          Choose at least {minRequired} account to get started. You can add more later.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {REFERENCE_ACCOUNT_CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(cat as CategoryFilter)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-atlas-teal text-atlas-bg"
                : "bg-atlas-surface text-atlas-text-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-atlas-text-muted select-none">@</span>
          <input
            ref={customInputRef}
            type="text"
            aria-label="X handle"
            aria-invalid={Boolean(customError)}
            aria-errormessage={customError ? customErrorId : undefined}
            placeholder="Add any X handle…"
            value={customHandle}
            onChange={(e) => { setCustomHandle(e.target.value); setCustomError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
            className="w-full rounded-lg border border-glass-border bg-atlas-nav pl-7 pr-3 py-2 text-sm text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none"
          />
          {customHandle && (
            <button
              type="button"
              aria-label="Clear custom handle"
              onClick={() => { setCustomHandle(""); setCustomError(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-atlas-text-muted hover:text-atlas-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!customHandle.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-2 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      {customError && (
        <p id={customErrorId} role="alert" className="mb-3 text-xs text-atlas-error">{customError}</p>
      )}

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
                    <Check className="h-3.5 w-3.5 text-atlas-bg" />
                  </span>
                )}
                {avatarUrl && !imgErrors.has(account.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${label} avatar`}
                    width={64}
                    height={64}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                    onError={() => setImgErrors((prev) => new Set(prev).add(account.id))}
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-atlas-teal/20 text-xl font-semibold uppercase text-atlas-teal">
                    {label.charAt(0)}
                  </div>
                )}
                <p className="mt-3 text-xs text-atlas-text-muted">
                  {account.handle ? (
                    <a
                      href={`https://twitter.com/${account.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 hover:text-atlas-teal hover:underline"
                    >
                      @{account.handle}
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                  ) : "\u00A0"}
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
