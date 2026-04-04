"use client";

import { Activity, Trash2 } from "lucide-react";
import type { NlpMonitor } from "@/lib/api";

interface MonitorCardProps {
  monitor: NlpMonitor;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export default function MonitorCard({ monitor, onToggle, onDelete }: MonitorCardProps) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 shrink-0 text-atlas-teal" />
            <h3 className="truncate text-sm font-semibold text-atlas-text">{monitor.name}</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {monitor.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-atlas-teal/10 px-2 py-0.5 text-[10px] font-medium text-atlas-teal"
              >
                {kw}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-atlas-text-muted">
            {monitor.matchCount} matches &middot; {monitor.delivery.join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(monitor.id, !monitor.isActive)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              monitor.isActive
                ? "bg-atlas-success/20 text-atlas-success"
                : "bg-atlas-text-muted/20 text-atlas-text-muted"
            }`}
          >
            {monitor.isActive ? "Active" : "Paused"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(monitor.id)}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
