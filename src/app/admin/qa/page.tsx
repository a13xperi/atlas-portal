"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { useAuth } from "@/lib/auth";
import { api, QaTestRun } from "@/lib/api";
import { sections, TOTAL_TESTS, type TestCase, type TestSection } from "./test-definitions";

type TestStatus = "pending" | "pass" | "fail" | "skip";

type Severity = "blocker" | "major" | "minor" | "cosmetic";

interface TestResult {
  status: TestStatus;
  note: string;
  tester: string;
  timestamp: string;
  severity?: Severity;
  userFeedback?: string;
}

type ResultsMap = Record<string, TestResult>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function computeSummary(results: ResultsMap) {
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let blockers = 0;
  for (const r of Object.values(results)) {
    if (r.status === "pass") pass++;
    else if (r.status === "fail") {
      fail++;
      if (r.severity === "blocker") blockers++;
    }
    else if (r.status === "skip") skip++;
  }
  return { pass, fail, skip, blockers, total: TOTAL_TESTS };
}

function sectionBadge(sectionTests: TestCase[], results: ResultsMap) {
  let done = 0;
  let fails = 0;
  for (const t of sectionTests) {
    const r = results[t.id];
    if (r && r.status !== "pending") done++;
    if (r && r.status === "fail") fails++;
  }
  if (done === 0) return { label: "Pending", cls: "bg-white/5 text-atlas-text-muted" };
  if (fails > 0) return { label: `${fails} fail`, cls: "bg-red-500/15 text-red-400" };
  if (done === sectionTests.length) return { label: "Done", cls: "bg-emerald-500/15 text-emerald-400" };
  return { label: `${done}/${sectionTests.length}`, cls: "bg-blue-500/15 text-blue-400" };
}

