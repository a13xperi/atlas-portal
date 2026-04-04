import Link from "next/link";
import { Palette, ClipboardCheck } from "lucide-react";

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
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-atlas-bg px-6 py-20">
      <div className="max-w-2xl mx-auto">
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
      </div>
    </div>
  );
}
