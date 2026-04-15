"use client";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-atlas-bg p-8">
      <div className="bg-atlas-surface border border-glass-border rounded-2xl p-8 max-w-md text-center">
        <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-atlas-text-secondary mb-6">{error.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-bold text-atlas-bg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 rounded-xl hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 text-sm font-bold text-atlas-text-secondary border border-glass-border rounded-xl hover:bg-glass transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
