"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Atlas Error]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-atlas-bg px-4">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-atlas-error/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-atlas-error" />
          </div>
        </div>

        <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text mb-2">
          Something went wrong
        </h2>

        <p className="text-atlas-text-secondary text-sm mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-atlas-teal to-atlas-steel text-white text-sm font-medium rounded-lg hover:scale-105 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-atlas-text-secondary text-sm hover:text-atlas-teal transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
