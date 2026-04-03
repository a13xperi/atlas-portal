"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import InlineDraftCard from "@/components/alerts/InlineDraftCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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

function isManagerNudge(alert: Alert) {
  const type = alert.type.toUpperCase();
  const copy = `${alert.title} ${alert.context ?? ""}`.toUpperCase();

  return (
    type.includes("NUDGE") ||
    type.includes("TOP_PROFILE") ||
    type.includes("PROFILE_PUSH") ||
    copy.includes("NUDGE") ||
    copy.includes("TOP PROFILE") ||
    copy.includes("TOP PROFILES") ||
    copy.includes("INACTIVE")
  );
}

function renderAlertCard(alert: Alert) {
  return (
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

      {alert.context ? (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-atlas-text-secondary">
          {alert.context}
        </p>
      ) : null}

      <InlineDraftCard alert={alert} />
    </article>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
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

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  const nudges = alerts.filter(isManagerNudge);
  const analystAlerts = alerts.filter((alert) => !isManagerNudge(alert));
  const visibleAlerts = isManager ? alerts : analystAlerts;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
              Alerts Feed
            </p>
            <h1 className="mt-3 font-heading text-3xl text-atlas-text sm:text-4xl">
              Stay on top of the signals that matter
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-atlas-text-secondary sm:text-base">
              When trending topics or market movements line up with your interests,
              they will show up here with a draft workflow attached.
            </p>
          </div>
          {!loading && visibleAlerts.length > 0 ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-atlas-text-muted">
              {visibleAlerts.length} live signals
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
          >
            Failed to load alerts: {error}
          </div>
        ) : null}

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
        ) : visibleAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-4 h-12 w-12 text-atlas-text-muted" />
            <h3 className="font-heading text-xl text-atlas-text">No alerts yet</h3>
            <p className="mt-2 max-w-md text-sm text-atlas-text-secondary">
              When trending topics or market movements match your interests, alerts
              will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {analystAlerts.length > 0 ? (
              <div className="space-y-4">{analystAlerts.map(renderAlertCard)}</div>
            ) : null}

            {isManager && nudges.length > 0 ? (
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-medium text-atlas-text-secondary">
                  Team Nudges
                </h3>
                <div className="space-y-4">{nudges.map(renderAlertCard)}</div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
