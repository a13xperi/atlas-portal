"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, ToggleLeft, ToggleRight, Users, UserCog, Crown } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { api, FeatureFlagRecord } from "@/lib/api";
import { FLAG_DEFS, FlagScope } from "@/lib/feature-flags";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlagCardData {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rolloutRole: FlagScope;
  updatedAt: string | null;
}

const SCOPE_OPTIONS: { value: FlagScope; label: string; icon: typeof Users }[] = [
  { value: "everyone", label: "Everyone", icon: Users },
  { value: "managers", label: "Managers", icon: UserCog },
  { value: "admins", label: "Admins", icon: Crown },
];

const LS_KEY = "atlas-feature-flags";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDemoCards(): FlagCardData[] {
  return FLAG_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    enabled: def.defaultEnabled,
    rolloutRole: def.scope,
    updatedAt: null,
  }));
}

function mergeApiIntoCards(cards: FlagCardData[], apiFlags: FeatureFlagRecord[]): FlagCardData[] {
  const map = new Map(apiFlags.map((f) => [f.key, f]));
  return cards.map((c) => {
    const remote = map.get(c.key);
    if (!remote) return c;
    return {
      ...c,
      enabled: remote.enabled,
      rolloutRole: (remote.rolloutRole as FlagScope) ?? c.rolloutRole,
      updatedAt: remote.updatedAt,
    };
  });
}

/** Persist to localStorage so other tabs and the FeatureFlagProvider pick it up */
function syncToLocalStorage(cards: FlagCardData[]) {
  if (typeof window === "undefined") return;
  try {
    const state: Record<string, { enabled: boolean; rolloutRole: FlagScope }> = {};
    for (const c of cards) {
      state[c.key] = { enabled: c.enabled, rolloutRole: c.rolloutRole };
    }
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminFlagsPage() {
  const [cards, setCards] = useState<FlagCardData[]>(buildDemoCards);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load from API on mount
  useEffect(() => {
    api.featureFlags
      .list()
      .then((res) => {
        setCards((prev) => mergeApiIntoCards(prev, res.flags));
      })
      .catch(() => {
        // API unavailable — keep demo defaults
      });
  }, []);

  const handleToggle = useCallback(
    async (key: string) => {
      const card = cards.find((c) => c.key === key);
      if (!card) return;

      const newEnabled = !card.enabled;
      // Optimistic update
      setCards((prev) =>
        prev.map((c) => (c.key === key ? { ...c, enabled: newEnabled } : c)),
      );
      setSaving(key);
      setError(null);

      try {
        await api.featureFlags.update(key, { enabled: newEnabled });
      } catch {
        // Revert on failure
        setCards((prev) =>
          prev.map((c) => (c.key === key ? { ...c, enabled: !newEnabled } : c)),
        );
        setError(`Failed to update ${key}`);
      } finally {
        setSaving(null);
        // Sync localStorage after state settles
        setCards((prev) => {
          syncToLocalStorage(prev);
          return prev;
        });
      }
    },
    [cards],
  );

  const handleRoleChange = useCallback(
    async (key: string, newRole: FlagScope) => {
      const card = cards.find((c) => c.key === key);
      if (!card || card.rolloutRole === newRole) return;

      const prevRole = card.rolloutRole;
      // Optimistic update
      setCards((prev) =>
        prev.map((c) => (c.key === key ? { ...c, rolloutRole: newRole } : c)),
      );
      setSaving(key);
      setError(null);

      try {
        await api.featureFlags.update(key, { rolloutRole: newRole });
      } catch {
        // Revert
        setCards((prev) =>
          prev.map((c) => (c.key === key ? { ...c, rolloutRole: prevRole } : c)),
        );
        setError(`Failed to update role for ${key}`);
      } finally {
        setSaving(null);
        setCards((prev) => {
          syncToLocalStorage(prev);
          return prev;
        });
      }
    },
    [cards],
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-atlas-bg px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-atlas-surface border border-glass-border flex items-center justify-center text-atlas-teal">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-text-muted">
                Admin
              </p>
              <h1 className="text-2xl font-heading font-bold text-atlas-text">
                Feature Flags
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-atlas-error/10 border border-atlas-error/20 px-4 py-2.5 text-sm text-atlas-error">
              {error}
            </div>
          )}

          {/* Flag cards */}
          <div className="flex flex-col gap-3">
            {cards.map((card) => {
              const isSaving = saving === card.key;

              return (
                <div
                  key={card.key}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-atlas-text truncate">
                        {card.label}
                      </span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-atlas-surface text-atlas-text-muted font-mono">
                        {card.key}
                      </code>
                    </div>
                    <p className="text-xs text-atlas-text-secondary mt-1">
                      {card.description}
                    </p>
                    {card.updatedAt && (
                      <p className="text-[10px] text-atlas-text-muted mt-1">
                        Updated {new Date(card.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Role selector */}
                    <div className="flex items-center rounded-lg border border-glass-border overflow-hidden">
                      {SCOPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = card.rolloutRole === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleRoleChange(card.key, opt.value)}
                            disabled={isSaving}
                            title={opt.label}
                            className={`px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              active
                                ? "bg-atlas-teal/15 text-atlas-teal"
                                : "bg-atlas-surface text-atlas-text-muted hover:text-atlas-text-secondary"
                            } ${isSaving ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(card.key)}
                      disabled={isSaving}
                      aria-label={`${card.enabled ? "Disable" : "Enable"} ${card.label}`}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        card.enabled
                          ? "bg-gradient-to-r from-delphi-teal to-delphi-teal/60"
                          : "bg-atlas-surface border border-glass-border"
                      } ${isSaving ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                          card.enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
