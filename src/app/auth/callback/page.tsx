"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken, api } from "@/lib/api";

/**
 * /auth/callback — handles server-side OAuth redirects.
 * Backend redirects here with ?token=JWT&provider=twitter after successful OAuth.
 * Stores the token, validates the session, and redirects to dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
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

    if (!token) {
      setStatus("error");
      setMessage("Missing authentication token. Please try again.");
      return;
    }

    // Store the JWT
    setAccessToken(token);
    document.cookie = "atlas_access_token=1; path=/; max-age=86400; SameSite=Lax";
    document.cookie = "atlas_session=1; path=/; max-age=604800; SameSite=Lax";

    // Validate session by calling /me
    api.auth.me()
      .then((res) => {
        setStatus("success");
        const handle = res.user?.handle;
        setMessage(handle ? `Welcome, @${handle}!` : "You're in!");
        setTimeout(() => router.replace("/dashboard"), 1500);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Session validation failed. Please try again.");
        setAccessToken(null);
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
          <p className="text-atlas-text-secondary text-sm mt-2">Redirecting to dashboard...</p>
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
