"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, TeamMember, TeamAnalyst } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { useActionFeedback } from "@/hooks/useActionFeedback";

function ManagementPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isLoading, runAction } = useActionFeedback();

  const showBanner = useCallback((message: string, type: "success" | "error") => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setActionBanner({ message, type });
    bannerTimerRef.current = setTimeout(() => setActionBanner(null), 5000);
  }, []);

  const managementActionLoading =
    isLoading("push-top-profiles") ||
    isLoading("send-nudge") ||
    isLoading("push-style");

  useEffect(() => {
    if (!user) return;

    setLoadError(null);
    setLoading(true);
    Promise.all([api.users.team(), api.analytics.team()])
      .then(([teamRes, analyticsRes]) => {
        setTeam(teamRes.team);
        setAnalysts(analyticsRes.analysts);
      })
      .catch((err: any) => {
        if (err?.statusCode === 403) {
          setLoadError("You don't have Manager access. Contact your admin to upgrade your role.");
        } else {
          setLoadError(err.message || 'Failed to load team data. Please refresh.');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const getAnalystStats = (memberId: string) =>
    analysts.find((a) => a.id === memberId);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-atlas-text">
              Team Management
            </h1>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              Your team at a glance. {team.length} member{team.length !== 1 ? "s" : ""} and their voice profiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-busy={isLoading("push-top-profiles")}
              disabled={managementActionLoading}
              onClick={() =>
                void runAction("push-top-profiles", api.users.pushTopProfiles, {
                  successMessage: "Top profiles pushed to team",
                  errorMessage: "Failed to push top profiles",
                  onResult: showBanner,
                })
              }
              className="flex items-center gap-1.5 rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-4 py-2 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:opacity-50"
            >
              {isLoading("push-top-profiles") ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Processing...
                </>
              ) : (
                "Push Top Profiles"
              )}
            </button>
            <button
              type="button"
              aria-busy={isLoading("send-nudge")}
              disabled={managementActionLoading}
              onClick={() => void runAction("send-nudge", api.users.sendNudge, {
                successMessage: "Nudge sent to all analysts",
                errorMessage: "Failed to send nudge",
                onResult: showBanner,
              })}
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-4 py-2 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
            >
              {isLoading("send-nudge") ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Processing...
                </>
              ) : (
                "Send Nudge"
              )}
            </button>
            <button
              type="button"
              aria-busy={isLoading("push-style")}
              disabled={managementActionLoading}
              onClick={() =>
                void runAction("push-style", () => api.users.pushStyle(), {
                  successMessage: "Team style settings pushed",
                  errorMessage: "Failed to push style settings",
                  onResult: showBanner,
                })
              }
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-4 py-2 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
            >
              {isLoading("push-style") ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Processing...
                </>
              ) : (
                "Push Style"
              )}
            </button>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mt-4 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
            {loadError}
          </div>
        )}

        {actionBanner && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
              actionBanner.type === "success"
                ? "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal"
                : "border-atlas-error/30 bg-atlas-error/10 text-atlas-error"
            }`}
          >
            <span aria-hidden="true">{actionBanner.type === "success" ? "✓" : "✕"}</span>
            {actionBanner.message}
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center text-sm text-atlas-text-secondary">
            Loading team...
          </div>
        ) : team.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-glass-border bg-glass/50 p-8 text-center backdrop-blur-xl">
            <p className="text-atlas-text-secondary">
              No team members found. Invite analysts to get started.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => {
              const stats = getAnalystStats(member.id);
              const vp = member.voiceProfile || stats?.voiceProfile;
              const maturityLabel = vp?.maturity === "ADVANCED" ? "Advanced" : vp?.maturity === "INTERMEDIATE" ? "Intermediate" : "Beginner";
              const maturityColor = vp?.maturity === "ADVANCED" ? "text-emerald-400" : vp?.maturity === "INTERMEDIATE" ? "text-amber-400" : "text-atlas-text-muted";
              const totalActivity = (member._count.tweetDrafts || 0) + (member._count.sessions || 0) + (stats?._count.analyticsEvents || 0);
              const activityLevel = totalActivity > 50 ? "High" : totalActivity > 20 ? "Medium" : "Low";
              const activityDot = totalActivity > 50 ? "bg-emerald-400" : totalActivity > 20 ? "bg-amber-400" : "bg-red-400";

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-glass-border bg-atlas-surface p-5 transition-colors hover:border-atlas-teal/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-delphi-teal to-delphi-blue-500 text-sm font-bold text-atlas-bg">
                        {(member.displayName || member.handle)[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-sm font-semibold text-atlas-text">
                          {member.displayName || member.handle}
                        </p>
                        <p className="truncate text-xs text-atlas-text-muted">
                          @{member.handle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${activityDot}`} title={`${activityLevel} activity`} />
                      <span className="text-[10px] text-atlas-text-muted">{activityLevel}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        member.role === "ADMIN"
                          ? "bg-atlas-teal/15 text-atlas-teal"
                          : member.role === "MANAGER"
                          ? "bg-amber-400/15 text-amber-400"
                          : "bg-atlas-nav text-atlas-text-secondary"
                      }`}
                    >
                      {member.role}
                    </span>
                    {vp && (
                      <span className={`text-[10px] font-medium ${maturityColor}`}>
                        {maturityLabel}
                      </span>
                    )}
                  </div>

                  {vp && (
                    <div className="mt-3 space-y-1.5">
                      {[
                        { label: "Humor", value: vp.humor },
                        { label: "Formality", value: vp.formality },
                        { label: "Brevity", value: vp.brevity },
                        { label: "Contrarian", value: vp.contrarianTone },
                      ].map((dim) => (
                        <div key={dim.label} className="flex items-center gap-2">
                          <span className="w-16 text-[10px] text-atlas-text-muted">{dim.label}</span>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-atlas-nav">
                            <div
                              className="h-full rounded-full bg-atlas-teal/60"
                              style={{ width: `${dim.value}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-[10px] font-mono text-atlas-text-muted">{dim.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-glass-border/30 pt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Drafts</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-atlas-text">{member._count.tweetDrafts}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Sessions</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-atlas-text">{member._count.sessions}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">Events</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-atlas-text">{stats?._count.analyticsEvents ?? "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ManagementPageGated() {
  return (
    <FeatureGate flagKey="management">
      <ManagementPage />
    </FeatureGate>
  );
}