function formatRunLabel(run: QaTestRun) {
  const d = new Date(run.created_at);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const done = Object.values(run.results ?? {}).filter((r) => r.status !== "pending").length;
  return `${date} ${time} -- ${run.tester_initials} (${done}/${TOTAL_TESTS})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function QaContent() {
  const { user, loading: authLoading } = useAuth();

  const isManager = user?.role === "ADMIN" || user?.role === "MANAGER";
  const testerName = user?.displayName || user?.handle || "Tester";
  const testerInitials = getInitials(testerName);

  // Runs state
  const [runs, setRuns] = useState<QaTestRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [results, setResults] = useState<ResultsMap>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "failed" | "incomplete" | "passed">("all");
  const [search, setSearch] = useState("");

  // Allow editing if user is manager OR owns the active run
  const activeRun = runs.find((r) => r.id === activeRunId);
  const canEdit = isManager || (!!activeRun && activeRun.tester_id === user?.id);

  // Debounce save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestResultsRef = useRef<ResultsMap>(results);
  latestResultsRef.current = results;

  // ---- Load runs on mount ----
  useEffect(() => {
    let cancelled = false;
    api.qa
      .listRuns()
      .then((res) => {
        if (cancelled) return;
        const validRuns = (res.runs ?? []).filter((r) => r && r.id);
        const sorted = validRuns.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setRuns(sorted);
        if (sorted.length > 0) {
          setActiveRunId(sorted[0].id);
          setResults((sorted[0].results ?? {}) as ResultsMap);
        }
      })
      .catch(() => {
        // API may not be deployed yet — start with empty state
      })
      .finally(() => {
        if (!cancelled) setLoadingRuns(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Debounced save ----
  const scheduleSave = useCallback(
    (nextResults: ResultsMap) => {
      if (!activeRunId || !canEdit) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const summary = computeSummary(nextResults);
        setSaving(true);
        api.qa
          .updateRun(activeRunId, { results: nextResults, summary })
          .catch(() => {})
          .finally(() => setSaving(false));
      }, 1000);
    },
    [activeRunId, canEdit],
  );

  // ---- Actions ----
  const markTest = useCallback(
    (testId: string, status: TestStatus) => {
      if (!canEdit) return;
      setResults((prev) => {
        const existing = prev[testId];
        // Toggle off if clicking same status
        const newStatus = existing?.status === status ? "pending" : status;
        const next: ResultsMap = {
          ...prev,
          [testId]: {
            status: newStatus,
            note: existing?.note ?? "",
            tester: testerInitials,
            timestamp: new Date().toISOString(),
          },
        };
        scheduleSave(next);
        return next;
      });
    },
    [canEdit, testerInitials, scheduleSave],
  );

  const setNote = useCallback(
    (testId: string, note: string) => {
      if (!canEdit) return;
      setResults((prev) => {
        const existing = prev[testId];
        const next: ResultsMap = {
          ...prev,
          [testId]: {
            status: existing?.status ?? "pending",
            note,
            tester: existing?.tester ?? testerInitials,
            timestamp: new Date().toISOString(),
          },
        };
        scheduleSave(next);
        return next;
      });
    },
    [canEdit, testerInitials, scheduleSave],
  );

  const createRun = useCallback(async () => {
    let newRun;
    try {
      const res = await api.qa.createRun({
        tester_name: testerName,
        tester_initials: testerInitials,
      });
      newRun = res.run;
    } catch {
      // Backend unavailable — create a local-only run
    }
    if (!newRun?.id) {
      newRun = {
        id: `local-${Date.now()}`,
        project: "atlas-portal",
        tester_name: testerName,
        tester_initials: testerInitials,
        tester_id: "local",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        results: {},
        summary: { pass: 0, fail: 0, skip: 0, blockers: 0, total: TOTAL_TESTS },
        status: "in_progress" as const,
      };
    }
    setRuns((prev) => [newRun, ...prev]);
    setActiveRunId(newRun.id);
    setResults({});
  }, [testerName, testerInitials]);

  const deleteRun = useCallback(
    async (id: string) => {
      if (!canEdit) return;
      if (!confirm("Delete this test run? This cannot be undone.")) return;
      try {
        await api.qa.deleteRun(id);
        setRuns((prev) => prev.filter((r) => r.id !== id));
        if (activeRunId === id) {
          setRuns((prev) => {
            if (prev.length > 0 && prev[0]?.id) {
              setActiveRunId(prev[0].id);
              setResults((prev[0].results ?? {}) as ResultsMap);
            } else {
              setActiveRunId(null);
              setResults({});
            }
            return prev;
          });
        }
      } catch {
        // Silently handle
      }
    },
    [canEdit, activeRunId],
  );

  const switchRun = useCallback(
    (id: string) => {
      const run = runs.find((r) => r.id === id);
      if (!run) return;
      setActiveRunId(id);
      setResults((run.results ?? {}) as ResultsMap);
    },
    [runs],
  );

  const exportMarkdown = useCallback(() => {
    const summary = computeSummary(results);
    const pct = TOTAL_TESTS > 0 ? Math.round(((summary.pass + summary.fail + summary.skip) / TOTAL_TESTS) * 100) : 0;
    let md = `# Atlas QA Test Report\n\n`;
    md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
    md += `**Tester:** ${testerName} (${testerInitials})\n`;
    md += `**Progress:** ${pct}% (${summary.pass} pass, ${summary.fail} fail, ${summary.skip} skip / ${TOTAL_TESTS} total)\n\n`;
    md += `---\n\n`;
    for (const section of sections) {
      md += `## ${section.title}\n\n`;
      for (const test of section.tests) {
        const r = results[test.id];
        const status = r?.status ?? "pending";
        const icon = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : status === "skip" ? "SKIP" : "----";
        md += `- [${icon}] **${test.id}** ${test.name}`;
        if (r?.tester) md += ` _(${r.tester})_`;
        md += `\n`;
        if (r?.note) md += `  - Note: ${r.note}\n`;
      }
      md += `\n`;
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-qa-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, testerName, testerInitials]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  // ---- Computed ----
  const summary = useMemo(() => computeSummary(results), [results]);
  const pctComplete = TOTAL_TESTS > 0
    ? Math.round(((summary.pass + summary.fail + summary.skip) / TOTAL_TESTS) * 100)
    : 0;

  const filteredSections = useMemo(() => {
    let filtered = sections as TestSection[];
    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered
        .map((section) => ({
          ...section,
          tests: section.tests.filter(
            (t) =>
              t.id.toLowerCase().includes(q) ||
              t.name.toLowerCase().includes(q),
          ),
        }))
        .filter((s) => s.tests.length > 0);
    }
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered
        .map((section) => ({
          ...section,
          tests: section.tests.filter((t) => {
            const status = results[t.id]?.status ?? "pending";
            if (filter === "failed") return status === "fail";
            if (filter === "incomplete") return status === "pending";
            if (filter === "passed") return status === "pass";
            return true;
          }),
        }))
        .filter((s) => s.tests.length > 0);
    }
    return filtered;
  }, [filter, search, results]);

  const markAllInSection = useCallback(
    (sectionId: string, status: TestStatus) => {
      if (!canEdit) return;
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      setResults((prev) => {
        const next = { ...prev };
        for (const test of section.tests) {
          next[test.id] = {
            status,
            note: prev[test.id]?.note ?? "",
            tester: testerInitials,
            timestamp: new Date().toISOString(),
          };
        }
        scheduleSave(next);
        return next;
      });
    },
    [canEdit, testerInitials, scheduleSave],
  );

  // ---- Render ----
  if (authLoading || loadingRuns) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-sm text-atlas-text-secondary">
            Loading QA runner...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-2">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
            Admin
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
            QA Test Runner
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
            Interactive testing dashboard for Atlas. Mark tests pass/fail/skip, add notes, and export results.
          </p>
        </header>

        {/* Tester bar + run selector */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-atlas-text-muted">
            Tester
          </span>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-atlas-teal text-xs font-bold text-atlas-text"
            style={{ background: "rgb(59, 130, 246)" }}
            title={testerName}
          >
            {testerInitials}
          </div>
          <span className="text-sm font-semibold text-atlas-teal">{testerName}</span>

          <div className="mx-2 h-5 w-px bg-glass-border" />

          <label className="text-xs uppercase tracking-wider text-atlas-text-muted">Run</label>
          <select
            className="rounded-md border border-glass-border bg-[#1a2235] px-2 py-1 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
            value={activeRunId ?? ""}
            onChange={(e) => switchRun(e.target.value)}
          >
            {runs.length === 0 && <option value="">No runs</option>}
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {formatRunLabel(r)}
              </option>
            ))}
          </select>

          <button
            onClick={createRun}
            className="rounded-md border border-atlas-teal bg-atlas-teal/15 px-3 py-1 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            + New Run
          </button>
          {activeRunId && isManager && (
            <button
              onClick={() => deleteRun(activeRunId)}
              className="rounded-md border border-red-500/30 px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {saving && (
              <span className="text-xs text-atlas-text-muted animate-pulse">Saving...</span>
            )}
            <button
              onClick={exportMarkdown}
              className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-atlas-teal/20 transition-transform hover:scale-[1.03]"
            >
              Export Markdown
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-lg bg-[#111827]">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 transition-all duration-500"
              style={{ width: `${pctComplete}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {summary.pass} Pass
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
              {summary.fail} Fail
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              {summary.skip} Skip
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-atlas-text-muted" />
              {TOTAL_TESTS - summary.pass - summary.fail - summary.skip} Remaining
            </span>
            <span className="ml-auto font-semibold text-atlas-teal">
              {pctComplete}% complete
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests (ID or name)..."
            className="w-48 rounded-lg border border-glass-border bg-[#111827] px-3 py-1.5 text-xs text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none"
          />
          {(["all", "incomplete", "failed", "passed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-atlas-teal/20 text-atlas-teal border border-atlas-teal/40"
                  : "bg-white/5 text-atlas-text-muted border border-transparent hover:bg-white/10"
              }`}
            >
              {f === "all" ? "All" : f === "incomplete" ? "Incomplete" : f === "failed" ? "Failed" : "Passed"}
            </button>
          ))}
        </div>

        {/* No runs state */}
        {!activeRunId && (
          <div className="rounded-2xl border border-glass-border bg-glass p-12 text-center backdrop-blur-xl">
            <p className="text-atlas-text-secondary">
              No test runs yet.{" "}
              Create one to get started.
            </p>
          </div>
        )}

        {/* Sections */}
        {activeRunId &&
          filteredSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              results={results}
              collapsed={!!collapsed[section.id]}
              onToggle={() => toggleSection(section.id)}
              onMark={markTest}
              onNote={setNote}
              onMarkAll={markAllInSection}
              canEdit={canEdit}
            />
          ))}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  results,
  collapsed,
  onToggle,
  onMark,
  onNote,
  onMarkAll,
  canEdit,
}: {
  section: TestSection;
  results: ResultsMap;
  collapsed: boolean;
  onToggle: () => void;
  onMark: (id: string, status: TestStatus) => void;
  onNote: (id: string, note: string) => void;
  onMarkAll: (sectionId: string, status: TestStatus) => void;
  canEdit: boolean;
}) {
  const badge = sectionBadge(section.tests, results);

  return (
    <div className="overflow-hidden rounded-xl border border-glass-border">
      {/* Header */}
      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-3 bg-[#111827] px-5 py-4 text-left transition-colors hover:bg-[#1a2235]"
      >
        <span className="text-lg font-semibold text-atlas-text">{section.title}</span>
        <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
        {canEdit && (
          <div className="ml-2 flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onMarkAll(section.id, "pass"); }}
              className="rounded px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
              title="Mark all pass"
            >
              All ✓
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMarkAll(section.id, "skip"); }}
              className="rounded px-1.5 py-0.5 text-[10px] text-yellow-400 hover:bg-yellow-500/10"
              title="Mark all skip"
            >
              All —
            </button>
          </div>
        )}
        <span className="ml-auto text-xs text-atlas-text-muted">
          {collapsed ? "+" : "-"}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="divide-y divide-white/5 bg-glass backdrop-blur-xl">
          {section.tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              result={results[test.id]}
              onMark={onMark}
              onNote={onNote}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test card
// ---------------------------------------------------------------------------

function TestCard({
  test,
  result,
  onMark,
  onNote,
  canEdit,
}: {
  test: TestCase;
  result?: TestResult;
  onMark: (id: string, status: TestStatus) => void;
  onNote: (id: string, note: string) => void;
  canEdit: boolean;
}) {
  const [showNote, setShowNote] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const status = result?.status ?? "pending";

  const borderClass =
    status === "pass"
      ? "border-l-emerald-400"
      : status === "fail"
        ? "border-l-red-400"
        : status === "skip"
          ? "border-l-yellow-400"
          : "border-l-transparent";

  return (
    <div
      className={`border-l-[3px] px-5 py-4 transition-colors hover:bg-white/[0.02] ${borderClass}`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 whitespace-nowrap rounded bg-atlas-teal/10 px-2 py-0.5 font-mono text-[11px] text-atlas-teal">
          {test.id}
        </span>
        <span className="flex-1 text-sm font-medium text-atlas-text">{test.name}</span>
        {test.priority && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            test.priority === "critical" ? "bg-red-500/15 text-red-400" :
            test.priority === "high" ? "bg-orange-500/15 text-orange-400" :
            test.priority === "medium" ? "bg-blue-500/15 text-blue-400" :
            "bg-white/5 text-atlas-text-muted"
          }`}>
            {test.priority}
          </span>
        )}
        {result?.tester && (
          <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-400">
            {result.tester}
          </span>
        )}
        {/* Action buttons */}
        <div className="flex gap-1">
          <StatusButton
            label="Pass"
            symbol="checkmark"
            active={status === "pass"}
            activeClass="bg-emerald-500/15 border-emerald-400 text-emerald-400"
            onClick={() => onMark(test.id, "pass")}
            disabled={!canEdit}
          />
          <StatusButton
            label="Fail"
            symbol="cross"
            active={status === "fail"}
            activeClass="bg-red-500/15 border-red-400 text-red-400"
            onClick={() => onMark(test.id, "fail")}
            disabled={!canEdit}
          />
          <StatusButton
            label="Skip"
            symbol="dash"
            active={status === "skip"}
            activeClass="bg-yellow-500/15 border-yellow-400 text-yellow-400"
            onClick={() => onMark(test.id, "skip")}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Steps toggle */}
      <div className="mt-2 ml-[72px]">
        <button
          onClick={() => setShowSteps((p) => !p)}
          className="text-[11px] text-atlas-text-muted hover:text-atlas-text"
        >
          {showSteps ? "Hide steps" : "Show steps"}
        </button>
        {showSteps && (
          <div className="mt-2 space-y-1 text-[13px] text-atlas-text-muted">
            <ol className="list-decimal space-y-1 pl-4">
              {test.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <div className="mt-2 rounded-r-md border-l-2 border-blue-500/40 bg-blue-500/[0.06] px-3 py-2 text-xs text-blue-400">
              <span className="font-semibold">Expected: </span>
              {test.expected}
            </div>
          </div>
        )}
      </div>

      {/* Known issue */}
      {test.knownIssue && (
        <div className="mt-2 ml-[72px] rounded-r-md border-l-2 border-red-500/40 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">
          <span className="font-semibold">Known Issue: </span>
          {test.knownIssue}
        </div>
      )}

      {/* Notes */}
      <div className="mt-2 ml-[72px]">
        <button
          onClick={() => setShowNote((p) => !p)}
          className="text-[11px] text-atlas-text-muted hover:text-atlas-text"
        >
          {showNote ? "Hide note" : result?.note ? "Edit note" : "Add note"}
        </button>
        {showNote && (
          <textarea
            className="mt-1 w-full resize-y rounded-md border border-glass-border bg-[#111827] px-3 py-2 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
            rows={2}
            placeholder="Add a note..."
            value={result?.note ?? ""}
            onChange={(e) => onNote(test.id, e.target.value)}
            readOnly={!canEdit}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status button
// ---------------------------------------------------------------------------

function StatusButton({
  label,
  symbol,
  active,
  activeClass,
  onClick,
  disabled,
}: {
  label: string;
  symbol: "checkmark" | "cross" | "dash";
  active: boolean;
  activeClass: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const icons: Record<string, string> = {
    checkmark: "\u2713",
    cross: "\u2717",
    dash: "\u2014",
  };

  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-all ${
        active
          ? activeClass
          : "border-glass-border bg-[#111827] text-atlas-text-muted hover:border-atlas-teal hover:text-atlas-teal"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      {icons[symbol]}
    </button>
  );
}

export default function QaPage() {
  return (
    <FeatureGate flagKey="super_admin">
      <QaContent />
    </FeatureGate>
  );
}
