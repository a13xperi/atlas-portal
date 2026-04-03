"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-atlas-bg flex items-center justify-center p-4 font-body">
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-12 text-center max-w-lg w-full">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />

          <h1 className="font-heading text-2xl text-atlas-text">
            Something went wrong
          </h1>

          <code className="block text-xs text-atlas-text-secondary font-mono mt-2">
            {error.digest ?? "unknown-error"}
          </code>

          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex items-center justify-center bg-gradient-to-r from-atlas-teal to-atlas-steel text-white rounded-lg px-6 py-3"
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="mt-4 block text-atlas-text-secondary transition-colors hover:text-atlas-text"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
