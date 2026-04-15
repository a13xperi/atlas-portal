"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type OracleView = "open" | "minimized" | "closed";

interface OracleUIContextValue {
  view: OracleView;
  open: () => void;
  minimize: () => void;
  close: () => void;
  toggle: () => void;
}

const OracleUIContext = createContext<OracleUIContextValue>({
  view: "minimized",
  open: () => {},
  minimize: () => {},
  close: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "atlas_oracle_ui_view";

function safeGetLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadView(): OracleView {
  const storage = safeGetLocalStorage();
  if (!storage) return "minimized";
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === "open" || raw === "minimized" || raw === "closed") return raw;
  } catch {
    /* ignore */
  }
  return "minimized";
}

function saveView(view: OracleView): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}

export function OracleUIProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [view, setView] = useState<OracleView>("minimized");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setView(loadView());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveView(view);
  }, [view, hydrated]);

  const open = useCallback(() => setView("open"), []);
  const minimize = useCallback(() => setView("minimized"), []);
  const close = useCallback(() => setView("closed"), []);
  const toggle = useCallback(() => {
    setView((v) => (v === "open" ? "minimized" : "open"));
  }, []);

  // Wire Cmd+K / CommandPalette "Open Oracle" action
  useEffect(() => {
    const handleOracleOpen = () => open();
    window.addEventListener("oracle:open", handleOracleOpen);
    return () => window.removeEventListener("oracle:open", handleOracleOpen);
  }, [open]);

  return (
    <OracleUIContext.Provider value={{ view, open, minimize, close, toggle }}>
      {children}
    </OracleUIContext.Provider>
  );
}

export function useOracleUI() {
  return useContext(OracleUIContext);
}
