"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { api, BugRecord, BugCreateInput } from "@/lib/api";
import {
  Bug,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  RefreshCw,
  Globe,
  Monitor,
  User,
  Hash,
  MessageSquare,
  ExternalLink,
  Archive,
  Undo2,
  Ban,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter = "all" | "open" | "closed" | "wontfix" | "fixed" | "in-progress";

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
    case "closed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "in-progress":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "wontfix":
      return "bg-gray-500/15 text-gray-400 border-gray-500/30";
    case "archived":
      return "bg-gray-600/15 text-gray-500 border-gray-600/30";
    default:
      return "bg-white/5 text-atlas-text-muted border-glass-border";
  }
}

function statusDot(st: string) {
  switch (st) {
    case "open":
      return "bg-red-400";
    case "fixed":
    case "closed":
      return "bg-emerald-400";
    case "in-progress":
      return "bg-yellow-400";
    case "wontfix":
      return "bg-gray-400";
    default:
      return "bg-gray-500";
  }
}

function sourceIcon(source: string | null) {
  switch (source) {
    case "console":
      return <Monitor className="h-3.5 w-3.5 text-amber-400" />;
    case "manual":
      return <User className="h-3.5 w-3.5 text-atlas-teal" />;
    default:
      return <Bug className="h-3.5 w-3.5 text-atlas-text-muted" />;
  }
}

function relativeTime(iso: string | null) {
  if (!iso) return "--";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-4 backdrop-blur-xl">
      <div className="text-2xl font-semibold text-atlas-text">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-atlas-text-muted">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report Bug Modal
// ---------------------------------------------------------------------------

function ReportBugModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: BugCreateInput) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium" | "low" | "cosmetic">("medium");
  const [pageRoute, setPageRoute] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      severity,
      page_route: pageRoute.trim() || null,
      source: "manual",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-glass-border bg-atlas-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-atlas-text">Report Bug</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:bg-white/5 hover:text-atlas-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the bug"
              className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected vs actual behavior, stack trace..."
              rows={5}
              className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
                className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="cosmetic">Cosmetic</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
                Page Route
              </label>
              <input
                type="text"
                value={pageRoute}
                onChange={(e) => setPageRoute(e.target.value)}
                placeholder="/dashboard"
                className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-glass-border bg-white/5 px-4 py-2 text-sm font-medium text-atlas-text-muted transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim() || submitting}
              className="rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Bug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bug Detail Panel (inline expand)
// ---------------------------------------------------------------------------

