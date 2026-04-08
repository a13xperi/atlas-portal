"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTourProgress } from "@/components/tour/TourProvider";

const STORAGE_PREFIX = "atlas_nav_visited_";

function visitedKey(href: string) {
  return `${STORAGE_PREFIX}${href}`;
}

/** Read all visited hrefs from localStorage. */
function readVisited(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const visited = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      visited.add(key.slice(STORAGE_PREFIX.length));
    }
  }
  // Dashboard is always pre-visited (it's the post-login landing page)
  visited.add("/dashboard");
  return visited;
}

/** Mark a href as visited in localStorage. */
function markVisited(href: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(visitedKey(href), "1");
}

/** Clear all nav discovery state so dots reappear. */
export function resetNavDiscovery() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Hook that tracks which nav items the user has visited.
 * Returns shouldShowDot(href) — true when the nav item should pulse.
 *
 * Dots only show while the user hasn't completed all tours (new user).
 * Once all tours are done, dots disappear permanently.
 */
export function useNavDiscovery(): {
  shouldShowDot: (href: string) => boolean;
} {
  const pathname = usePathname();
  const { completedPages, totalPages } = useTourProgress();

  // Default to "all visited" to prevent hydration flash
  const [visited, setVisited] = useState<Set<string>>(() => new Set(["__all__"]));
  const [ready, setReady] = useState(false);

  // Populate from localStorage on mount
  useEffect(() => {
    const v = readVisited();
    // Also mark current page as visited
    v.add(pathname);
    markVisited(pathname);
    setVisited(v);
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On pathname change, mark current page visited
  useEffect(() => {
    if (!ready) return;
    markVisited(pathname);
    setVisited((prev) => {
      if (prev.has(pathname)) return prev;
      const next = new Set(prev);
      next.add(pathname);
      return next;
    });
  }, [pathname, ready]);

  const allToursComplete = completedPages >= totalPages;

  const shouldShowDot = useCallback(
    (href: string) => {
      // Gate: hide all dots if not ready, or if user completed all tours
      if (!ready || allToursComplete) return false;
      // Never show dot on the page the user is currently viewing
      if (href === pathname) return false;
      return !visited.has(href);
    },
    [ready, allToursComplete, pathname, visited],
  );

  return { shouldShowDot };
}
