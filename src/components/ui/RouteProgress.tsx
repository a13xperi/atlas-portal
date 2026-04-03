"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const STARTING_WIDTH = 18;
const ACTIVE_WIDTH = 72;
const MAX_WIDTH = 90;
const COMPLETE_DELAY_MS = 180;
const HIDE_DELAY_MS = 220;
const INCREMENT_INTERVAL_MS = 160;

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);
  const startedRef = useRef(false);
  const incrementTimerRef = useRef<number>();
  const hideTimerRef = useRef<number>();

  useEffect(() => {
    const clearTimers = () => {
      if (incrementTimerRef.current) {
        window.clearInterval(incrementTimerRef.current);
        incrementTimerRef.current = undefined;
      }

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = undefined;
      }
    };

    const startProgress = () => {
      clearTimers();
      startedRef.current = true;
      setLoading(true);
      setWidth((currentWidth) => Math.max(currentWidth, STARTING_WIDTH));

      incrementTimerRef.current = window.setInterval(() => {
        setWidth((currentWidth) => {
          if (currentWidth >= MAX_WIDTH) {
            return currentWidth;
          }

          return Math.min(currentWidth + 8, MAX_WIDTH);
        });
      }, INCREMENT_INTERVAL_MS);

      window.requestAnimationFrame(() => {
        setWidth((currentWidth) => Math.max(currentWidth, ACTIVE_WIDTH));
      });
    };

    const completeProgress = () => {
      if (!startedRef.current) {
        return;
      }

      clearTimers();
      setWidth(100);

      hideTimerRef.current = window.setTimeout(() => {
        startedRef.current = false;
        setLoading(false);
        setWidth(0);
      }, HIDE_DELAY_MS);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("href")?.startsWith("#")
      ) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(anchor.href, currentUrl);

      if (nextUrl.origin !== currentUrl.origin) {
        return;
      }

      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
        return;
      }

      startProgress();
    };

    document.addEventListener("click", handleClick, true);
    completeProgress();

    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimers();
    };
  }, [pathname]);

  if (!loading && width === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="nprogress-bar"
      style={{ opacity: loading ? 1 : 0, width: `${width}%` }}
    />
  );
}