function BugDetail({
  bug,
  onUpdate,
  updating,
}: {
  bug: BugRecord;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  updating: boolean;
}) {
  const [noteText, setNoteText] = useState(bug.notes || "");
  const [showNote, setShowNote] = useState(false);

  return (
    <tr>
      <td colSpan={7} className="border-b border-glass-border bg-[#0d1525] px-0">
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Stack trace / description */}
            <div className="lg:col-span-2">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                Description / Stack Trace
              </h4>
              <pre className="max-h-64 overflow-auto rounded-lg border border-glass-border bg-[#0A1628] p-3 text-xs leading-relaxed text-atlas-text-secondary">
                {bug.description}
              </pre>
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-3">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Details
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-atlas-text-secondary">
                    <Hash className="h-3.5 w-3.5 text-atlas-text-muted" />
                    <span>Occurrences: <span className="font-bold text-atlas-text">{bug.occurrence_count}</span></span>
                  </div>
                  {bug.page_url && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Globe className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <a
                        href={bug.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-atlas-teal hover:underline"
                      >
                        {bug.page_url.replace(/^https?:\/\//, "").slice(0, 50)}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  {bug.page_route && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Globe className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 text-[11px] text-atlas-teal">
                        {bug.page_route}
                      </code>
                    </div>
                  )}
                  {bug.user_agent && (
                    <div className="flex items-start gap-2 text-atlas-text-secondary">
                      <Monitor className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-atlas-text-muted" />
                      <span className="truncate text-[11px]">{bug.user_agent.slice(0, 80)}...</span>
                    </div>
                  )}
                  {bug.fingerprint && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Hash className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <span className="font-mono text-[10px] text-atlas-text-muted">
                        {bug.fingerprint.slice(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Notes
                </h4>
                {bug.notes && !showNote && (
                  <p className="mb-2 rounded-lg border border-glass-border bg-[#0A1628] p-2 text-xs text-atlas-text-secondary">
                    {bug.notes}
                  </p>
                )}
                {showNote ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                      placeholder="Add a note..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onUpdate(bug.id, { notes: noteText });
                          setShowNote(false);
                        }}
                        disabled={updating}
                        className="rounded-md bg-atlas-teal/15 px-3 py-1 text-xs font-medium text-atlas-teal hover:bg-atlas-teal/25 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowNote(false)}
                        className="rounded-md bg-white/5 px-3 py-1 text-xs text-atlas-text-muted hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNote(true)}
                    className="flex items-center gap-1.5 text-xs text-atlas-teal hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {bug.notes ? "Edit Note" : "Add Note"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {bug.status === "open" && (
                    <>
                      <button
                        onClick={() => onUpdate(bug.id, { status: "closed" })}
                        disabled={updating}
                        className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Close
                      </button>
                      <button
                        onClick={() => onUpdate(bug.id, { status: "wontfix" })}
                        disabled={updating}
                        className="flex items-center gap-1.5 rounded-md border border-gray-500/30 bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-500/20 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Won&apos;t Fix
                      </button>
                    </>
                  )}
                  {bug.status === "in-progress" && (
                    <button
                      onClick={() => onUpdate(bug.id, { status: "fixed" })}
                      disabled={updating}
                      className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Fixed
                    </button>
                  )}
                  {(bug.status === "closed" || bug.status === "fixed" || bug.status === "wontfix") && (
                    <button
                      onClick={() => onUpdate(bug.id, { status: "open" })}
                      disabled={updating}
                      className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => onUpdate(bug.id, { status: "archived" })}
                    disabled={updating}
                    className="flex items-center gap-1.5 rounded-md border border-glass-border bg-white/5 px-2.5 py-1 text-xs font-medium text-atlas-text-muted transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function AdminBugsContent() {
  const [bugs, setBugs] = useState<BugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort
  const [sortField, setSortField] = useState<"bug_number" | "severity" | "occurrence_count" | "last_seen_at" | "created_at">("last_seen_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ---- Fetch ----
  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const result = await api.bugs.list(statusParam);
      setBugs(result.bugs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bugs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b) => b.status === "open").length;
    const fixed = bugs.filter((b) => b.status === "fixed" || b.status === "closed").length;
    const inProgress = bugs.filter((b) => b.status === "in-progress").length;
    const consoleErrors = bugs.filter((b) => b.source === "console").length;
    const totalOccurrences = bugs.reduce((sum, b) => sum + (b.occurrence_count || 1), 0);
    return { total, open, fixed, inProgress, consoleErrors, totalOccurrences };
  }, [bugs]);

  // ---- Filter + Sort ----
  const filteredBugs = useMemo(() => {
    let result = [...bugs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (b.page_route && b.page_route.toLowerCase().includes(q)) ||
          (b.page_url && b.page_url.toLowerCase().includes(q)) ||
          String(b.bug_number).includes(q),
      );
    }

    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, cosmetic: 4 };
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "bug_number":
          cmp = (a.bug_number || 0) - (b.bug_number || 0);
          break;
        case "severity":
          cmp = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
          break;
        case "occurrence_count":
          cmp = (a.occurrence_count || 1) - (b.occurrence_count || 1);
          break;
        case "last_seen_at":
          cmp = new Date(a.last_seen_at || a.created_at).getTime() - new Date(b.last_seen_at || b.created_at).getTime();
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [bugs, searchQuery, sortField, sortDir]);

  // ---- Actions ----
  const handleUpdate = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setUpdating(true);
      try {
        const result = await api.bugs.update(id, data as any);
        setBugs((prev) => prev.map((b) => (b.id === id ? result.bug : b)));
      } catch {
        // Silently fail — could show toast
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const handleCreate = useCallback(
    async (data: BugCreateInput) => {
      setSubmitting(true);
      try {
        const result = await api.bugs.create(data);
        setBugs((prev) => [result.bug, ...prev]);
        setShowReportModal(false);
      } catch {
        // Could show error toast
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

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
            onClick={fetchBugs}
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
        <header className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">Admin</p>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
              Bug Tracker
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
              {stats.total} bugs tracked with {stats.totalOccurrences} total occurrences.
              {stats.consoleErrors > 0 && ` ${stats.consoleErrors} auto-captured from console errors.`}
            </p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 rounded-xl bg-atlas-teal/15 px-4 py-2.5 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            <Plus className="h-4 w-4" />
            Report Bug
          </button>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Bugs" value={stats.total} icon={<Bug className="h-4 w-4" />} color="text-atlas-text" />
          <StatCard label="Open" value={stats.open} icon={<XCircle className="h-4 w-4" />} color="text-red-400" />
          <StatCard label="Fixed / Closed" value={stats.fixed} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-400" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="h-4 w-4" />} color="text-yellow-400" />
          <StatCard label="Console Errors" value={stats.consoleErrors} icon={<Monitor className="h-4 w-4" />} color="text-amber-400" />
          <StatCard label="Occurrences" value={stats.totalOccurrences} icon={<AlertTriangle className="h-4 w-4" />} color="text-atlas-teal" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl">
          <Filter className="h-4 w-4 text-atlas-text-muted" />

          {/* Status filter pills */}
          <div className="flex gap-1.5">
            {(["all", "open", "closed", "wontfix", "in-progress"] as StatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "border-atlas-teal bg-atlas-teal/15 text-atlas-teal"
                    : "border-glass-border bg-white/5 text-atlas-text-muted hover:bg-white/10"
                }`}
              >
                {st === "all" ? "All" : st === "wontfix" ? "Won't Fix" : st === "in-progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search bugs..."
            className="flex-1 rounded-md border border-glass-border bg-[#1a2235] px-3 py-1.5 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <span className="text-xs text-atlas-text-muted">
            {filteredBugs.length} of {bugs.length}
          </span>

          <button
            onClick={fetchBugs}
            className="rounded-md border border-atlas-teal bg-atlas-teal/15 p-1.5 text-atlas-teal transition-colors hover:bg-atlas-teal/25"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bug table */}
        <div className="overflow-hidden rounded-xl border border-glass-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border bg-[#111827] text-xs uppercase tracking-wider text-atlas-text-muted">
                  <th className="w-8 px-4 py-3">
                    {/* Status dot column */}
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Route</th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("occurrence_count")}
                  >
                    Hits <SortIcon field="occurrence_count" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                    onClick={() => toggleSort("last_seen_at")}
                  >
                    Last Seen <SortIcon field="last_seen_at" />
                  </th>
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
                    <td colSpan={7} className="px-4 py-12 text-center text-atlas-text-secondary">
                      No bugs match the current filters.
                    </td>
                  </tr>
                )}
                {filteredBugs.map((bug) => (
                  <Fragment key={bug.id}>
                    <tr
                      className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                        expandedId === bug.id ? "bg-white/[0.02]" : ""
                      }`}
                      onClick={() => setExpandedId(expandedId === bug.id ? null : bug.id)}
                    >
                      {/* Status dot */}
                      <td className="px-4 py-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${statusDot(bug.status)}`} />
                      </td>
                      {/* Title */}
                      <td className="max-w-xs px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-atlas-text-muted">#{bug.bug_number}</span>
                          <span className="truncate font-medium text-atlas-text">{bug.title}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(bug.severity)}`}>
                            {bug.severity}
                          </span>
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor(bug.status)}`}>
                            {bug.status}
                          </span>
                        </div>
                      </td>
                      {/* Source */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {sourceIcon(bug.source)}
                          <span className="text-xs text-atlas-text-secondary">{bug.source || "unknown"}</span>
                        </div>
                      </td>
                      {/* Route */}
                      <td className="px-4 py-3">
                        {bug.page_route ? (
                          <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 text-[11px] text-atlas-teal">
                            {bug.page_route}
                          </code>
                        ) : (
                          <span className="text-xs text-atlas-text-muted">--</span>
                        )}
                      </td>
                      {/* Occurrences */}
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-bold ${bug.occurrence_count > 10 ? "text-amber-400" : bug.occurrence_count > 1 ? "text-atlas-text" : "text-atlas-text-muted"}`}>
                          {bug.occurrence_count || 1}
                        </span>
                      </td>
                      {/* Last Seen */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-atlas-text-muted">
                        {relativeTime(bug.last_seen_at)}
                      </td>
                      {/* Created */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-atlas-text-muted">
                        {relativeTime(bug.created_at)}
                      </td>
                    </tr>
                    {expandedId === bug.id && (
                      <BugDetail
                        key={`detail-${bug.id}`}
                        bug={bug}
                        onUpdate={handleUpdate}
                        updating={updating}
                      />
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Bug Modal */}
      {showReportModal && (
        <ReportBugModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      )}
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Report Bug Modal
// ---------------------------------------------------------------------------

function ReportBugModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: BugCreateInput) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium" | "low" | "cosmetic">("medium");
  const [pageRoute, setPageRoute] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      severity,
      page_route: pageRoute.trim() || null,
      source: "manual",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-glass-border bg-atlas-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-atlas-text">Report Bug</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:bg-white/5 hover:text-atlas-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the bug"
              className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected vs actual behavior, stack trace..."
              rows={5}
              className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
                className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="cosmetic">Cosmetic</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
                Page Route
              </label>
              <input
                type="text"
                value={pageRoute}
                onChange={(e) => setPageRoute(e.target.value)}
                placeholder="/dashboard"
                className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-glass-border bg-white/5 px-4 py-2 text-sm font-medium text-atlas-text-muted transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim() || submitting}
              className="rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Bug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bug Detail Panel (inline expand)
// ---------------------------------------------------------------------------

function BugDetail({
  bug,
  onUpdate,
  updating,
}: {
  bug: BugRecord;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  updating: boolean;
}) {
  const [noteText, setNoteText] = useState(bug.notes || "");
  const [showNote, setShowNote] = useState(false);

  return (
    <tr>
      <td colSpan={7} className="border-b border-glass-border bg-[#0d1525] px-0">
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Stack trace / description */}
            <div className="lg:col-span-2">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                Description / Stack Trace
              </h4>
              <pre className="max-h-64 overflow-auto rounded-lg border border-glass-border bg-[#0A1628] p-3 text-xs leading-relaxed text-atlas-text-secondary">
                {bug.description}
              </pre>
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-3">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Details
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-atlas-text-secondary">
                    <Hash className="h-3.5 w-3.5 text-atlas-text-muted" />
                    <span>Occurrences: <span className="font-bold text-atlas-text">{bug.occurrence_count}</span></span>
                  </div>
                  {bug.page_url && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Globe className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <a
                        href={bug.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-atlas-teal hover:underline"
                      >
                        {bug.page_url.replace(/^https?:\/\//, "").slice(0, 50)}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  {bug.page_route && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Globe className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 text-[11px] text-atlas-teal">
                        {bug.page_route}
                      </code>
                    </div>
                  )}
                  {bug.user_agent && (
                    <div className="flex items-start gap-2 text-atlas-text-secondary">
                      <Monitor className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-atlas-text-muted" />
                      <span className="truncate text-[11px]">{bug.user_agent.slice(0, 80)}...</span>
                    </div>
                  )}
                  {bug.fingerprint && (
                    <div className="flex items-center gap-2 text-atlas-text-secondary">
                      <Hash className="h-3.5 w-3.5 text-atlas-text-muted" />
                      <span className="font-mono text-[10px] text-atlas-text-muted">
                        {bug.fingerprint.slice(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Notes
                </h4>
                {bug.notes && !showNote && (
                  <p className="mb-2 rounded-lg border border-glass-border bg-[#0A1628] p-2 text-xs text-atlas-text-secondary">
                    {bug.notes}
                  </p>
                )}
                {showNote ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-glass-border bg-[#1a2235] px-3 py-2 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                      placeholder="Add a note..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onUpdate(bug.id, { notes: noteText });
                          setShowNote(false);
                        }}
                        disabled={updating}
                        className="rounded-md bg-atlas-teal/15 px-3 py-1 text-xs font-medium text-atlas-teal hover:bg-atlas-teal/25 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowNote(false)}
                        className="rounded-md bg-white/5 px-3 py-1 text-xs text-atlas-text-muted hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNote(true)}
                    className="flex items-center gap-1.5 text-xs text-atlas-teal hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {bug.notes ? "Edit Note" : "Add Note"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                  Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {bug.status === "open" && (
                    <>
                      <button
                        onClick={() => onUpdate(bug.id, { status: "closed" })}
                        disabled={updating}
                        className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Close
                      </button>
                      <button
                        onClick={() => onUpdate(bug.id, { status: "wontfix" })}
                        disabled={updating}
                        className="flex items-center gap-1.5 rounded-md border border-gray-500/30 bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-500/20 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Won&apos;t Fix
                      </button>
                    </>
                  )}
                  {bug.status === "in-progress" && (
                    <button
                      onClick={() => onUpdate(bug.id, { status: "fixed" })}
                      disabled={updating}
                      className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Fixed
                    </button>
                  )}
                  {(bug.status === "closed" || bug.status === "fixed" || bug.status === "wontfix") && (
                    <button
                      onClick={() => onUpdate(bug.id, { status: "open" })}
                      disabled={updating}
                      className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => onUpdate(bug.id, { status: "archived" })}
                    disabled={updating}
                    className="flex items-center gap-1.5 rounded-md border border-glass-border bg-white/5 px-2.5 py-1 text-xs font-medium text-atlas-text-muted transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<BugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort
  const [sortField, setSortField] = useState<"bug_number" | "severity" | "occurrence_count" | "last_seen_at" | "created_at">("last_seen_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ---- Fetch ----
  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const result = await api.bugs.list(statusParam);
      setBugs(result.bugs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bugs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b) => b.status === "open").length;
    const fixed = bugs.filter((b) => b.status === "fixed" || b.status === "closed").length;
    const inProgress = bugs.filter((b) => b.status === "in-progress").length;
    const consoleErrors = bugs.filter((b) => b.source === "console").length;
    const totalOccurrences = bugs.reduce((sum, b) => sum + (b.occurrence_count || 1), 0);
    return { total, open, fixed, inProgress, consoleErrors, totalOccurrences };
  }, [bugs]);

  // ---- Filter + Sort ----
  const filteredBugs = useMemo(() => {
    let result = [...bugs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (b.page_route && b.page_route.toLowerCase().includes(q)) ||
          (b.page_url && b.page_url.toLowerCase().includes(q)) ||
          String(b.bug_number).includes(q),
      );
    }

    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, cosmetic: 4 };
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "bug_number":
          cmp = (a.bug_number || 0) - (b.bug_number || 0);
          break;
        case "severity":
          cmp = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
          break;
        case "occurrence_count":
          cmp = (a.occurrence_count || 1) - (b.occurrence_count || 1);
          break;
        case "last_seen_at":
          cmp = new Date(a.last_seen_at || a.created_at).getTime() - new Date(b.last_seen_at || b.created_at).getTime();
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [bugs, searchQuery, sortField, sortDir]);

  // ---- Actions ----
  const handleUpdate = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setUpdating(true);
      try {
        const result = await api.bugs.update(id, data as any);
        setBugs((prev) => prev.map((b) => (b.id === id ? result.bug : b)));
      } catch {
        // Silently fail — could show toast
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const handleCreate = useCallback(
    async (data: BugCreateInput) => {
      setSubmitting(true);
      try {
        const result = await api.bugs.create(data);
        setBugs((prev) => [result.bug, ...prev]);
        setShowReportModal(false);
      } catch {
        // Could show error toast
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

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
      <FeatureGate flagKey="super_admin">
        <AppShell>
          <div className="flex items-center justify-center py-32">
            <div className="animate-pulse text-sm text-atlas-text-secondary">Loading bug tracker...</div>
          </div>
        </AppShell>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate flagKey="super_admin">
        <AppShell>
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchBugs}
              className="rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm text-atlas-teal hover:bg-atlas-teal/25"
            >
              Retry
            </button>
          </div>
        </AppShell>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate flagKey="super_admin">
      <AppShell>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-2">
          {/* Header */}
          <header className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">Admin</p>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
                Bug Tracker
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
                {stats.total} bugs tracked with {stats.totalOccurrences} total occurrences.
                {stats.consoleErrors > 0 && ` ${stats.consoleErrors} auto-captured from console errors.`}
              </p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 rounded-xl bg-atlas-teal/15 px-4 py-2.5 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25"
            >
              <Plus className="h-4 w-4" />
              Report Bug
            </button>
          </header>

          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Bugs" value={stats.total} icon={<Bug className="h-4 w-4" />} color="text-atlas-text" />
            <StatCard label="Open" value={stats.open} icon={<XCircle className="h-4 w-4" />} color="text-red-400" />
            <StatCard label="Fixed / Closed" value={stats.fixed} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-400" />
            <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="h-4 w-4" />} color="text-yellow-400" />
            <StatCard label="Console Errors" value={stats.consoleErrors} icon={<Monitor className="h-4 w-4" />} color="text-amber-400" />
            <StatCard label="Occurrences" value={stats.totalOccurrences} icon={<AlertTriangle className="h-4 w-4" />} color="text-atlas-teal" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl">
            <Filter className="h-4 w-4 text-atlas-text-muted" />

            {/* Status filter pills */}
            <div className="flex gap-1.5">
              {(["all", "open", "closed", "wontfix", "in-progress"] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? "border-atlas-teal bg-atlas-teal/15 text-atlas-teal"
                      : "border-glass-border bg-white/5 text-atlas-text-muted hover:bg-white/10"
                  }`}
                >
                  {st === "all" ? "All" : st === "wontfix" ? "Won't Fix" : st === "in-progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search bugs..."
              className="flex-1 rounded-md border border-glass-border bg-[#1a2235] px-3 py-1.5 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <span className="text-xs text-atlas-text-muted">
              {filteredBugs.length} of {bugs.length}
            </span>

            <button
              onClick={fetchBugs}
              className="rounded-md border border-atlas-teal bg-atlas-teal/15 p-1.5 text-atlas-teal transition-colors hover:bg-atlas-teal/25"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bug table */}
          <div className="overflow-hidden rounded-xl border border-glass-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-glass-border bg-[#111827] text-xs uppercase tracking-wider text-atlas-text-muted">
                    <th className="w-8 px-4 py-3">
                      {/* Status dot column */}
                    </th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Route</th>
                    <th
                      className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                      onClick={() => toggleSort("occurrence_count")}
                    >
                      Hits <SortIcon field="occurrence_count" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 hover:text-atlas-teal"
                      onClick={() => toggleSort("last_seen_at")}
                    >
                      Last Seen <SortIcon field="last_seen_at" />
                    </th>
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
                      <td colSpan={7} className="px-4 py-12 text-center text-atlas-text-secondary">
                        No bugs match the current filters.
                      </td>
                    </tr>
                  )}
                  {filteredBugs.map((bug) => (
                    <Fragment key={bug.id}>
                      <tr
                        className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                          expandedId === bug.id ? "bg-white/[0.02]" : ""
                        }`}
                        onClick={() => setExpandedId(expandedId === bug.id ? null : bug.id)}
                      >
                        {/* Status dot */}
                        <td className="px-4 py-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${statusDot(bug.status)}`} />
                        </td>
                        {/* Title */}
                        <td className="max-w-xs px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-atlas-text-muted">#{bug.bug_number}</span>
                            <span className="truncate font-medium text-atlas-text">{bug.title}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(bug.severity)}`}>
                              {bug.severity}
                            </span>
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor(bug.status)}`}>
                              {bug.status}
                            </span>
                          </div>
                        </td>
                        {/* Source */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {sourceIcon(bug.source)}
                            <span className="text-xs text-atlas-text-secondary">{bug.source || "unknown"}</span>
                          </div>
                        </td>
                        {/* Route */}
                        <td className="px-4 py-3">
                          {bug.page_route ? (
                            <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 text-[11px] text-atlas-teal">
                              {bug.page_route}
                            </code>
                          ) : (
                            <span className="text-xs text-atlas-text-muted">--</span>
                          )}
                        </td>
                        {/* Occurrences */}
                        <td className="px-4 py-3">
                          <span className={`font-mono text-sm font-bold ${bug.occurrence_count > 10 ? "text-amber-400" : bug.occurrence_count > 1 ? "text-atlas-text" : "text-atlas-text-muted"}`}>
                            {bug.occurrence_count || 1}
                          </span>
                        </td>
                        {/* Last Seen */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-atlas-text-muted">
                          {relativeTime(bug.last_seen_at)}
                        </td>
                        {/* Created */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-atlas-text-muted">
                          {relativeTime(bug.created_at)}
                        </td>
                      </tr>
                      {expandedId === bug.id && (
                        <BugDetail
                          key={`detail-${bug.id}`}
                          bug={bug}
                          onUpdate={handleUpdate}
                          updating={updating}
                        />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Report Bug Modal */}
        {showReportModal && (
          <ReportBugModal
            onClose={() => setShowReportModal(false)}
            onSubmit={handleCreate}
            submitting={submitting}
          />
        )}
      </AppShell>
    </FeatureGate>
  );
}
