"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function XCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Linking your X account...");
  const [redirectTarget, setRedirectTarget] = useState<"onboarding" | "crafting" | "voice-lab">("crafting");
  const [connectedIdentity, setConnectedIdentity] = useState<{
    avatarUrl?: string | null;
    bio?: string;
    displayName?: string;
    handle?: string;
  } | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("Authorization was denied or cancelled.");
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorization code. Please try again.");
      return;
    }

    if (!user) return; // Wait for auth to load

    api.auth.x.callback(code, state)
      .then(async (res) => {
        const source = localStorage.getItem("x_oauth_source");
        const nextRedirectTarget =
          source === "onboarding"
            ? "onboarding"
            : source === "voice-lab"
              ? "voice-lab"
              : "crafting";
        const profileResponse = await api.users.profile().catch(() => null);
        const connectedUser = profileResponse?.user;
        const connectedHandle = connectedUser?.handle || res.xHandle || "";
        const connectedName = connectedUser?.displayName?.trim();

        setStatus("success");
        setConnectedIdentity(
          connectedUser
            ? {
                avatarUrl: connectedUser.avatarUrl,
                bio: connectedUser.bio,
                displayName: connectedUser.displayName,
                handle: connectedUser.handle,
              }
            : null
        );
        setMessage(
          connectedName && connectedHandle
            ? `Connected as ${connectedName} (@${connectedHandle})`
            : connectedHandle
              ? `Connected as @${connectedHandle}!`
              : "X account linked!"
        );
        localStorage.removeItem("x_oauth_source");
        setRedirectTarget(nextRedirectTarget);
        const redirectTo =
          nextRedirectTarget === "onboarding"
            ? `/onboarding?x_connected=true&handle=${encodeURIComponent(connectedHandle)}`
            : nextRedirectTarget === "voice-lab"
              ? `/voice-profiles?x_connected=true&handle=${encodeURIComponent(connectedHandle)}`
              : "/crafting";
        setTimeout(() => window.location.assign(redirectTo), 1200);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to link X account.");
      });
  }, [searchParams, user, router]);

  return (
    <div className="min-h-screen bg-atlas-bg flex items-center justify-center p-4 font-body">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-12 text-center max-w-md w-full">
        {status === "processing" && (
          <div className="animate-spin w-8 h-8 border-2 border-atlas-teal border-t-transparent rounded-full mx-auto mb-6" />
        )}
        {status === "success" && (
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-green-500/20">
              {connectedIdentity?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={connectedIdentity.avatarUrl}
                  alt={`${connectedIdentity.displayName || connectedIdentity.handle || "Connected"} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-green-400 text-2xl">✓</span>
              )}
            </div>
            {connectedIdentity?.handle ? (
              <div className="space-y-1">
                <p className="text-atlas-text text-base font-medium">
                  {connectedIdentity.displayName || `@${connectedIdentity.handle}`}
                </p>
                <p className="text-sm text-atlas-text-secondary">
                  @{connectedIdentity.handle}
                </p>
              </div>
            ) : null}
          </div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-2xl">✗</span>
          </div>
        )}
        <p className="text-atlas-text text-lg">{message}</p>
        {status === "success" && (
          <p className="text-atlas-text-secondary text-sm mt-2">
            {redirectTarget === "onboarding"
              ? "Redirecting to onboarding..."
              : redirectTarget === "voice-lab"
                ? "Redirecting to Voice Lab..."
                : "Redirecting to Crafting Station..."}
          </p>
        )}
        {status === "error" && (
          <button
            onClick={() =>
              router.push(
                redirectTarget === "onboarding"
                  ? "/onboarding"
                  : redirectTarget === "voice-lab"
                    ? "/voice-profiles"
                    : "/crafting"
              )
            }
            className="mt-6 px-6 py-2 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text hover:border-atlas-teal transition-colors"
          >
            {redirectTarget === "onboarding"
              ? "Back to Onboarding"
              : redirectTarget === "voice-lab"
                ? "Back to Voice Lab"
                : "Back to Crafting"}
          </button>
        )}
      </div>
    </div>
  );
}
