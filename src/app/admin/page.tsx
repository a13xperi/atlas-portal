"use client";

import Link from "next/link";
import { Palette, ClipboardCheck, Bug, Map, BarChart3, Shield, Terminal } from "lucide-react";
import ResetMeButton from "@/components/admin/ResetMeButton";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";

const adminTools = [
  {
    label: "Style Tile",
    description: "Unified design system reference — colors, typography, components, patterns",
    href: "/admin/style-tile",
    icon: Palette,
  },
  {
    label: "QA Checklist",
    description: "Manual testing checklist for all pages and flows",
    href: "/admin/qa",
    icon: ClipboardCheck,
  },
  {
    label: "Bug & Test Tracker",
    description: "Internal bug tracker with severity and status",
    href: "/admin/bugs",
    icon: Bug,
  },
  {
    label: "Roadmap",
    description: "Product roadmap — what's shipping, what's next, what's done",
    href: "/admin/roadmap",
    icon: Map,
  },
  {
    label: "Platform Dashboard",
    description: "Usage analytics, team activity, and feature adoption",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    label: "Control Panel",
    description: "Feature flags, user management, and usage analytics",
    href: "/admin/control",
    icon: Shield,
  },
  {
    label: "Prompt Inspector",
    description: "Every Claude prompt in Atlas -- templates, variables, live test runs",
    href: "/admin/prompts",
    icon: Terminal,
  },
  {
    label: "Public Roadmap",
    description: "Public feature roadmap — shipped, in progress, planned",
    href: "/roadmap",
    icon: Map,
  },
];

export default function AdminPage() {
  return (
    <FeatureGate flagKey="super_admin">
      <AppShell>
        <div className="max-w-2xl mx-auto py-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-text-muted mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-bold text-atlas-text mb-8">Internal Tools</h1>
          <div className="flex flex-col gap-4">
            {adminTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="glass-card p-6 flex items-center gap-5 card-interactive group"
                >
                  <div className="w-10 h-10 rounded-xl bg-atlas-surface border border-glass-border flex items-center justify-center text-atlas-teal group-hover:border-atlas-teal/30 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-atlas-text">{tool.label}</div>
                    <div className="text-xs text-atlas-text-secondary mt-0.5">{tool.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          <ResetMeButton />
        </div>
      </AppShell>
    </FeatureGate>
  );
}
