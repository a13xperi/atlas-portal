"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import InlineDraftCard from "@/components/alerts/InlineDraftCard";
import { Skeleton } from "@/components/ui/Skeleton";
import GradientButton from "@/components/ui/GradientButton";
import { Alert, api } from "@/lib/api";

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

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    setError(null);

    api.alerts
      .feed()
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

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
              Alerts Feed
            </p>
            <h1 className="mt-3 font-heading text-3xl text-atlas-text sm:text-4xl">
              Draft responses without leaving the feed
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-atlas-text-secondary sm:text-base">
              Open any signal, generate a post inline, and tighten the copy before
              you ship it.
            </p>
          </div>
          {!loading && alerts.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-atlas-text-muted">
              {alerts.length} live signals
            </p>
          )}
        </div>

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
                className="bg-glass rounded-2xl border border-glass-border p-6 backdrop-blur-xl transition-all duration-300 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
                      {formatAlertType(alert.type)}
                    </p>
                    <h2 className="mt-3 font-heading text-2xl text-atlas-text">
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

                <InlineDraftCard alert={alert} />
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
            <section className="bg-glass w-full max-w-2xl rounded-2xl border border-glass-border p-10 text-center backdrop-blur-xl sm:p-12">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
                Alerts
              </p>
              <h2 className="mt-4 font-heading text-3xl text-atlas-text sm:text-4xl">
                No alerts yet
              </h2>
              <p className="mt-4 text-sm text-atlas-text-secondary sm:text-base">
                No alerts yet &mdash; configure your subscriptions to start receiving
                signals.
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
