"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (mode === "register" && !handle.trim()) {
      setError("Handle is required");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
        router.push("/dashboard");
      } else {
        await register(handle.trim(), email.trim(), password);
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <h1 className="font-heading tracking-tight text-[56px] font-bold tracking-[-1.5px] bg-gradient-to-r from-atlas-text via-atlas-teal to-atlas-text bg-clip-text text-transparent">
          ATLAS
        </h1>
        <p className="font-heading font-medium text-lg italic text-[#bcc9c7] mt-2">
          If you are here, you&apos;re already in the right place
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-atlas-teal/50 to-transparent" />

        <div className="h-8" />

        {mode === "register" && (
          <>
            <div className="text-left">
              <label
                htmlFor="login-handle"
                className="text-xs text-atlas-text-secondary uppercase tracking-wide"
              >
                Your handle
              </label>
              <input
                id="login-handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal focus:shadow-[0_0_0_2px_rgba(78,205,196,0.15)]"
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="h-4" />
          </>
        )}

        <div className="text-left">
          <label
            htmlFor="login-email"
            className="text-xs text-atlas-text-secondary uppercase tracking-wide"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal focus:shadow-[0_0_0_2px_rgba(78,205,196,0.15)]"
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="h-4" />

        <div className="text-left">
          <label
            htmlFor="login-password"
            className="text-xs text-atlas-text-secondary uppercase tracking-wide"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 pr-12 border border-glass-border focus:outline-none focus:border-atlas-teal focus:shadow-[0_0_0_2px_rgba(78,205,196,0.15)]"
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-atlas-text-secondary hover:text-atlas-text transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-atlas-error text-sm mt-3 text-left">
            {error}
          </p>
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

        <p className="text-atlas-text-muted text-xs tracking-wider uppercase">Powered by Delphi Digital</p>
      </div>
    </OnboardingShell>
  );
}
