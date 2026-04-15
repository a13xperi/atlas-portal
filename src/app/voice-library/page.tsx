"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import ShadowGate from "@/components/ui/ShadowGate";
import { api, type VoiceArchetype } from "@/lib/api";

interface ReferenceItem {
  handle: string;
  archetype?: VoiceArchetype;
  status: "ACTIVE" | "PENDING";
}

function VoiceLibraryPage() {
  const [archetype, setArchetype] = useState<VoiceArchetype | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const [{ archetype: archetypeData }, session] = await Promise.all([
          api.voiceTinder.getArchetype(),
          api.voiceTinder.getSession(),
        ]);

        if (!mounted) return;
        setArchetype(archetypeData);

        const refHandles = session.references ?? [];
        const refDetails = await Promise.all(
          refHandles.map(async (ref) => {
            try {
              const detail = await api.voiceTinder.getReference(ref.handle);
              return detail;
            } catch {
              return { handle: ref.handle, status: ref.status } as ReferenceItem;
            }
          })
        );

        if (!mounted) return;
        setReferences(refDetails);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load voice library");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <ShadowGate sectionKey="voice-library-v2">
        <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text md:text-3xl">
              Voice Library
            </h1>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              Your calibrated voice and reference inspirations.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-2xl bg-atlas-surface" />
              <div className="h-32 animate-pulse rounded-2xl bg-atlas-surface" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* My Voice */}
              <section className="rounded-2xl border border-glass-border bg-atlas-surface p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-atlas-teal">
                      My Voice
                    </p>
                    <h2 className="mt-2 font-heading text-xl font-semibold text-atlas-text">
                      {archetype?.label ?? "Personal Voice"}
                    </h2>
                    <p className="mt-1 text-sm text-atlas-text-secondary">
                      {archetype?.oneLiner ?? archetype?.description ?? "Your unique writing fingerprint."}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-atlas-teal/15">
                    <Sparkles className="h-6 w-6 text-atlas-teal" />
                  </div>
                </div>

                {archetype?.description && (
                  <p className="mt-4 text-sm leading-relaxed text-atlas-text-secondary">
                    {archetype.description}
                  </p>
                )}

                {archetype && archetype.themes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-muted">
                      Key Traits
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {archetype.themes.map((theme) => (
                        <span
                          key={theme}
                          className="rounded-full bg-atlas-nav px-3 py-1 text-xs text-atlas-text"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <Link
                    href="/voice-tinder"
                    className="inline-flex items-center gap-2 rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-nav transition hover:bg-atlas-teal/90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Recalibrate
                  </Link>
                </div>
              </section>

              {/* Reference Voices */}
              <section>
                <h3 className="font-heading text-lg font-semibold text-atlas-text">
                  Reference Voices
                </h3>
                <p className="mt-1 text-sm text-atlas-text-secondary">
                  Writers you admire and blend with.
                </p>

                {references.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 p-8 text-center">
                    <p className="text-sm text-atlas-text-secondary">
                      No reference voices yet. Add inspirations in Voice Tinder to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {references.map((ref) => (
                      <div
                        key={ref.handle}
                        className="rounded-2xl border border-glass-border bg-atlas-surface p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-atlas-text">@{ref.handle}</p>
                            {ref.archetype?.label && (
                              <p className="mt-0.5 text-xs text-atlas-teal">
                                {ref.archetype.label}
                              </p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                              ref.status === "ACTIVE"
                                ? "bg-atlas-teal/15 text-atlas-teal"
                                : "bg-atlas-text-muted/15 text-atlas-text-muted"
                            }`}
                          >
                            {ref.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </ShadowGate>
    </AppShell>
  );
}

export default function VoiceLibraryPageGated() {
  return (
    <FeatureGate flagKey="library">
      <VoiceLibraryPage />
    </FeatureGate>
  );
}
