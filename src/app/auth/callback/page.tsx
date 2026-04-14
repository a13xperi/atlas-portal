"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { hasCalibratedVoiceDimensions } from "@/lib/voice-profile-dimensions";

/**
 * /auth/callback — handles server-side OAuth redirects.
 *
 * Security (C-5): Backend sets an HttpOnly `atlas_session` cookie via
 * setAuthCookies() BEFORE redirecting the browser here. The portal no longer
 * reads a JWT from the query string — doing so would expose the token in
 * URL history, referer headers, and server/CDN logs.
 *
 * Backend now redirects to `/auth/callback?provider=twitter` (no ?token=).
 * We validate the session by calling /me (which sends the HttpOnly cookie
 * automatically via `credentials: "include"`) and route to dashboard or
 * onboarding based on the user's state.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(
        error === "access_denied"
          ? "Authorization was denied. Please try again."
          : error === "session_expired"
            ? "Session expired. Please try again."
            : `Login failed: ${error}`
      );
      return;
    }

    // Mirror the HttpOnly atlas_session cookie set by the backend with a
    // client-readable flag so the Next.js middleware can gate protected
    // routes on the frontend origin. The HttpOnly cookie (set by the
    // backend domain) carries the real credential; this is a hint only.
    document.cookie = "atlas_session=1; path=/; max-age=604800; SameSite=Lax";

    // Validate session by calling /me — this sends the HttpOnly cookie
    // via `credentials: "include"` in the api client.
    api.auth.me()
      .then((res) => {
        setStatus("success");
        const handle = res.user?.handle;
        const isNewUser = !hasCalibratedVoiceDimensions(res.user?.voiceProfile);
        const destination = isNewUser ? "/onboarding" : "/dashboard";
        setMessage(
          handle
            ? isNewUser
              ? `Welcome, @${handle}! Setting up your account...`
              : `Welcome back, @${handle}!`
            : "You're in!"
        );
        setTimeout(() => router.replace(destination), 1500);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Session validation failed. Please try again.");
        document.cookie = "atlas_session=; path=/; max-age=0";
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-atlas-bg flex items-center justify-center p-4 font-body">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-12 text-center max-w-md w-full">
        {status === "processing" && (
          <div className="animate-spin w-8 h-8 border-2 border-atlas-teal border-t-transparent rounded-full mx-auto mb-6" />
        )}
        {status === "success" && (
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-green-400 text-2xl">&#10003;</span>
          </div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-2xl">&#10007;</span>
          </div>
        )}
        <p className="text-atlas-text text-lg">{message}</p>
        {status === "success" && (
          <p className="text-atlas-text-secondary text-sm mt-2">Redirecting...</p>
        )}
        {status === "error" && (
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text hover:border-atlas-teal transition-colors"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
