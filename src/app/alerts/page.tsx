"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Settings } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import InlineDraftCard from "@/components/alerts/InlineDraftCard";
import MonitorBuilder from "@/components/alerts/MonitorBuilder";
import { Skeleton } from "@/components/ui/Skeleton";
import GradientButton from "@/components/ui/GradientButton";
import { Alert, AlertSubscription, api } from "@/lib/api";

function formatAlertType(type: string) {
  return type.replace(/_/g, " ");
}

function formatAlertTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researchingId, setResearchingId] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    setError(null);

    api.alerts
      .feed("SIGNAL")
      .then(({ alerts: nextAlerts }) => {
        if (!isActive) {
          return;
        }

        setAlerts(nextAlerts);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Failed to load alerts"
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    api.alerts
      .subscriptions()
      .then((response) => {
        if (isActive) {
          setSubscriptions(response.subscriptions ?? []);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" >
          <div>
            <p data-tour="signals-feed" className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
              Signals Feed
            </p>
            <h1 className="mt-2 font-heading font-bold tracking-tight text-2xl text-atlas-text">
              Draft responses without leaving the feed
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-atlas-text-secondary">
              Open any signal, generate a post inline, and tighten the copy before
              you ship it.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <button
              data-tour="signals-subscribe"
              onClick={() => setShowSubscriptions(!showSubscriptions)}
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:text-atlas-text"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              Monitors ({subscriptions.filter((sub) => sub.isActive).length})
            </button>
            {!loading && alerts.length > 0 && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-atlas-text-muted">
                {alerts.length} live signals
              </p>
            )}
          </div>
        </div>

        {showSubscriptions && (
          <MonitorBuilder
            subscriptions={subscriptions}
            onSubscriptionChange={() => {
              api.alerts
                .subscriptions()
                .then((res) => setSubscriptions(res.subscriptions ?? []))
                .catch(() => {});
            }}
          />
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
          >
            Failed to load alerts: {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-glass rounded-2xl border border-glass-border p-6 backdrop-blur-xl"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-4 h-8 w-3/4" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
                <div className="mt-6 flex justify-end">
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="mt-8 space-y-4">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                className="card-interactive rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
                      {formatAlertType(alert.type)}
                    </p>
                    <h2 className="mt-3 font-heading font-bold tracking-tight text-2xl text-atlas-text">
                      {alert.title}
                    </h2>
                  </div>
                  <span className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-1 text-xs text-atlas-text-secondary">
                    {formatAlertTimestamp(alert.createdAt)}
                  </span>
                </div>

                {alert.context && (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-atlas-text-secondary">
                    {alert.context}
                  </p>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      setResearchingId(alert.id);

                      try {
                        const res = await api.research.conduct(alert.title);
                        setResearchResult((prev) => ({
                          ...prev,
                          [alert.id]: res.result.summary,
                        }));
                      } catch {
                        setResearchResult((prev) => ({
                          ...prev,
                          [alert.id]: "Research failed. Try again.",
                        }));
                      }

                      setResearchingId(null);
                    }}
                    disabled={researchingId === alert.id}
                    className="flex items-center gap-1 text-xs text-atlas-text-secondary transition-colors hover:text-atlas-teal disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {researchingId === alert.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="h-3 w-3" aria-hidden="true" />
                    )}
                    Research
                  </button>
                </div>

                {researchResult[alert.id] && (
                  <div className="mt-2 rounded-lg bg-atlas-bg p-3 text-xs text-atlas-text-secondary">
                    <p className="mb-1 text-[10px] font-medium text-atlas-teal">
                      Research Summary
                    </p>
                    {researchResult[alert.id]}
                  </div>
                )}

                <InlineDraftCard alert={alert} />
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
            <section className="bg-glass w-full max-w-2xl rounded-2xl border border-glass-border p-10 text-center backdrop-blur-xl sm:p-12">
              <p data-tour="signals-feed" className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
                Signals
              </p>
              <h2 className="mt-4 font-heading font-bold tracking-tight text-2xl text-atlas-text">
                No signals yet
              </h2>
              <p className="mt-2 text-sm text-atlas-text-secondary">
                Set up your subscriptions and Atlas will surface signals worth
                drafting on.
              </p>
              <div className="mt-8 flex justify-center">
                <GradientButton onClick={() => router.push("/telegram")}>
                  Enable Subscriptions
                </GradientButton>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AlertsPageGated() {
  return (
    <FeatureGate flagKey="signals">
      <AlertsPage />
    </FeatureGate>
  );
}
