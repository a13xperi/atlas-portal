"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-atlas-bg text-atlas-text flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl">Something went wrong</h2>
          <p className="text-atlas-text-secondary text-sm">This error has been reported automatically.</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-atlas-teal/10 text-atlas-teal border border-atlas-teal/30 text-sm hover:bg-atlas-teal/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
