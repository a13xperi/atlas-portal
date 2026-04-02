"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import GradientButton from "@/components/ui/GradientButton";
import { Plus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, Alert, AlertSubscription } from "@/lib/api";
import { useAlertSocket } from "@/lib/alertSocket";

const DEFAULT_CATEGORIES = ["DeFi", "AI", "Macro", "L2s", "Stablecoins"];
const DEFAULT_REPORT_TYPES = ["Research", "Earnings", "On-chain analysis"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `~${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `~${hrs}h ago`;
  return `~${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(["DeFi", "AI"])
  );

  const { connected, clearUnread, onNewAlert } = useAlertSocket();

  // Clear unread count when alerts page is visible
  useEffect(() => { clearUnread(); }, [clearUnread]);

  // Listen for live alerts via socket.io
  useEffect(() => {
    return onNewAlert((alert) => {
      setAlerts((prev) => {
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert as Alert, ...prev];
      });
    });
  }, [onNewAlert]);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [alertRes, subRes] = await Promise.all([
        api.alerts.feed(),
        api.alerts.subscriptions(),
      ]);
      setAlerts(alertRes.alerts);
      setSubscriptions(subRes.subscriptions);

      // Sync active categories from subscriptions
      const catSubs = subRes.subscriptions
        .filter((s) => s.type === "CATEGORY" && s.isActive)
        .map((s) => s.value);
      if (catSubs.length > 0) setActiveCategories(new Set(catSubs));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCategory = async (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    // Subscribe if not already subscribed
    if (!activeCategories.has(cat) && user) {
      const existing = subscriptions.find((s) => s.type === "CATEGORY" && s.value === cat);
      if (!existing) {
        try {
          const { subscription } = await api.alerts.subscribe("CATEGORY", cat);
          setSubscriptions((prev) => [...prev, subscription]);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to subscribe");
        }
      }
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const { alerts: newAlerts } = await api.trending.scan();
      setAlerts((prev) => [...newAlerts, ...prev]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to scan");
    } finally {
      setScanning(false);
    }
  };

  // Derive filter lists from subscriptions (fall back to defaults for categories)
  const categories = (() => {
    const catSubs = subscriptions
      .filter((s) => s.type === "CATEGORY")
      .map((s) => s.value);
    if (catSubs.length === 0) return DEFAULT_CATEGORIES;
    const merged = Array.from(new Set(catSubs.concat(DEFAULT_CATEGORIES)));
    return merged;
  })();

  const accounts = subscriptions
    .filter((s) => s.type === "ACCOUNT")
    .map((s) => s.value);

  const reportTypes = (() => {
    const rtSubs = subscriptions
      .filter((s) => s.type === "REPORT_TYPE")
      .map((s) => s.value);
    return rtSubs.length > 0 ? rtSubs : DEFAULT_REPORT_TYPES;
  })();

  const displayAlerts = alerts;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-7rem)]">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-atlas-nav border border-glass-border rounded-2xl p-6 space-y-6 h-fit">
          <h3 className="font-heading text-lg text-atlas-text">
            Your Subscriptions
          </h3>

          {/* Active filter indicator */}
          {activeCategories.size > 0 && (
            <p className="text-xs text-atlas-teal">
              {activeCategories.size} active filter{activeCategories.size !== 1 ? "s" : ""}
            </p>
          )}

          {/* Categories */}
          <div>
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide mb-2">
              Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    activeCategories.has(cat)
                      ? "bg-atlas-teal/20 text-atlas-teal border border-atlas-teal"
                      : "bg-atlas-surface text-atlas-text-secondary border border-glass-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                className="px-3 py-1 rounded-full text-xs text-atlas-teal border border-dashed border-atlas-teal/50"
              >
                <Plus className="w-3 h-3 inline" /> Add
              </button>
            </div>
          </div>

          {/* Accounts */}
          <div>
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide mb-2">
              Accounts
            </p>
            <div className="space-y-2">
              {accounts.length > 0 ? accounts.map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-atlas-surface flex items-center justify-center text-xs text-atlas-text-secondary">
                      {name[0]}
                    </div>
                    <span className="text-sm text-atlas-text">{name}</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-atlas-teal" />
                </div>
              )) : (
                <p className="text-xs text-atlas-text-muted italic">No accounts tracked yet</p>
              )}
              <p className="text-atlas-teal text-xs cursor-pointer hover:underline">
                + Add account
              </p>
            </div>
          </div>

          {/* Report Types */}
          <div>
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide mb-2">
              Report types
            </p>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-atlas-teal" />
                  <span className="text-sm text-atlas-text">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div>
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide mb-2">
              Delivery
            </p>
            <div className="space-y-2">
              {["Portal", "Telegram"].map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-atlas-teal" />
                  <span className="text-sm text-atlas-text">{ch}</span>
                </label>
              ))}
            </div>
            <p className="text-atlas-text-muted text-xs italic mt-2">
              Manage these from Telegram too.
            </p>
          </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 space-y-4">
          {/* Scan Button */}
          <div className="flex items-center justify-between">
            {error && (
            <div role="alert" className="mb-4 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg text-atlas-text">Alert Feed</h2>
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-atlas-success">
                <span className="w-2 h-2 rounded-full bg-atlas-success animate-pulse" />
                <Wifi className="w-3 h-3" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-atlas-text-muted">
                <WifiOff className="w-3 h-3" />
                Polling
              </span>
            )}
          </div>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-atlas-teal/10 text-atlas-teal border border-atlas-teal/30 hover:bg-atlas-teal/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning Twitter…" : "Scan Twitter"}
            </button>
          </div>

          {loading ? (
            <div className="space-y-4" aria-label="Loading alerts">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-atlas-surface border border-glass-border rounded-2xl p-6 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-28 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            displayAlerts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <p className="text-atlas-text-secondary text-sm">No alerts yet. Enable subscriptions to start receiving alerts about your tracked topics.</p>
              </div>
            ) : displayAlerts.map((alert) => (
              <div key={alert.id} className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-atlas-text">{alert.type}</span>
                    {(alert as any).sentiment && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        (alert as any).sentiment === "bullish" ? "bg-atlas-success/15 text-atlas-success" :
                        (alert as any).sentiment === "bearish" ? "bg-atlas-error/15 text-atlas-error" :
                        "bg-atlas-warning/15 text-atlas-warning"
                      }`}>
                        {(alert as any).sentiment}
                      </span>
                    )}
                  </div>
                  <StatusPill label={timeAgo(alert.createdAt).replace("~", "").replace(" ago", "")} variant="speed" />
                </div>
                <p className="text-sm text-atlas-text-secondary mb-2 pl-3 border-l-2 border-glass-border">
                  {alert.context || alert.title}
                </p>
                {alert.draftReply && (
                  <p className="text-sm text-atlas-text mb-3">{alert.draftReply}</p>
                )}
                <p className="text-xs text-atlas-text-muted mb-4">
                  Reply opportunity — {timeAgo(alert.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <GradientButton variant="outline-teal">Reply now</GradientButton>
                  <GradientButton variant="outline-teal">Post as new</GradientButton>
                  <GradientButton variant="outline-teal">Edit in Crafting Station</GradientButton>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-3 sm:gap-0">
            <select className="bg-atlas-surface border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none">
              <option>Showing: All alerts</option>
              <option>Big accounts only</option>
              <option>Trending topics</option>
              <option>Reports</option>
            </select>
            <div className="flex gap-4">
              <button type="button" className="text-atlas-teal text-sm hover:underline">
                Mark all as read
              </button>
              <button type="button" className="text-atlas-text-secondary text-sm hover:text-atlas-text">
                Pause alerts for 1 hour
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
