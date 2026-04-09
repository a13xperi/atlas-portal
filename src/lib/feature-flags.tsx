"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Flag definitions — must match the Super Admin control panel keys exactly
// ---------------------------------------------------------------------------

type FlagScope = "everyone" | "managers" | "admins";

interface FlagDef {
  key: string;
  scope: FlagScope;
  defaultEnabled: boolean;
  /** Route paths gated by this flag — used for nav filtering */
  routes?: string[];
}

const FLAG_DEFS: FlagDef[] = [
  { key: "crafting_station", scope: "everyone", defaultEnabled: true, routes: ["/crafting"] },
  { key: "voice_lab", scope: "everyone", defaultEnabled: true, routes: ["/voice-profiles"] },
  { key: "arena", scope: "everyone", defaultEnabled: true, routes: ["/arena"] },
  { key: "campaigns", scope: "everyone", defaultEnabled: true, routes: ["/campaigns"] },
  { key: "queue", scope: "everyone", defaultEnabled: true, routes: ["/queue"] },
  { key: "analytics_advanced", scope: "managers", defaultEnabled: true, routes: ["/analytics"] },
  { key: "signals", scope: "managers", defaultEnabled: true, routes: ["/alerts"] },
  { key: "telegram_bot", scope: "everyone", defaultEnabled: false, routes: ["/telegram"] },
  { key: "tweet_tinder", scope: "everyone", defaultEnabled: false },
  { key: "multi_model", scope: "admins", defaultEnabled: false },
  { key: "super_admin", scope: "admins", defaultEnabled: true, routes: ["/admin", "/admin/control", "/admin/qa", "/admin/bugs", "/admin/style-tile"] },
];

const STORAGE_KEY = "atlas-feature-flags";

// Build a map for O(1) lookups
const FLAG_MAP = new Map<string, FlagDef>(FLAG_DEFS.map((f) => [f.key, f]));

// Build route → flagKey index for fast route checks
const ROUTE_FLAG_MAP = new Map<string, string>();
for (const def of FLAG_DEFS) {
  for (const route of def.routes ?? []) {
    ROUTE_FLAG_MAP.set(route, def.key);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserRole = "ANALYST" | "MANAGER" | "ADMIN";

function roleAtLeast(role: UserRole | undefined, required: FlagScope): boolean {
  if (required === "everyone") return true;
  if (!role) return false;
  if (required === "managers") return role === "MANAGER" || role === "ADMIN";
  if (required === "admins") return role === "ADMIN";
  return false;
}

function readStoredFlags(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return {};
  } catch {
    return {};
  }
}

function resolveFlags(): Record<string, boolean> {
  const stored = readStoredFlags();
  const resolved: Record<string, boolean> = {};
  for (const def of FLAG_DEFS) {
    resolved[def.key] = stored[def.key] ?? def.defaultEnabled;
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FeatureFlagContextValue {
  /** Check if a flag is enabled for the current user's role */
  isEnabled: (flagKey: string) => boolean;
  /** Raw flag states (for admin panel) */
  flags: Record<string, boolean>;
  /** Loading state — true until flags + user role are resolved */
  loading: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  isEnabled: () => true,
  flags: {},
  loading: true,
});

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagsReady, setFlagsReady] = useState(false);

  // Read flags from localStorage on mount
  useEffect(() => {
    setFlags(resolveFlags());
    setFlagsReady(true);
  }, []);

  // Listen for storage changes (e.g. admin panel in another tab)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFlags(resolveFlags());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loading = !flagsReady || authLoading;

  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      const def = FLAG_MAP.get(flagKey);
      // Unknown flag — don't block
      if (!def) return true;

      // Check toggle state
      const toggled = flags[flagKey] ?? def.defaultEnabled;
      if (!toggled) return false;

      // Check scope against user role
      return roleAtLeast(user?.role, def.scope);
    },
    [flags, user?.role],
  );

  const value = useMemo<FeatureFlagContextValue>(
    () => ({ isEnabled, flags, loading }),
    [isEnabled, flags, loading],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Route-level hook
// ---------------------------------------------------------------------------

/** Check if a route path is enabled for the current user */
export function useRouteEnabled(): (path: string) => boolean {
  const { isEnabled } = useFeatureFlags();

  return useCallback(
    (path: string): boolean => {
      const flagKey = ROUTE_FLAG_MAP.get(path);
      // No flag gates this route — enabled by default
      if (!flagKey) return true;
      return isEnabled(flagKey);
    },
    [isEnabled],
  );
}
