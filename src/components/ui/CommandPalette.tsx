"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, PenTool, Bell, BarChart3, Mic2, BookOpen, Send, Users, Star, StarOff, FlaskConical, ClipboardCheck, Trophy, Sparkles, CalendarClock } from "lucide-react";
import { useDemoMode } from "@/lib/demo-mode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
  close: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

// ─── Provider + Palette ───────────────────────────────────────────────────────

const FAVORITES_KEY = "atlas:cmd:favorites";

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(ids)));
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  // Global Cmd+K / Ctrl+K and Cmd+J / Ctrl+J listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) { setQuery(""); return false; }
          setQuery("");
          setActiveIndex(0);
          return true;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        // Cmd+J opens Oracle directly — dispatch custom event
        window.dispatchEvent(new CustomEvent("atlas:open-oracle"));
        closePalette();
      }
      if (e.key === "Escape") closePalette();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closePalette]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const navigate = useCallback((href: string) => {
    closePalette();
    router.push(href);
  }, [closePalette, router]);

  const allCommands: Command[] = [
    { id: "ask-oracle", label: "Ask Oracle", description: "Open the Oracle AI assistant", icon: Sparkles, action: () => {
      closePalette();
      window.dispatchEvent(new CustomEvent("atlas:open-oracle"));
    }, keywords: "oracle ai assistant copilot chat help" },
    { id: "dashboard", label: "Dashboard", description: "Your hub", icon: LayoutDashboard, action: () => navigate("/dashboard"), keywords: "home hub" },
    { id: "crafting", label: "Crafting Station", description: "Draft & generate tweets", icon: PenTool, action: () => navigate("/crafting"), keywords: "tweet draft write" },
    { id: "alerts", label: "Alerts + Momentum", description: "Live alerts feed", icon: Bell, action: () => navigate("/alerts"), keywords: "notifications feed trending" },
    { id: "analytics", label: "Analytics", description: "Performance metrics", icon: BarChart3, action: () => navigate("/analytics"), keywords: "stats data chart" },
    { id: "voice-profiles", label: "Voice Profiles", description: "Manage your tone", icon: Mic2, action: () => navigate("/voice-profiles"), keywords: "voice tone blend" },
    { id: "team-library", label: "Team Library", description: "Approved style cards", icon: BookOpen, action: () => navigate("/team-library"), keywords: "library styles" },
    { id: "management", label: "Team Management", description: "Manage analysts", icon: Users, action: () => navigate("/management"), keywords: "team kpi leaderboard" },
    { id: "telegram", label: "Telegram Setup", description: "Bot configuration guide", icon: Send, action: () => navigate("/telegram"), keywords: "bot notifications" },
    { id: "demo-mode", label: "Toggle Demo Mode", description: isDemoMode ? "Switch to live data" : "Switch to demo data", icon: FlaskConical, action: () => { toggleDemoMode(); closePalette(); }, keywords: "demo mock sample live toggle" },
    { id: "qa", label: "QA Test Runner", description: "Manual testing panel", icon: ClipboardCheck, action: () => navigate("/admin/qa"), keywords: "qa test quality testing admin panel manual" },
    { id: "arena", label: "Arena", description: "Competitive scoreboard", icon: Trophy, action: () => navigate("/arena"), keywords: "arena leaderboard score compete ranking" },
    { id: "campaigns", label: "Campaigns", description: "Posting queue & threads", icon: CalendarClock, action: () => navigate("/campaigns"), keywords: "campaign queue schedule thread post" },
    { id: "onboarding", label: "Oracle Onboarding", description: "Re-run onboarding flow", icon: Sparkles, action: () => navigate("/onboarding"), keywords: "oracle onboarding setup voice wizard" },
  ];

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const favoriteCommands = allCommands.filter((c) => favorites.has(c.id));
  const filtered = query
    ? allCommands.filter((c) =>
        `${c.label} ${c.description ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Build "Ask Oracle: [query]" fallback command when query doesn't match well
  const oracleFallback: Command | null =
    query.trim().length > 0
      ? {
          id: "oracle-query-fallback",
          label: `Ask Oracle: "${query}"`,
          description: "Send this to the Oracle AI assistant",
          icon: Sparkles,
          action: () => {
            const q = query.trim();
            closePalette();
            window.dispatchEvent(
              new CustomEvent("atlas:open-oracle-with-query", { detail: q }),
            );
          },
          keywords: "",
        }
      : null;

  // Append oracle fallback to filtered results
  const filteredWithFallback = oracleFallback
    ? [...filtered, oracleFallback]
    : filtered;

  const sections: { heading?: string; items: Command[] }[] = query
    ? [{ items: filteredWithFallback }]
    : [
        ...(favoriteCommands.length > 0 ? [{ heading: "Favorites", items: favoriteCommands }] : []),
        { heading: favoriteCommands.length > 0 ? "All Pages" : undefined, items: allCommands },
      ];

  const flatItems = sections.flatMap((s) => s.items);

  // Keyboard nav within palette
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatItems[activeIndex]?.action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, flatItems, activeIndex]);

  // Reset active index when query changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  let flatIndex = 0;

  return (
    <CommandPaletteContext.Provider value={{ open: openPalette, close: closePalette }}>
      {children}

      {/* Oracle bridge — listens for custom events from Cmd+J / Ask Oracle */}
      <OracleBridge />

      {isOpen && (
        <div
          id="command-palette"
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closePalette}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-atlas-nav border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
              <Search className="w-4 h-4 text-atlas-text-muted shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and actions…"
                className="flex-1 bg-transparent text-sm text-atlas-text placeholder:text-atlas-text-muted outline-none"
                aria-label="Search commands"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-glass-border text-[10px] text-atlas-text-muted font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2" aria-label="Commands">
              {sections.map((section) => (
                <div key={section.heading ?? "default"}>
                  {section.heading && (
                    <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-atlas-text-muted">
                      {section.heading}
                    </p>
                  )}
                  {section.items.map((cmd) => {
                    const idx = flatIndex++;
                    const isActive = idx === activeIndex;
                    const isFallback = cmd.id === "oracle-query-fallback";
                    return (
                      <div
                        key={cmd.id}
                        className={`group flex items-center gap-2 px-2 ${
                          isFallback ? "border-t border-glass-border/50 mt-1 pt-1" : ""
                        } ${
                          isActive ? "bg-atlas-teal/10" : "hover:bg-white/5"
                        }`}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <button
                          type="button"
                          onClick={cmd.action}
                          className="flex flex-1 items-center gap-3 px-2 py-2.5 text-left transition-colors"
                        >
                          <cmd.icon
                            aria-hidden="true"
                            className={`w-4 h-4 shrink-0 ${
                              isFallback
                                ? "text-atlas-teal"
                                : isActive
                                  ? "text-atlas-teal"
                                  : "text-atlas-text-muted"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${
                              isFallback
                                ? "text-atlas-teal"
                                : isActive
                                  ? "text-atlas-text"
                                  : "text-atlas-text-secondary"
                            }`}>
                              {cmd.label}
                            </p>
                            {cmd.description && (
                              <p className="text-xs text-atlas-text-muted truncate">{cmd.description}</p>
                            )}
                          </div>
                        </button>
                        {!isFallback && (
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(cmd.id, e)}
                            aria-label={favorites.has(cmd.id) ? "Remove from favorites" : "Add to favorites"}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                          >
                            {favorites.has(cmd.id)
                              ? <Star className="w-3.5 h-3.5 text-atlas-warning fill-atlas-warning" aria-hidden="true" />
                              : <StarOff className="w-3.5 h-3.5 text-atlas-text-muted" aria-hidden="true" />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {query && filtered.length === 0 && !oracleFallback && (
                <p className="px-4 py-6 text-center text-sm text-atlas-text-muted">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-glass-border flex items-center gap-4 text-[10px] text-atlas-text-muted">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">⌘K</kbd> toggle</span>
              <span><kbd className="font-mono">⌘J</kbd> oracle</span>
              <span className="ml-auto"><Star className="w-3 h-3 inline mr-0.5 fill-atlas-warning text-atlas-warning" aria-hidden="true" /> pin favorite</span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}

/**
 * Bridge component that listens for custom DOM events and calls OracleAgent context.
 * Rendered inside CommandPaletteProvider but needs OracleAgentProvider to be an ancestor.
 * Since CommandPalette is above OracleAgentProvider in the tree, we use a try/catch
 * and DOM events as the bridge mechanism — the actual context call happens in
 * FloatingOracle or any component inside OracleAgentProvider.
 */
function OracleBridge() {
  useEffect(() => {
    // These events are caught by a listener inside OracleAgentProvider's tree.
    // This component just ensures the events are dispatched correctly.
    // The actual handling happens via window event listeners in the Oracle provider tree.
    return () => {};
  }, []);
  return null;
}
