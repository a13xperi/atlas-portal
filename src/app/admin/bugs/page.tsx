"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import {
  Bug,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Supabase config (anon / public — safe for client)
// ---------------------------------------------------------------------------

const SUPA_URL = "https://zoirudjyqfqvpxsrxepr.supabase.co";
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const headers = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
};

async function supaFetch<T>(table: string, query = ""): Promise<T[]> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BugRow {
  id: string;
  bug_number: number;
  title: string;
  description: string;
  page_route: string | null;
  severity: string;
  status: string;
  source: string | null;
  project: string | null;
  found_by: string | null;
  fixed_by: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface TestCaseRow {
  id: string;
  test_number: number;
  title: string;
  description: string | null;
  page_route: string | null;
  category: string;
  unit_status: string;
  unit_details: string | null;
  unit_run_at: string | null;
  e2e_status: string;
  e2e_details: string | null;
  e2e_run_at: string | null;
  user_status: string;
  user_tester: string | null;
  user_details: string | null;
  user_run_at: string | null;
  priority: string;
  created_at: string;
}

type StatusFilter = "all" | "open" | "fixed" | "in-progress";
type SeverityFilter = "all" | "critical" | "high" | "medium" | "low" | "cosmetic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityColor(sev: string) {
  switch (sev) {
    case "critical":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "cosmetic":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default:
      return "bg-white/5 text-atlas-text-muted border-glass-border";
  }
}

function statusColor(st: string) {
  switch (st) {
    case "open":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "fixed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "in-progress":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-white/5 text-atlas-text-muted border-glass-border";
  }
}

