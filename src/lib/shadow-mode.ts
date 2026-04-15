"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export const SHADOW_SECTIONS = {
  "voice-tinder": false,
  "voice-library-v2": false,
  "crafting-selector": false,
} as const;

export type ShadowSectionKey = keyof typeof SHADOW_SECTIONS;

const STORAGE_KEY = "atlas-shadow-config";

function readStoredConfig(): Record<ShadowSectionKey, boolean> {
  if (typeof window === "undefined") return { ...SHADOW_SECTIONS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...SHADOW_SECTIONS };
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const merged: Record<ShadowSectionKey, boolean> = { ...SHADOW_SECTIONS };
      (Object.keys(SHADOW_SECTIONS) as ShadowSectionKey[]).forEach((key) => {
        if (typeof parsed[key] === "boolean") {
          merged[key] = parsed[key];
        }
      });
      return merged;
    }
  } catch {
    // ignore parse errors
  }
  return { ...SHADOW_SECTIONS };
}

function writeStoredConfig(config: Record<ShadowSectionKey, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export interface UseShadowModeResult {
  /** true when the current user has ADMIN role */
  isAdmin: boolean;
  /** Check whether a section is currently shadowed (hidden from non-admins) */
  isShadowed: (key: ShadowSectionKey) => boolean;
  /** Toggle a section between shadowed and live */
  toggleSection: (key: ShadowSectionKey) => void;
  /** All section keys with their current shadow state */
  allSections: Record<ShadowSectionKey, boolean>;
}

export function useShadowMode(): UseShadowModeResult {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [config, setConfig] = useState<Record<ShadowSectionKey, boolean>>(() => readStoredConfig());

  // Listen for changes from other tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setConfig(readStoredConfig());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isShadowed = useCallback(
    (key: ShadowSectionKey) => config[key] ?? SHADOW_SECTIONS[key],
    [config]
  );

  const toggleSection = useCallback((key: ShadowSectionKey) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeStoredConfig(next);
      return next;
    });
  }, []);

  const allSections = useMemo(() => ({ ...config }), [config]);

  return useMemo(
    () => ({ isAdmin, isShadowed, toggleSection, allSections }),
    [isAdmin, isShadowed, toggleSection, allSections]
  );
}
