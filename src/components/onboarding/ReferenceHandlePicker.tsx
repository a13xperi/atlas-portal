"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface ReferenceHandlePickerProps {
  handles: string[];
  onChange: (handles: string[]) => void;
}

type PreviewState =
  | { status: "idle"; tweetText: string; fallback: boolean }
  | { status: "loading"; tweetText: string; fallback: boolean }
  | { status: "ready"; tweetText: string; fallback: boolean }
  | { status: "error"; tweetText: string; fallback: boolean };

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function toInputState(handles: string[]) {
  return Array.from({ length: 3 }, (_, index) => handles[index] ?? "");
}

export default function ReferenceHandlePicker({
  handles,
  onChange,
}: ReferenceHandlePickerProps) {
  const [inputs, setInputs] = useState<string[]>(() => toInputState(handles));
  const [previews, setPreviews] = useState<Record<number, PreviewState>>({});

  const normalizedInputs = useMemo(
    () => inputs.map((value) => normalizeHandle(value)),
    [inputs]
  );

  useEffect(() => {
    const nextInputs = toInputState(handles);

    if (nextInputs.join("|") !== inputs.join("|")) {
      setInputs(nextInputs);
    }
  }, [handles, inputs]);

  useEffect(() => {
    let ignore = false;

    setPreviews((current) =>
      normalizedInputs.reduce<Record<number, PreviewState>>((accumulator, handle, index) => {
        if (!handle) {
          accumulator[index] = { status: "idle", tweetText: "", fallback: false };
          return accumulator;
        }

        accumulator[index] = {
          status: "loading",
          tweetText: current[index]?.tweetText ?? "",
          fallback: false,
        };
        return accumulator;
      }, {})
    );

    const timeout = setTimeout(async () => {
      const nextPreviews = await Promise.all(
        normalizedInputs.map(async (handle, index) => {
          if (!handle) {
            return {
              index,
              preview: {
                status: "idle" as const,
                tweetText: "",
                fallback: false,
              },
            };
          }

          try {
            const response = await api.twitter.topTweetsByHandle(handle, 4);
            return {
              index,
              preview: {
                status: "ready" as const,
                tweetText: response.tweets[0]?.text ?? "",
                fallback: response.fallback === "demo",
              },
            };
          } catch {
            return {
              index,
              preview: {
                status: "error" as const,
                tweetText: "",
                fallback: false,
              },
            };
          }
        })
      );

      if (ignore) {
        return;
      }

      setPreviews(
        nextPreviews.reduce<Record<number, PreviewState>>((accumulator, item) => {
          accumulator[item.index] = item.preview;
          return accumulator;
        }, {})
      );

      const nextHandles = Array.from(
        new Set(
          nextPreviews.flatMap((item) => {
            const handle = normalizedInputs[item.index];
            return item.preview.status === "ready" && handle ? [handle] : [];
          })
        )
      ).slice(0, 3);

      onChange(nextHandles);
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [normalizedInputs, onChange]);

  return (
    <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
        Reference handles
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
        Pick up to three accounts
      </h2>
      <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
        Add the handles that feel closest to the edge of your taste. I&apos;ll preview each one before you swipe.
      </p>

      <div className="mt-6 grid gap-4">
        {inputs.map((value, index) => {
          const preview = previews[index] ?? {
            status: "idle" as const,
            tweetText: "",
            fallback: false,
          };

          return (
            <div
              key={index}
              className="rounded-2xl border border-glass-border bg-atlas-surface/80 p-4"
            >
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-atlas-text-muted">
                Handle {index + 1}
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-atlas-text-muted">
                    @
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => {
                      const next = [...inputs];
                      next[index] = event.target.value;
                      setInputs(next);
                    }}
                    placeholder="Add an X handle"
                    className="w-full rounded-xl border border-glass-border bg-atlas-bg px-8 py-2.5 text-sm normal-case tracking-normal text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                  />
                </div>
              </label>

              <div className="mt-3 min-h-10 text-sm text-atlas-text-secondary">
                {preview.status === "loading" && (
                  <div className="flex items-center gap-2 text-atlas-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking top tweets...
                  </div>
                )}

                {preview.status === "ready" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-atlas-teal">
                      <CheckCircle className="h-4 w-4" />
                      Preview ready
                    </div>
                    {preview.fallback && (
                      <p className="text-xs text-atlas-text-muted">
                        Using demo tweets for preview.
                      </p>
                    )}
                    {preview.tweetText && (
                      <p className="line-clamp-2 text-sm leading-5 text-atlas-text-secondary">
                        “{preview.tweetText}”
                      </p>
                    )}
                  </div>
                )}

                {preview.status === "error" && (
                  <p className="text-atlas-error">
                    I couldn&apos;t preview this handle yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
