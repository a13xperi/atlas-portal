"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { generateMockBlendPreview } from "@/lib/mock-blend-preview";
import type {
  BlendPreviewRequest,
  BlendPreviewResult,
} from "@/types/voice-profile-preview";

const PROMPTS = [
  "ETH rally to 4k",
  "Rollup TPS comparison",
  "Why L2s matter for adoption",
];

const previewBlendApi = (
  api.voice as typeof api.voice & {
    previewBlend?: (request: BlendPreviewRequest) => Promise<BlendPreviewResult>;
  }
).previewBlend;

interface BlendPreviewPanelProps {
  blend: BlendPreviewRequest["blend"];
  onRegenerate?: () => void;
}

export default function BlendPreviewPanel({
  blend,
  onRegenerate,
}: BlendPreviewPanelProps) {
  const [result, setResult] = useState<BlendPreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestKey = JSON.stringify(blend);
  const composition = blend.voices
    .map((voice) => `${voice.percentage}% @${voice.handle.replace(/^@/, "")}`)
    .join(" + ");

  useEffect(() => {
    let cancelled = false;
    const request: BlendPreviewRequest = {
      blend: JSON.parse(requestKey) as BlendPreviewRequest["blend"],
      prompts: PROMPTS,
    };

    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = previewBlendApi
          ? await previewBlendApi(request)
          : generateMockBlendPreview(request.blend, request.prompts);
        if (!cancelled) {
          setResult(
            previewBlendApi ? { ...response, mode: response.mode ?? "live" } : response
          );
        }
      } catch {
        if (!cancelled) {
          setResult(generateMockBlendPreview(request.blend, request.prompts));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [refreshToken, requestKey]);

  return (
    <aside className="rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
            Preview this blend
          </p>
          <h3 className="mt-2 font-heading text-xl font-semibold text-atlas-text">
            Cross-check tone before you save
          </h3>
          <p className="mt-2 text-xs leading-5 text-atlas-text-secondary">{composition}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onRegenerate?.();
            setRefreshToken((value) => value + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Regenerate
        </button>
      </div>

      {result?.mode === "mock" && (
        <span className="mt-4 inline-flex rounded-full border border-atlas-teal/25 bg-atlas-teal/10 px-2.5 py-1 text-[11px] font-semibold text-atlas-teal">
          Preview Mode
        </span>
      )}

      <div className="mt-4 space-y-3">
        {loading
          ? PROMPTS.map((prompt) => (
              <div key={prompt} className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface/40 p-4">
                <div className="h-3 w-32 rounded bg-atlas-surface" />
                <div className="mt-3 h-3 rounded bg-atlas-surface" />
                <div className="mt-2 h-3 w-11/12 rounded bg-atlas-surface" />
              </div>
            ))
          : result?.tweets.map((tweet) => (
              <article key={tweet.prompt} className="rounded-2xl border border-glass-border bg-atlas-surface/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
                  {tweet.prompt}
                </p>
                <p className="mt-3 text-sm leading-6 text-atlas-text">{tweet.text}</p>
              </article>
            ))}
        {!loading && !result && (
          <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-atlas-surface/40 p-4 text-sm text-atlas-text-secondary">
            <Loader2 className="h-4 w-4 text-atlas-teal" />
            Preview unavailable right now.
          </div>
        )}
      </div>
    </aside>
  );
}
