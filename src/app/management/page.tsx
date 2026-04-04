"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, TeamMember, TeamAnalyst } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";

export default function ManagementPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    Promise.all([api.users.team(), api.analytics.team()])
      .then(([teamRes, analyticsRes]) => {
        setTeam(teamRes.team);
        setAnalysts(analyticsRes.analysts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const runAction = async (
    action: () => Promise<{ message: string; affected: number }>,
    label: string
  ) => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await action();
      setActionMessage(`${label}: ${res.message} (${res.affected} affected)`);
    } catch {
      setActionMessage(`${label} failed. Try again.`);
    } finally {
      setActionLoading(false);
    }
  };

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
            <p className="mt-1 text-sm text-atlas-text-secondary">
              {team.length} team member{team.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAction(api.users.pushTopProfiles, "Push top profiles")
              }
              className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-4 py-2 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:opacity-50"
            >
              Push Top Profiles
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void runAction(api.users.sendNudge, "Send nudge")}
              className="rounded-lg border border-glass-border px-4 py-2 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
            >
              Send Nudge
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAction(() => api.users.pushStyle(), "Push style")
              }
              className="rounded-lg border border-glass-border px-4 py-2 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
            >
              Push Style
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 rounded-xl border border-glass-border bg-glass/50 px-4 py-3 text-sm text-atlas-text-secondary">
            {actionMessage}
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

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-glass-border bg-glass/50 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-atlas-teal to-atlas-steel text-sm font-bold text-white">
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

                  <div className="mt-4 flex items-center gap-1.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        member.role === "ADMIN"
                          ? "bg-atlas-teal/15 text-atlas-teal"
                          : "bg-glass text-atlas-text-secondary"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-glass-border/50 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">
                        Drafts
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-atlas-text">
                        {member._count.tweetDrafts}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">
                        Sessions
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-atlas-text">
                        {member._count.sessions}
                      </p>
                    </div>
                    {stats && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted">
                          Events
                        </p>
                        <p className="mt-0.5 font-mono text-sm text-atlas-text">
                          {stats._count.analyticsEvents}
                        </p>
                      </div>
                    )}
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
