"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { api, setAccessToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const RESET_CONFIRMATION_MESSAGE = "Reset your account to new-user state?";

function clearClientSessionCookie() {
  document.cookie = "atlas_session=; path=/; max-age=0; SameSite=Lax";
}

export default function ResetMeButton() {
  const router = useRouter();
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReset =
    user?.role === "ADMIN" || process.env.NODE_ENV === "development";

  if (!canReset) {
    return null;
  }

  async function handleReset() {
    if (isResetting || !window.confirm(RESET_CONFIRMATION_MESSAGE)) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      await api.admin.resetUser();
      clearClientSessionCookie();
      setAccessToken(null);
      router.replace("/onboarding/track-a");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset your account.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <GlassCard
      maxWidth="full"
      aria-label="Reset account"
      className="mt-8 space-y-4 border-red-500/20 px-6 py-6 sm:px-6 sm:py-6"
    >
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
          Danger Zone
        </p>
        <div className="space-y-1">
          <h2 className="font-heading text-xl text-atlas-text">
            Reset account state
          </h2>
          <p className="text-sm leading-6 text-atlas-text-secondary">
            Rewind this account to the new-user onboarding state for repeat QA
            passes.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-atlas-text-muted">
          This clears the local session hint and sends you back through Track A.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResetting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
          {isResetting ? "Resetting..." : "Reset Me"}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
    </GlassCard>
  );
}
