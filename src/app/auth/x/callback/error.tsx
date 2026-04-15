"use client";

export default function XCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-atlas-bg flex items-center justify-center p-4 font-body">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-12 text-center max-w-md w-full">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-2xl">&#10007;</span>
        </div>
        <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text mb-2">
          X account linking failed
        </h2>
        <p className="text-sm text-atlas-text-secondary mb-6">
          {error.message || "Something went wrong while connecting your X account. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 text-sm font-bold text-atlas-bg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 rounded-lg hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/crafting"
            className="px-6 py-2 text-sm font-bold text-atlas-text-secondary border border-glass-border rounded-lg hover:bg-glass transition-colors"
          >
            Back to Crafting
          </a>
        </div>
      </div>
    </div>
  );
}
