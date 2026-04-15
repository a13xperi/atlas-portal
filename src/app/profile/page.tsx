"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { LogOut, Save, User } from "lucide-react";

const roleBadgeStyles: Record<string, string> = {
  ANALYST: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  MANAGER: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  ADMIN: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.handle?.[0]?.toUpperCase() ||
    "A";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.users.updateProfile({ displayName: displayName.trim() || undefined });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-7rem)] flex items-start justify-center pt-8 sm:pt-16">
        <div className="w-full max-w-md bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-atlas-surface border-2 border-glass-border flex items-center justify-center text-3xl font-semibold text-atlas-text shadow-sm">
              {user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName || user.handle} avatar`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>

            <h1 className="mt-4 text-2xl font-heading text-atlas-text">
              {user?.displayName || user?.handle || "Analyst"}
            </h1>
            <p className="text-sm text-atlas-text-secondary">@{user?.handle}</p>

            {user?.role && (
              <span
                className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                  roleBadgeStyles[user.role] ||
                  "bg-atlas-surface text-atlas-text-secondary border-glass-border"
                }`}
              >
                {user.role}
              </span>
            )}

            {user?.email && (
              <p className="mt-3 text-sm text-atlas-text-muted">{user.email}</p>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-medium text-atlas-text-secondary mb-1.5"
              >
                Display name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="flex-1 rounded-lg border border-glass-border bg-atlas-surface/50 px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:outline-none focus:ring-2 focus:ring-delphi-teal/40"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-delphi-teal/10 px-3 py-2 text-sm font-medium text-delphi-teal hover:bg-delphi-teal/20 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving" : saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-glass-border">
            <button
              type="button"
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-glass-border bg-atlas-surface/50 px-4 py-2.5 text-sm font-medium text-atlas-text-secondary hover:text-atlas-error hover:border-atlas-error/40 hover:bg-atlas-error/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
