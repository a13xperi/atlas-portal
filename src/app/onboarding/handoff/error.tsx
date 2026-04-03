"use client";

import GradientButton from "@/components/ui/GradientButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 font-heading font-bold tracking-tight text-2xl text-atlas-text">Something went wrong</h2>
      <p className="mb-6 max-w-md text-sm text-atlas-text-secondary">{error.message}</p>
      <GradientButton onClick={reset}>Try again</GradientButton>
    </div>
  );
}