function testStatusIcon(st: string) {
  switch (st) {
    case "pass":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "fail":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "skip":
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    default:
      return <Clock className="h-4 w-4 text-atlas-text-muted" />;
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AdminBugsContent() {
  const [bugs, setBugs] = useState<BugRow[]>([]);
  const [tests, setTests] = useState<TestCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort
  const [sortField, setSortField] = useState<"bug_number" | "severity" | "status" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Collapsible sections
  const [showTestMatrix, setShowTestMatrix] = useState(true);

  // ---- Fetch data ----
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bugData, testData] = await Promise.all([
        supaFetch<BugRow>("bugs", "select=*&order=created_at.desc"),
        supaFetch<TestCaseRow>("test_cases", "select=*&order=test_number.asc"),
      ]);
      setBugs(bugData);
      setTests(testData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Bug stats ----
  const stats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b) => b.status === "open").length;
    const fixed = bugs.filter((b) => b.status === "fixed").length;
    const inProgress = bugs.filter((b) => b.status === "in-progress").length;
    const critical = bugs.filter((b) => b.severity === "critical" && b.status === "open").length;
    return { total, open, fixed, inProgress, critical };
  }, [bugs]);

  // ---- Test stats ----
  const testStats = useMemo(() => {
    const tiers = ["unit", "e2e", "user"] as const;
    const result: Record<string, { pass: number; fail: number; skip: number; pending: number; total: number }> = {};
    for (const tier of tiers) {
      const key = `${tier}_status` as keyof TestCaseRow;
      let pass = 0,
        fail = 0,
        skip = 0,
        pending = 0;
      for (const t of tests) {
        const s = t[key] as string;
        if (s === "pass") pass++;
        else if (s === "fail") fail++;
        else if (s === "skip") skip++;
        else pending++;
      }
      result[tier] = { pass, fail, skip, pending, total: tests.length };
    }
    return result;
  }, [tests]);

  const overallPassRate = useMemo(() => {
    const totalChecks = tests.length * 3; // 3 tiers
    if (totalChecks === 0) return 0;
    let passed = 0;
    for (const t of tests) {
      if (t.unit_status === "pass") passed++;
      if (t.e2e_status === "pass") passed++;
      if (t.user_status === "pass") passed++;
    }
    return Math.round((passed / totalChecks) * 100);
  }, [tests]);

  // ---- Filtered & sorted bugs ----
  const filteredBugs = useMemo(() => {
    let result = [...bugs];
    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    if (severityFilter !== "all") result = result.filter((b) => b.severity === severityFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (b.page_route && b.page_route.toLowerCase().includes(q)) ||
          String(b.bug_number).includes(q)
      );
    }
    // Sort
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, cosmetic: 4 };
    const statusOrder: Record<string, number> = { open: 0, "in-progress": 1, fixed: 2 };
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "bug_number":
          cmp = a.bug_number - b.bug_number;
          break;
        case "severity":
          cmp = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [bugs, statusFilter, severityFilter, searchQuery, sortField, sortDir]);

  // ---- Test cases grouped by category ----
  const testsByCategory = useMemo(() => {
    const groups: Record<string, TestCaseRow[]> = {};
    for (const t of tests) {
      const cat = t.category || "uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [tests]);

  // ---- Sort toggle ----
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="inline h-3 w-3" />
      ) : (
        <ChevronDown className="inline h-3 w-3" />
      )
    ) : null;

  // ---- Render ----
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-sm text-atlas-text-secondary">Loading bug tracker...</div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm text-atlas-teal hover:bg-atlas-teal/25"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-2">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">Admin</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
            Bug &amp; Test Tracker
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
            Live bug reports and test case status from Supabase. {bugs.length} bugs tracked, {tests.length} test cases.
          </p>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Bugs" value={stats.total} icon={<Bug className="h-4 w-4" />} color="text-atlas-text" />
          <StatCard
            label="Open"
            value={stats.open}
            icon={<XCircle className="h-4 w-4" />}
            color="text-red-400"
          />
          <StatCard
            label="Fixed"
            value={stats.fixed}
            icon={<CheckCircle2 className="h-4 w-4" />}
            color="text-emerald-400"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={<Clock className="h-4 w-4" />}
            color="text-yellow-400"
          />
          <StatCard
            label="Critical Open"
            value={stats.critical}
            icon={<AlertTriangle className="h-4 w-4" />}
            color="text-red-400"
          />
          <StatCard
            label="Test Pass Rate"
            value={`${overallPassRate}%`}
            icon={<FlaskConical className="h-4 w-4" />}
            color="text-atlas-teal"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl">
          <Filter className="h-4 w-4 text-atlas-text-muted" />
          <select
            className="rounded-md border border-glass-border bg-[#1a2235] px-2 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="fixed">Fixed</option>
            <option value="in-progress">In Progress</option>
          </select>

          <select
            className="rounded-md border border-glass-border bg-[#1a2235] px-2 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="cosmetic">Cosmetic</option>
          </select>

          <input
            type="text"
            placeholder="Search bugs..."
            className="flex-1 rounded-md border border-glass-border bg-[#1a2235] px-3 py-1.5 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <span className="ml-auto text-xs text-atlas-text-muted">
            {filteredBugs.length} of {bugs.length} bugs
          </span>

          <button
            onClick={fetchData}
            className="rounded-md border border-atlas-teal bg-atlas-teal/15 px-3 py-1.5 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            Refresh
          </button>
        </div>

        {/* Bug table */}
        <div className="overflow-hidden rounded-xl border border-glass-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border bg-[#111827] text-xs uppercase tracking-wider text-atlas-text-muted">
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("bug_number")}
                  >
                    # <SortIcon field="bug_number" />
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("severity")}
                  >
                    Severity <SortIcon field="severity" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("status")}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-4 py-3">Route</th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("created_at")}
                  >
                    Created <SortIcon field="created_at" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-glass backdrop-blur-xl">
                {filteredBugs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-atlas-text-secondary">
                      No bugs match the current filters.
                    </td>
                  </tr>
                )}
                {filteredBugs.map((bug) => (
                  <tr
                    key={bug.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-atlas-teal">
                      {bug.bug_number}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className="truncate font-medium text-atlas-text">{bug.title}</div>
                      {bug.found_by && (
                        <div className="mt-0.5 text-[11px] text-atlas-text-muted">
                          by {bug.found_by}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityColor(bug.severity)}`}
                      >
                        {bug.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusColor(bug.status)}`}
                      >
                        {bug.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {bug.page_route ? (
                        <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 text-[11px] text-atlas-teal">
                          {bug.page_route}
                        </code>
                      ) : (
                        <span className="text-xs text-atlas-text-muted">--</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-atlas-text-muted">
                      {relativeTime(bug.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Matrix Section */}
        <div className="overflow-hidden rounded-xl border border-glass-border">
          <button
            onClick={() => setShowTestMatrix((v) => !v)}
            className="flex w-full items-center gap-3 bg-[#111827] px-5 py-4 text-left transition-colors hover:bg-[#1a2235]"
          >
            <BarChart3 className="h-5 w-5 text-atlas-teal" />
            <span className="text-lg font-semibold text-atlas-text">Test Matrix</span>
            <span className="ml-1 rounded-full bg-atlas-teal/15 px-2.5 py-0.5 text-xs font-medium text-atlas-teal">
              {tests.length} tests
            </span>
            <span className="ml-auto text-xs text-atlas-text-muted">
              {showTestMatrix ? "-" : "+"}
            </span>
          </button>

          {showTestMatrix && (
            <div className="bg-glass p-5 backdrop-blur-xl">
              {/* 3-tier summary bar */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["unit", "e2e", "user"] as const).map((tier) => {
                  const s = testStats[tier];
                  if (!s) return null;
                  const pct = s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0;
                  return (
                    <div
                      key={tier}
                      className="rounded-xl border border-glass-border bg-[#111827] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                          {tier === "unit" ? "Unit Tests" : tier === "e2e" ? "E2E Tests" : "User Tests"}
                        </span>
                        <span className="text-sm font-bold text-atlas-teal">{pct}%</span>
                      </div>
                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#0A1628]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-atlas-teal to-emerald-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-[11px]">
                        <span className="text-emerald-400">{s.pass} pass</span>
                        <span className="text-red-400">{s.fail} fail</span>
                        <span className="text-yellow-400">{s.skip} skip</span>
                        <span className="text-atlas-text-muted">{s.pending} pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Test cases by category */}
              {Object.entries(testsByCategory).map(([category, cases]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                    {category} ({cases.length})
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-glass-border">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-glass-border bg-[#111827] text-[11px] uppercase tracking-wider text-atlas-text-muted">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Title</th>
                          <th className="px-3 py-2">Route</th>
                          <th className="px-3 py-2 text-center">Unit</th>
                          <th className="px-3 py-2 text-center">E2E</th>
                          <th className="px-3 py-2 text-center">User</th>
                          <th className="px-3 py-2">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {cases.map((tc) => (
                          <tr
                            key={tc.id}
                            className="transition-colors hover:bg-white/[0.02]"
                          >
                            <td className="px-3 py-2 font-mono text-atlas-teal">
                              {tc.test_number}
                            </td>
                            <td className="max-w-xs truncate px-3 py-2 text-atlas-text">
                              {tc.title}
                            </td>
                            <td className="px-3 py-2">
                              {tc.page_route ? (
                                <code className="rounded bg-atlas-teal/10 px-1 py-0.5 text-[10px] text-atlas-teal">
                                  {tc.page_route}
                                </code>
                              ) : (
                                <span className="text-atlas-text-muted">--</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {testStatusIcon(tc.unit_status)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {testStatusIcon(tc.e2e_status)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {testStatusIcon(tc.user_status)}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(tc.priority)}`}
                              >
                                {tc.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass p-4 backdrop-blur-xl">
      <div className={`mb-1 flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-atlas-text-muted">
        {label}
      </div>
    </div>
  );
}

export default function AdminBugsPage() {
  return (
    <FeatureGate flagKey="super_admin">
      <AdminBugsContent />
    </FeatureGate>
  );
}
