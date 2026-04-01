"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import GradientButton from "@/components/ui/GradientButton";
import { Plus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, Alert, AlertSubscription } from "@/lib/api";

const categories = ["DeFi", "AI", "Macro", "L2s", "Stablecoins"];
const accounts = ["Vitalik", "CZ", "Cobie", "Hasu"];
const reportTypes = ["Research", "Earnings", "On-chain analysis"];

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
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(["DeFi", "AI"])
  );

  const loadData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [alertRes, subRes] = await Promise.all([
        api.alerts.feed(token),
        api.alerts.subscriptions(token),
      ]);
      setAlerts(alertRes.alerts);
      setSubscriptions(subRes.subscriptions);

      // Sync active categories from subscriptions
      const catSubs = subRes.subscriptions
        .filter((s) => s.type === "CATEGORY" && s.isActive)
        .map((s) => s.value);
      if (catSubs.length > 0) setActiveCategories(new Set(catSubs));
    } catch (e: any) {
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCategory = async (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    // Subscribe if not already subscribed
    if (!activeCategories.has(cat) && token) {
      const existing = subscriptions.find((s) => s.type === "CATEGORY" && s.value === cat);
      if (!existing) {
        try {
          const { subscription } = await api.alerts.subscribe(token, "CATEGORY", cat);
          setSubscriptions((prev) => [...prev, subscription]);
        } catch (e: any) {
          setError(e.message || "Failed to subscribe");
        }
      }
    }
  };

  const handleScan = async () => {
    if (!token) return;
    setScanning(true);
    try {
      const { alerts: newAlerts } = await api.trending.scan(token);
      setAlerts((prev) => [...newAlerts, ...prev]);
    } catch (e: any) {
      setError(e.message || "Failed to scan");
    } finally {
      setScanning(false);
    }
  };

  // Use real alerts if available, fall back to static samples
  const staticAlerts = [
    { id: "s1", type: "Big account posted", title: "@VitalikButerin just dropped a thread on enshrined PBS.", context: "@VitalikButerin just dropped a thread on enshrined PBS.", draftReply: "Vitalik's PBS take is interesting but misses the centralizing force of builder auctions. The real question is whether inclusion lists can fix it.", createdAt: new Date(Date.now() - 4 * 60000).toISOString() },
    { id: "s2", type: "Trending topic", title: "#EigenLayer restaking TVL just crossed $10B.", context: "#EigenLayer restaking TVL just crossed $10B.", draftReply: "EigenLayer at $10B TVL but nobody's stress-testing the slashing conditions. This is 2021 yield farming energy all over again.", createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: "s3", type: "New report dropped", title: "Delphi Research: 'State of L2 Sequencing' published.", context: "Delphi Research: 'State of L2 Sequencing' published.", draftReply: "New Delphi report on L2 sequencing is a must-read. 3-thread summary incoming.", createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
  ];

  const displayAlerts = alerts.length > 0 ? alerts : staticAlerts;

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
              {accounts.map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-atlas-surface flex items-center justify-center text-xs text-atlas-text-secondary">
                      {name[0]}
                    </div>
                    <span className="text-sm text-atlas-text">{name}</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-atlas-teal" />
                </div>
              ))}
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
          <h2 className="font-heading text-lg text-atlas-text">Alert Feed</h2>
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
            displayAlerts.map((alert) => (
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
