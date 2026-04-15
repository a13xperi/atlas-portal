"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VoiceTinderDeck from "@/components/voice-tinder/VoiceTinderDeck";
import ArchetypeReveal from "@/components/voice-tinder/ArchetypeReveal";
import {
  api,
  type VoiceArchetype,
  type TweetExemplarItem,
} from "@/lib/api";
import { type VoiceTweetData } from "@/components/voice-tinder";

type VoiceTinderSession = Awaited<ReturnType<typeof api.voiceTinder.getSession>> & {
  tweets?: TweetExemplarItem[];
};

export default function VoiceTinderPage() {
  const router = useRouter();
  const [session, setSession] = useState<VoiceTinderSession | null>(null);
  const [archetype, setArchetype] = useState<VoiceArchetype | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"deck" | "reveal">("deck");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const data = (await api.voiceTinder.getSession()) as VoiceTinderSession;
        if (!mounted) return;
        setSession(data);

        if (data.hasArchetype || (data.ownerDone && data.referenceDone)) {
          const cal = await api.voiceTinder.calibrate();
          if (!mounted) return;
          setArchetype(cal.archetype);
          setPhase("reveal");
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { archetype: calArchetype } = await api.voiceTinder.calibrate();
      setArchetype(calArchetype);
      setPhase("reveal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calibration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push("/crafting");
  };

  if (loading && !session) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-atlas-teal" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-6 py-4 text-center text-sm text-atlas-error">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  const pendingTweets: VoiceTweetData[] =
    session?.tweets
      ?.filter((t) => t.decision === "PENDING")
      .map((t) => ({
        id: t.id,
        tweetId: t.tweetId,
        text: t.text,
        authorHandle: t.authorHandle,
        source: t.source,
        referenceHandle: t.referenceHandle,
        metrics: t.metrics,
        postedAt: t.postedAt,
      })) ?? [];

  return (
    <AppShell>
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold text-atlas-text md:text-3xl">
            Calibrate Your Voice
          </h1>
          <p className="mt-2 text-sm text-atlas-text-secondary">
            Swipe right on tweets that sound like you. Swipe left to skip.
          </p>
        </div>

        {phase === "deck" ? (
          pendingTweets.length > 0 ? (
            <VoiceTinderDeck tweets={pendingTweets} onComplete={handleComplete} />
          ) : (
            <div className="rounded-2xl border border-glass-border bg-atlas-surface p-8 text-center">
              <p className="text-atlas-text-secondary">No pending tweets to review.</p>
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-atlas-teal px-5 py-2.5 text-sm font-semibold text-atlas-nav transition hover:bg-atlas-teal/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Finish Calibration
              </button>
            </div>
          )
        ) : archetype ? (
          <ArchetypeReveal archetype={archetype} onContinue={handleContinue} />
        ) : null}
      </main>
    </AppShell>
  );
}
