"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Map,
  RefreshCw,
  Search,
} from "lucide-react";

const SUPA_URL = "https://zoirudjyqfqvpxsrxepr.supabase.co";
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaXJ1ZGp5cWZxdnB4c3J4ZXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzE4MjgsImV4cCI6MjA4MzYwNzgyOH0.6W6OzRfJ-nmKN_23z1OBCS4Cr-ODRq9DJmF_yMwOCfo";

const headers = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
};

const ROADMAP_QUERY = [
  "select=id,project,task_name,phase,status,points,tier,route,initiative,company,priority,difficulty,blocked_by,notes,created_at,updated_at",
  "project=in.(atlas-portal,atlas-backend)",
  "order=updated_at.desc",
].join("&");

const STATUS_ORDER = ["done", "built", "ready", "backlog", "blocked"] as const;

const STATUS_META = {
  done: {
    label: "Done",
    accentText: "text-emerald-400",
    accentSurface: "bg-emerald-500/15 border-emerald-500/30",
    emptyText: "No completed work yet.",
  },
  built: {
    label: "Built",
    accentText: "text-atlas-teal",
    accentSurface: "bg-atlas-teal/15 border-atlas-teal/30",
    emptyText: "Nothing built and awaiting verification.",
  },
  ready: {
    label: "Ready",
    accentText: "text-blue-400",
    accentSurface: "bg-blue-500/15 border-blue-500/30",
    emptyText: "No ready work in queue.",
  },
  backlog: {
    label: "Backlog",
    accentText: "text-slate-300",
    accentSurface: "bg-slate-500/15 border-slate-500/30",
    emptyText: "No backlog items right now.",
  },
  blocked: {
    label: "Blocked",
    accentText: "text-red-400",
    accentSurface: "bg-red-500/15 border-red-500/30",
    emptyText: "Nothing is currently blocked.",
  },
} satisfies Record<
  TaskStatus,
  { label: string; accentText: string; accentSurface: string; emptyText: string }
>;

type TaskStatus = (typeof STATUS_ORDER)[number];
type InitiativeFilter = "all" | string;
type ProjectFilter = "all" | "atlas-portal" | "atlas-backend";

