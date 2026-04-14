import { Bug } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { listBugReports, type BugReport, type BugSeverity, type BugStatus } from "@/lib/bugs";

export const dynamic = "force-dynamic";

const severityTone: Record<BugSeverity, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  low: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

const statusTone: Record<BugStatus, string> = {
  open: "border-red-500/30 bg-red-500/10 text-red-300",
  "in-progress": "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  fixed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function formatReportedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({
  value,
  toneMap,
}: {
  value: BugSeverity | BugStatus;
  toneMap: Record<string, string>;
}) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${toneMap[value]}`}>
      {value}
    </span>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-4 backdrop-blur-xl">
      <div className="text-2xl font-semibold text-atlas-text">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-atlas-text-muted">{label}</div>
    </div>
  );
}

function BugsTable({ bugs }: { bugs: BugReport[] }) {
  if (bugs.length === 0) {
    return (
      <div className="rounded-2xl border border-glass-border bg-glass px-6 py-10 text-center text-sm text-atlas-text-secondary backdrop-blur-xl">
        No bug reports yet. Send a `POST` request to `/api/bugs` to create one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-glass-border">
      <div className="border-b border-glass-border bg-atlas-surface px-5 py-4">
        <p className="text-sm text-atlas-text-secondary">
          Reports are served from the internal bug route. New submissions default to `open` if status is omitted.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-atlas-surface text-xs uppercase tracking-wider text-atlas-text-muted">
              <th className="px-5 py-3">Bug</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Reported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-glass backdrop-blur-xl">
            {bugs.map((bug) => (
              <tr key={bug.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-5 py-4 align-top">
                  <div className="font-medium text-atlas-text">{bug.title}</div>
                  <div className="mt-1 max-w-xl text-xs leading-5 text-atlas-text-secondary">{bug.description}</div>
                </td>
                <td className="px-5 py-4 align-top text-xs text-atlas-text-secondary">
                  {bug.route ?? "Unspecified"}
                </td>
                <td className="px-5 py-4 align-top">
                  <StatusBadge value={bug.severity} toneMap={severityTone} />
                </td>
                <td className="px-5 py-4 align-top">
                  <StatusBadge value={bug.status} toneMap={statusTone} />
                </td>
                <td className="px-5 py-4 align-top text-xs text-atlas-text-secondary">
                  {formatReportedAt(bug.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminBugsPage() {
  const bugs = listBugReports();
  const openCount = bugs.filter((bug) => bug.status === "open").length;
  const fixedCount = bugs.filter((bug) => bug.status === "fixed").length;
  const criticalCount = bugs.filter((bug) => bug.severity === "critical" && bug.status !== "fixed").length;

  return (
    <FeatureGate flagKey="super_admin">
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-atlas-text-muted">Admin</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-glass-border bg-atlas-surface text-atlas-teal">
                    <Bug className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-heading text-3xl font-bold text-atlas-text">Bug Tracker</h1>
                    <p className="mt-1 text-sm text-atlas-text-secondary">
                      Minimal internal list for reported issues. Create new reports through `POST /api/bugs`.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-glass-border bg-atlas-surface px-4 py-3 text-xs text-atlas-text-secondary">
                Accepts `title`, optional `description`, `route`, `severity`, `status`, and `reporter`.
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatsCard label="Total Reports" value={bugs.length} />
            <StatsCard label="Open" value={openCount} />
            <StatsCard label="Critical Outstanding" value={criticalCount} />
          </section>

          <BugsTable bugs={bugs} />

          <section className="rounded-2xl border border-glass-border bg-glass p-5 text-sm text-atlas-text-secondary backdrop-blur-xl">
            Fixed reports currently listed: <span className="font-medium text-atlas-text">{fixedCount}</span>
          </section>
        </div>
      </AppShell>
    </FeatureGate>
  );
}
