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
      .then((res) => {
        setStatus("success");
        setMessage(res.xHandle ? `Connected as @${res.xHandle}!` : "X account linked!");
        // If opened as a popup (e.g. from onboarding), close the window
        if (window.opener) {
          setTimeout(() => window.close(), 1500);
        } else {
          setTimeout(() => router.push("/crafting"), 2000);
        }
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
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-2xl">✗</span>
          </div>
        )}
        <p className="text-atlas-text text-lg">{message}</p>
        {status === "success" && (
          <p className="text-atlas-text-secondary text-sm mt-2">Redirecting to Crafting Station...</p>
        )}
        {status === "error" && (
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                router.push("/crafting");
              }
            }}
            className="mt-6 px-6 py-2 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text hover:border-atlas-teal transition-colors"
          >
            {typeof window !== "undefined" && window.opener ? "Close" : "Back to Crafting"}
          </button>
        )}
      </div>
    </div>
  );
}
