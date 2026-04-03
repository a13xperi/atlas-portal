"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, User } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { user } = await api.users.profile();
      setProfile(user);
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { user } = await api.users.updateProfile({
        displayName: displayName || undefined,
        email: email || undefined,
      });
      setProfile(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const currentUser = profile || authUser;
  const initial = currentUser?.displayName?.[0] || currentUser?.handle?.[0] || "A";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto py-8">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-atlas-surface border border-glass-border flex items-center justify-center text-2xl text-atlas-text-secondary mb-4">
            {initial.toUpperCase()}
          </div>
          <h1 className="font-heading text-2xl text-atlas-text">
            {currentUser?.displayName || currentUser?.handle || "Analyst Profile"}
          </h1>
          {currentUser?.handle && (
            <p className="text-atlas-text-secondary text-sm mt-1">@{currentUser.handle}</p>
          )}
          {currentUser?.role && (
            <span className="mt-2 text-xs bg-atlas-teal/20 text-atlas-teal px-3 py-1 rounded-full">
              {currentUser.role}
            </span>
          )}
        </div>

        {/* Edit Form */}
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={currentUser?.displayName || currentUser?.handle || "Your display name"}
              className="w-full mt-1 bg-atlas-nav border border-glass-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-muted focus:outline-none focus:border-atlas-teal"
            />
          </div>
          <div>
            <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@delphi.digital"
              className="w-full mt-1 bg-atlas-nav border border-glass-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <GradientButton onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Saving…</> : "Save Changes"}
            </GradientButton>
            {saved && <span className="text-atlas-success text-sm">Saved!</span>}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <GradientButton variant="outline-teal" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </GradientButton>
        </div>

        {/* Logout */}
        {authUser && (
          <button
            type="button"
            onClick={() => { logout(); router.push("/"); }}
            className="mt-6 w-full text-center text-sm text-atlas-error hover:underline"
          >
            Sign out
          </button>
        )}
      </div>
    </AppShell>
  );
}
