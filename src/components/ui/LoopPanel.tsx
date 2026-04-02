"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Activity, GitBranch, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, LoopState } from "@/lib/api";
import StatusPill from "@/components/ui/StatusPill";
import ProgressBar from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";

const statusPillMap: Record<LoopState["status"], { label: string; variant: "speed" | "posted" | "error" | "draft" }> = {
  running: { label: "Running", variant: "speed" },
  completed: { label: "Completed", variant: "posted" },
  failed: { label: "Failed", variant: "error" },
  idle: { label: "Idle", variant: "draft" },
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LoopPanelSkeleton() {
  return (
    <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-1 w-full mt-2" />
        </div>
        <div className="bg-atlas-bg/50 rounded-xl p-4 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function LoopPanel() {
  const { token } = useAuth();
  const [loopState, setLoopState] = useState<LoopState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prCreating, setPrCreating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.loop.state();
      setLoopState(res.loop);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load loop state";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!loopState) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    let interval: number;
    if (loopState.status === "running") {
      interval = 5_000;
    } else if (loopState.status === "idle" || loopState.status === "completed") {
      interval = 30_000;
    } else {
      return; // no polling for failed
    }

    intervalRef.current = setInterval(fetchState, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loopState?.status, fetchState]);

  const handleCreatePR = async () => {
    if (!token || !loopState?.bestIteration) return;
    setPrCreating(true);
    try {
      const res = await api.loop.createPR(loopState.bestIteration.branch, loopState.taskId);
      setPrUrl(res.prUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create PR";
      setError(message);
    } finally {
      setPrCreating(false);
    }
  };

  if (loading) return <LoopPanelSkeleton />;

  if (error && !loopState) {
    return (
      <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
        <div className="flex items-center gap-3 text-atlas-error text-sm">
          <Activity className="h-4 w-4" />
          <span>Unable to load loop status</span>
          <button onClick={fetchState} className="text-atlas-teal hover:underline ml-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!loopState || (loopState.status === "idle" && loopState.iterations.length === 0)) {
    return (
      <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-atlas-text-muted" />
          <div>
            <p className="text-atlas-text-secondary text-sm">No active research loop</p>
            <p className="text-atlas-text-muted text-xs mt-0.5">Start one from the CLI with /loop-start</p>
          </div>
        </div>
      </div>
    );
  }

  const { status, taskId, evalType, startedAt, iterations, currentIteration, maxIterations, bestIteration } = loopState;
  const pillConfig = statusPillMap[status];
  const maxScore = Math.max(...iterations.map((i) => i.score), 1);

  return (
    <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Activity className={`h-5 w-5 text-atlas-teal ${status === "running" ? "animate-pulse" : ""}`} />
          <h3 className="font-heading text-lg text-atlas-text">Mission Control</h3>
        </div>
        <StatusPill label={pillConfig.label} variant={pillConfig.variant} />
      </div>
      <p className="text-atlas-text-muted text-xs mb-5">
        {taskId && <span>{taskId}</span>}
        {evalType && <span> | {evalType}</span>}
        {startedAt && <span> | Started {formatRelativeTime(startedAt)}</span>}
      </p>

      {error && (
        <div className="text-atlas-error text-xs mb-4">
          {error}
          <button onClick={fetchState} className="text-atlas-teal hover:underline ml-2">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        {/* Left: iteration chart */}
        <div>
          <p className="text-atlas-text-secondary text-xs uppercase tracking-wider mb-3">Iteration Scores</p>
          <div className="space-y-2">
            {iterations.map((iter) => {
              const isBest = bestIteration?.iteration === iter.iteration;
              const widthPct = Math.max((iter.score / maxScore) * 100, 8);
              return (
                <div key={iter.iteration} className="flex items-center gap-3">
                  <span className="text-atlas-text-muted text-xs w-4 text-right">{iter.iteration}</span>
                  <div className="flex-1 relative">
                    <div
                      className={`h-6 rounded-r-lg flex items-center justify-end pr-2 transition-all duration-300 ${
                        isBest ? "bg-atlas-teal" : "bg-atlas-steel/40"
                      }`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-xs text-white font-medium">{iter.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {maxIterations > 0 && (
            <div className="mt-4">
              <ProgressBar currentStep={currentIteration} totalSteps={maxIterations} />
              <p className="text-atlas-text-muted text-xs mt-1 text-center">
                {currentIteration} / {maxIterations} iterations
              </p>
            </div>
          )}
        </div>

        {/* Right: best branch + PR button */}
        {bestIteration && (
          <div className="bg-atlas-bg/50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <p className="text-atlas-text-secondary text-xs uppercase tracking-wider mb-2">Best Branch</p>
              <p className="text-2xl font-semibold text-atlas-text">
                Iteration #{bestIteration.iteration}
              </p>
              <p className="text-atlas-teal text-lg">{bestIteration.score} pts</p>
              <div className="flex items-center gap-1.5 mt-2">
                <GitBranch className="h-3 w-3 text-atlas-teal" />
                <p className="font-mono text-xs text-atlas-teal truncate">{bestIteration.branch}</p>
              </div>
            </div>

            <div className="mt-4">
              {prUrl ? (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-atlas-success/20 text-atlas-success text-sm font-medium hover:bg-atlas-success/30 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View PR
                </a>
              ) : (
                <button
                  onClick={handleCreatePR}
                  disabled={status !== "completed" || prCreating}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  {prCreating ? "Creating..." : "Create PR"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