interface ProjectTaskRow {
  id: number;
  project: string;
  task_name: string;
  phase: string | null;
  status: string;
  points: number | null;
  tier: string | null;
  route: string | null;
  initiative: string | null;
  company: string | null;
  priority: string | null;
  difficulty: string | null;
  blocked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function supaFetch<T>(table: string, query = ""): Promise<T[]> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status}`);
  }

  return res.json();
}

function normalizeStatus(status: string): TaskStatus {
  if (STATUS_ORDER.includes(status as TaskStatus)) {
    return status as TaskStatus;
  }

  return "backlog";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();

  if (Number.isNaN(diff)) {
    return "Unknown update";
  }

  if (diff < 60_000) {
    return "Updated just now";
  }

  const mins = Math.floor(diff / 60_000);
  if (mins < 60) {
    return `Updated ${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `Updated ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Updated ${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  return `Updated ${weeks}w ago`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function routeMeta(route: string | null) {
  switch (route) {
    case "codex":
      return {
        label: "Codex",
        className: "border-atlas-teal/30 bg-atlas-teal/15 text-atlas-teal",
      };
    case "claude-code":
      return {
        label: "Claude",
        className: "border-blue-500/30 bg-blue-500/15 text-blue-300",
      };
    case "manual":
      return {
        label: "Manual",
        className: "border-slate-500/30 bg-slate-500/15 text-slate-300",
      };
    case "gemini":
      return {
        label: "Gemini",
        className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
      };
    default:
      return {
        label: formatLabel(route ?? "Unknown"),
        className: "border-glass-border bg-white/5 text-atlas-text-muted",
      };
  }
}

function priorityBorder(priority: string | null) {
  switch (priority) {
    case "high":
      return "border-l-4 border-l-atlas-teal";
    case "low":
      return "border-l-4 border-l-white/10";
    default:
      return "border-l-4 border-l-transparent";
  }
}

function priorityRank(priority: string | null) {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    default:
      return 3;
  }
}

function sortTasks(tasks: ProjectTaskRow[]) {
  return [...tasks].sort((left, right) => {
    const priorityDiff = priorityRank(left.priority) - priorityRank(right.priority);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const pointDiff = (right.points ?? -1) - (left.points ?? -1);
    if (pointDiff !== 0) {
      return pointDiff;
    }

    const updatedDiff = new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    if (updatedDiff !== 0) {
      return updatedDiff;
    }

    return left.task_name.localeCompare(right.task_name);
  });
}

export default function AdminRoadmapPage() {
  const [tasks, setTasks] = useState<ProjectTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initiativeFilter, setInitiativeFilter] = useState<InitiativeFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const roadmapTasks = await supaFetch<ProjectTaskRow>("project_tasks", ROADMAP_QUERY);
      setTasks(roadmapTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roadmap");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const initiatives = useMemo(() => {
    return Array.from(
      new Set(tasks.map((task) => task.initiative).filter(Boolean) as string[])
    )
      .sort((left, right) => left.localeCompare(right));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (initiativeFilter !== "all" && task.initiative !== initiativeFilter) {
        return false;
      }

      if (projectFilter !== "all" && task.project !== projectFilter) {
        return false;
      }

      if (
        searchQuery.trim() &&
        !task.task_name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [initiativeFilter, projectFilter, searchQuery, tasks]);

  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce<Record<TaskStatus, ProjectTaskRow[]>>((groups, status) => {
      groups[status] = sortTasks(
        filteredTasks.filter((task) => normalizeStatus(task.status) === status)
      );
      return groups;
    }, {} as Record<TaskStatus, ProjectTaskRow[]>);
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = groupedTasks.done.length;
    const built = groupedTasks.built.length;
    const ready = groupedTasks.ready.length;
    const pointsRemaining = filteredTasks
      .filter((task) => normalizeStatus(task.status) !== "done")
      .reduce((sum, task) => sum + (task.points ?? 0), 0);

    return { total, done, built, ready, pointsRemaining };
  }, [filteredTasks, groupedTasks]);

  if (loading && tasks.length === 0) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-sm text-atlas-text-secondary">
            Loading roadmap...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 py-2">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
              Admin
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
                  Roadmap
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
                  Product roadmap for Atlas Portal and Atlas Backend. Track what is done, what is built,
                  and what Delphi should expect next.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => void fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-atlas-teal bg-atlas-teal/15 px-4 py-2 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">Total Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-atlas-text">{stats.total}</p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">Done</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              {stats.done}
            </p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">In Progress</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-atlas-teal">
              <Clock className="h-5 w-5" />
              {stats.built}
            </p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">Ready</p>
            <p className="mt-2 text-3xl font-semibold text-blue-400">{stats.ready}</p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">Points Remaining</p>
            <p className="mt-2 text-3xl font-semibold text-atlas-text">{stats.pointsRemaining}</p>
          </div>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex items-center gap-2 text-atlas-text-muted">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Filters</span>
            </div>

            <label className="flex flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-atlas-text-muted sm:max-w-[15rem]">
              Initiative
              <select
                aria-label="Initiative"
                className="rounded-lg border border-glass-border bg-atlas-surface px-3 py-2.5 text-sm font-normal normal-case text-atlas-text focus:border-atlas-teal focus:outline-none"
                value={initiativeFilter}
                onChange={(event) => setInitiativeFilter(event.target.value)}
              >
                <option value="all">All initiatives</option>
                {initiatives.map((initiative) => (
                  <option key={initiative} value={initiative}>
                    {formatLabel(initiative)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-atlas-text-muted sm:max-w-[15rem]">
              Project
              <select
                aria-label="Project"
                className="rounded-lg border border-glass-border bg-atlas-surface px-3 py-2.5 text-sm font-normal normal-case text-atlas-text focus:border-atlas-teal focus:outline-none"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value as ProjectFilter)}
              >
                <option value="all">All projects</option>
                <option value="atlas-portal">Atlas Portal</option>
                <option value="atlas-backend">Atlas Backend</option>
              </select>
            </label>

            <label className="relative flex-1 xl:min-w-[18rem]">
              <span className="sr-only">Search task name</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-muted" />
              <input
                aria-label="Search task name"
                type="search"
                placeholder="Search task names..."
                className="w-full rounded-lg border border-glass-border bg-atlas-surface px-10 py-2.5 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className="text-sm text-atlas-text-secondary">
              {filteredTasks.length} of {tasks.length} tasks visible
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-glass backdrop-blur-xl border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl px-6 py-10 text-center text-sm text-atlas-text-secondary">
            No roadmap tasks found yet. Once `project_tasks` is populated, roadmap items will appear here.
          </div>
        ) : null}

        {tasks.length > 0 && filteredTasks.length === 0 ? (
          <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl px-6 py-10 text-center text-sm text-atlas-text-secondary">
            No roadmap tasks match the current filters.
          </div>
        ) : null}

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {STATUS_ORDER.map((status) => {
              const columnMeta = STATUS_META[status];
              const columnTasks = groupedTasks[status];

              return (
                <section
                  key={status}
                  className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl flex min-h-[30rem] w-[20rem] shrink-0 flex-col"
                >
                  <div className="border-b border-glass-border px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${columnMeta.accentSurface} ${columnMeta.accentText}`}
                      >
                        {columnMeta.label}
                      </span>
                      <span className="text-sm font-medium text-atlas-text-secondary">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-glass-border bg-atlas-surface/60 px-5 py-10 text-center text-sm text-atlas-text-muted">
                        {columnMeta.emptyText}
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const route = routeMeta(task.route);

                        return (
                          <article
                            key={task.id}
                            className={`rounded-2xl border border-glass-border bg-atlas-surface/80 p-4 ${priorityBorder(task.priority)}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-atlas-text-muted">
                                  {formatLabel(task.project)}
                                </p>
                                <h2 className="mt-1 text-sm font-semibold leading-6 text-atlas-text">
                                  {task.task_name}
                                </h2>
                                {task.phase ? (
                                  <p className="mt-1 text-xs text-atlas-text-muted">
                                    {formatLabel(task.phase)}
                                  </p>
                                ) : null}
                              </div>

                              {typeof task.points === "number" ? (
                                <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/15 px-2.5 py-1 text-xs font-semibold text-atlas-teal">
                                  {task.points} pt{task.points === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {task.initiative ? (
                                <span className="rounded-full border border-glass-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-atlas-text-secondary">
                                  {formatLabel(task.initiative)}
                                </span>
                              ) : null}
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${route.className}`}
                              >
                                {route.label}
                              </span>
                            </div>

                            {status === "blocked" && task.blocked_by ? (
                              <p className="mt-3 text-xs leading-5 text-red-300">
                                Blocked by {task.blocked_by}
                              </p>
                            ) : null}

                            <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-atlas-text-muted">
                              <span>{formatLabel(task.priority ?? "medium")} priority</span>
                              <span>{relativeTime(task.updated_at)}</span>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl flex items-start gap-3 px-4 py-4 text-sm text-atlas-text-secondary">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-atlas-teal" />
          <p>
            Built tasks are treated as in-progress until verified. Points remaining only count work that is not
            marked done.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
