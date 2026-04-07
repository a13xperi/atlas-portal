"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setDemoMode as setApiDemoMode } from "./api";

const STORAGE_KEY = "atlas_demo_mode";

interface DemoModeContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  /** Set demo mode on/off without reloading — used by tour system. */
  setDemoModeQuiet: (on: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  setDemoModeQuiet: () => {},
});

export function useDemoMode() {
  return useContext(DemoModeContext);
}

function readSessionFlag(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "true";
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Sync from sessionStorage on mount
  useEffect(() => {
    const stored = readSessionFlag();
    setIsDemoMode(stored);
    setApiDemoMode(stored);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      sessionStorage.setItem(STORAGE_KEY, String(next));
      setApiDemoMode(next);
      // Reload so all pages refetch with new mode
      window.location.reload();
      return next;
    });
  }, []);

  const setDemoModeQuiet = useCallback((on: boolean) => {
    sessionStorage.setItem(STORAGE_KEY, String(on));
    setApiDemoMode(on);
    setIsDemoMode(on);
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode, setDemoModeQuiet }}>
      {children}
    </DemoModeContext.Provider>
  );
}
