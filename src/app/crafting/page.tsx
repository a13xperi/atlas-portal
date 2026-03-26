"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import ContentInput from "@/components/ui/ContentInput";
import GradientButton from "@/components/ui/GradientButton";
import { Mic } from "lucide-react";
import Link from "next/link";

const versionTabs = ["Version 1", "Version 2", "Version 3"];

export default function CraftingPage() {
  const [activeVersion, setActiveVersion] = useState(0);
  const [blendValue, setBlendValue] = useState(30);

  return (
    <AppShell>
      {/* Usage Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-atlas-surface border border-glass-border rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 gap-3 sm:gap-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <svg className="w-10 h-10 shrink-0" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#2d3748"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#4ecdc4"
              strokeWidth="3"
              strokeDasharray={`${0.7 * 100.5} ${100.5}`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-atlas-text-secondary">
            <span>Feedback given: 12 this week</span>
            <span>Drafts refined: 8</span>
          </div>
        </div>
        <Link
          href="/analytics"
          className="text-atlas-teal text-sm hover:underline shrink-0"
        >
          View full analytics →
        </Link>
      </div>

      {/* Content Input Zone */}
      <div className="mt-6">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Feed Atlas content — it crafts the tweet in your voice.
        </label>
        <div className="mt-3">
          <ContentInput />
        </div>
      </div>

      {/* Voice Controls */}
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-6 py-3">
        <select className="bg-atlas-nav border border-glass-border rounded-lg px-3 py-2 text-sm text-atlas-text focus:outline-none focus:border-atlas-teal">
          <option>My voice</option>
          <option>Blended</option>
          <option>Specific person</option>
        </select>
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-sm text-atlas-text-secondary shrink-0">
            Blend:
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={blendValue}
            onChange={(e) => setBlendValue(Number(e.target.value))}
            className="flex-1 accent-atlas-teal"
          />
          <span className="text-sm text-atlas-text w-10 text-right">
            {blendValue}%
          </span>
        </div>
        <button
          type="button"
          className="text-atlas-teal text-sm hover:underline shrink-0"
        >
          Share this style with team
        </button>
      </div>

      {/* Draft Preview */}
      <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-6">
        <p className="text-atlas-text leading-relaxed">
          ETH staking yields are compressing fast. The easy alpha is gone — now
          it&apos;s about execution risk and DVT adoption. Most people won&apos;t
          notice until the window closes. Don&apos;t be most people.
        </p>
      </div>

      {/* Indicators */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-atlas-surface border border-glass-border border-l-4 border-l-atlas-success rounded-2xl p-4">
          <p className="text-atlas-text-secondary text-xs uppercase tracking-wider">Confidence</p>
          <p className="text-atlas-success font-heading text-2xl font-bold">87%</p>
        </div>
        <div className="bg-atlas-surface border border-glass-border border-l-4 border-l-atlas-teal rounded-2xl p-4">
          <p className="text-atlas-text-secondary text-xs uppercase tracking-wider">
            Predicted engagement
          </p>
          <p className="text-atlas-teal font-heading text-2xl font-bold">~2.4K</p>
        </div>
      </div>

      {/* Version Tabs */}
      <div className="mt-6 flex gap-2">
        {versionTabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveVersion(i)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeVersion === i
                ? "text-atlas-teal border-b-2 border-atlas-teal"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <GradientButton variant="outline-success">Ship it</GradientButton>
        <GradientButton variant="outline-warning">
          Not quite — tell me what&apos;s off
        </GradientButton>
        <GradientButton variant="outline-teal">Try again</GradientButton>
      </div>

      {/* Feedback */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tell me what's off — type or drop a voice note."
            className="flex-1 bg-atlas-surface rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-glass-border focus:outline-none focus:border-atlas-teal"
          />
          <button
            type="button"
            className="p-3 bg-atlas-surface rounded-lg border border-glass-border text-atlas-text-secondary hover:text-atlas-teal transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
        <p className="text-atlas-text-muted text-sm italic mt-2">
          Don&apos;t worry about hurting my feelings.
        </p>
      </div>
    </AppShell>
  );
}
