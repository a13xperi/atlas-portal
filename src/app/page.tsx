"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, login, register } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        router.push("/dashboard");
      } else {
        if (!handle.trim()) {
          setError("Handle is required");
          setSubmitting(false);
          return;
        }
        await register(handle.trim(), email.trim(), password, "A");
        router.push("/onboarding/track-a");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (authLoading) return null;

  return (
    <OnboardingShell maxWidth="480px">
      <div className="text-center">
        <h1 className="font-heading text-[48px] font-bold tracking-[-1.2px] text-atlas-text">
          ATLAS
        </h1>
        <p className="font-heading text-lg italic text-[#bcc9c7] mt-2">
          If you are here, you&apos;re already in the right place
        </p>

        <div className="h-8" />

        {mode === "register" && (
          <>
            <div className="text-left">
              <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Your handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal"
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="h-3" />
          </>
        )}

        <div className="text-left">
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal"
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="h-3" />

        <div className="text-left">
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal"
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && (
          <p className="text-atlas-error text-sm mt-3 text-left">{error}</p>
        )}

        <div className="h-4" />

        <GradientButton fullWidth onClick={handleSubmit} size="lg">
          {submitting ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
        </GradientButton>

        <div className="h-3" />

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          className="text-atlas-teal text-sm hover:underline"
        >
          {mode === "login"
            ? "Don\u0027t have an account? Sign up \u2192"
            : "Already have an account? Sign in \u2192"}
        </button>

        <div className="h-6" />

        <p className="text-atlas-text-muted text-xs">Powered by Delphi</p>
      </div>
    </OnboardingShell>
  );
}
