/** Per-page contextual tour definitions for the FTUE. */

export interface TourStep {
  id: string;
  targetSelector: string;
  oracleMessage: string;
  position: "top" | "bottom" | "left" | "right";
}

/** Pages that currently own contextual tours. */
export type TourPage = "voice-profiles" | "crafting";

/** Map route pathnames to TourPage identifiers. */
export const ROUTE_TO_PAGE: Record<string, TourPage> = {
  "/voice-profiles": "voice-profiles",
  "/crafting": "crafting",
};

/** Per-page tour step definitions. */
export const PAGE_TOURS: Record<TourPage, TourStep[]> = {
  "voice-profiles": [
    {
      id: "voice-library",
      targetSelector: "[data-tour='voice-library']",
      oracleMessage:
        "Start here to review your personal voice and any saved blends. Pick the voice you want Atlas to write with before you jump into Crafting.",
      position: "bottom",
    },
    {
      id: "tweet-tinder",
      targetSelector: "[data-tour='tweet-tinder']",
      oracleMessage:
        "Tweet Tinder is the fastest calibration loop on this page. Swipe on examples that sound like you to sharpen Atlas toward your actual posting voice.",
      position: "bottom",
    },
    {
      id: "reference-voices",
      targetSelector: "[data-tour='reference-voices']",
      oracleMessage:
        "These reference accounts feed the voice mix Atlas learns from. Keep this list tight so blends and calibrations stay aligned with the voices you trust.",
      position: "bottom",
    },
  ],
  crafting: [
    {
      id: "content-input",
      targetSelector: "[data-tour='content-input']",
      oracleMessage:
        "Start with the raw signal here. Paste notes, a link, or a market take and Atlas will turn it into something publishable.",
      position: "bottom",
    },
    {
      id: "voice-selector",
      targetSelector: "[data-tour='voice-selector']",
      oracleMessage:
        "Pick whether the draft should use your default voice or a saved blend before you generate. This is the fastest way to shift tone without rewriting the source.",
      position: "top",
    },
    {
      id: "generate-button",
      targetSelector: "[data-tour='generate-button']",
      oracleMessage:
        "Generate creates the first pass in your selected voice. If the draft is close but not right, iterate from there instead of starting over.",
      position: "top",
    },
  ],
};

/** All currently supported contextual tour pages. */
export const TOUR_PAGES: TourPage[] = ["voice-profiles", "crafting"];

/** localStorage key for tracking whether a page tour has been dismissed/completed. */
export function pageTourKey(page: TourPage): string {
  return `atlas_tour_${page}`;
}

/** Check if a page tour has been completed. */
export function isPageTourComplete(page: TourPage): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(pageTourKey(page)) === "true";
}

/** Mark a page tour as completed. */
export function markPageTourComplete(page: TourPage): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(pageTourKey(page), "true");
}

/** Reset all page tour completion flags. */
export function resetAllPageTours(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const page of TOUR_PAGES) {
    localStorage.removeItem(pageTourKey(page));
  }
}

/** Return only the steps whose targets currently exist in the DOM. */
export function getAvailableTourSteps(page: TourPage): TourStep[] {
  if (typeof document === "undefined") {
    return PAGE_TOURS[page];
  }

  return PAGE_TOURS[page].filter((step) =>
    document.querySelector(step.targetSelector),
  );
}

// Legacy compat for any remaining flat-tour consumers.
export interface LegacyTourStep extends TourStep {
  route: string;
}

export const TOUR_STEPS: LegacyTourStep[] = Object.entries(PAGE_TOURS).flatMap(
  ([page, steps]) => {
    const route = Object.entries(ROUTE_TO_PAGE).find(([, p]) => p === page)?.[0];

    return steps.map((step) => ({ ...step, route: route ?? `/${page}` }));
  },
);
