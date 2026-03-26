"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import GradientButton from "@/components/ui/GradientButton";
import { Plus } from "lucide-react";

const categories = ["DeFi", "AI", "Macro", "L2s", "Stablecoins"];
const accounts = ["Vitalik", "CZ", "Cobie", "Hasu"];
const reportTypes = ["Research", "Earnings", "On-chain analysis"];

const alertCards = [
  {
    type: "Big account posted",
    context: "@VitalikButerin just dropped a thread on enshrined PBS.",
    draft:
      "Vitalik's PBS take is interesting but misses the centralizing force of builder auctions. The real question is whether inclusion lists can fix it.",
    time: "~4 min ago",
    pillLabel: "4 min",
  },
  {
    type: "Trending topic",
    context: "#EigenLayer restaking TVL just crossed $10B.",
    draft:
      "EigenLayer at $10B TVL but nobody's stress-testing the slashing conditions. This is 2021 yield farming energy all over again.",
    time: "~12 min ago",
    pillLabel: "12 min",
  },
  {
    type: "New report dropped",
    context: "Delphi Research: 'State of L2 Sequencing' published.",
    draft:
      "New Delphi report on L2 sequencing is a must-read. 3-thread summary incoming.",
    time: "~25 min ago",
    pillLabel: "25 min",
  },
];

export default function AlertsPage() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(["DeFi", "AI"])
  );

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-7rem)]">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-atlas-nav border border-glass-border rounded-2xl p-6 space-y-6 h-fit">
          <h3 className="font-heading text-lg text-atlas-text">
            Your Subscriptions
          </h3>

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
                <div
                  key={name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-atlas-surface flex items-center justify-center text-xs text-atlas-text-secondary">
                      {name[0]}
                    </div>
                    <span className="text-sm text-atlas-text">{name}</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-atlas-teal"
                  />
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
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-atlas-teal"
                  />
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
                <label
                  key={ch}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-atlas-teal"
                  />
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
          {alertCards.map((alert, i) => (
            <div
              key={i}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-atlas-text">
                  {alert.type}
                </span>
                <StatusPill label={alert.pillLabel} variant="speed" />
              </div>
              <p className="text-sm text-atlas-text-secondary mb-2 pl-3 border-l-2 border-glass-border">
                {alert.context}
              </p>
              <p className="text-sm text-atlas-text mb-3">{alert.draft}</p>
              <p className="text-xs text-atlas-text-muted mb-4">
                Reply opportunity — {alert.time}
              </p>
              <div className="flex flex-wrap gap-2">
                <GradientButton variant="outline-teal">
                  Reply now
                </GradientButton>
                <GradientButton variant="outline-teal">
                  Post as new
                </GradientButton>
                <GradientButton variant="outline-teal">
                  Edit in Crafting Station
                </GradientButton>
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}

          {/* Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-3 sm:gap-0">
            <select className="bg-atlas-surface border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none">
              <option>Showing: All alerts</option>
              <option>Big accounts only</option>
              <option>Trending topics</option>
              <option>Reports</option>
            </select>
            <div className="flex gap-4">
              <button
                type="button"
                className="text-atlas-teal text-sm hover:underline"
              >
                Mark all as read
              </button>
              <button
                type="button"
                className="text-atlas-text-secondary text-sm hover:text-atlas-text"
              >
                Pause alerts for 1 hour
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
