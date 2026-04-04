/** Per-page contextual tour definitions for the FTUE. */

export interface TourStep {
  id: string;
  targetSelector: string;
  oracleMessage: string;
  position: "top" | "bottom" | "left" | "right";
}

/** Pages that have contextual tours. */
export type TourPage =
  | "dashboard"
  | "voice-profiles"
  | "crafting"
  | "alerts"
  | "analytics"
  | "arena";

/** Map route pathnames to TourPage identifiers. */
export const ROUTE_TO_PAGE: Record<string, TourPage> = {
  "/dashboard": "dashboard",
  "/voice-profiles": "voice-profiles",
  "/crafting": "crafting",
  "/alerts": "alerts",
  "/analytics": "analytics",
  "/arena": "arena",
};

/** Per-page tour step definitions. Oracle narrates each contextually. */
export const PAGE_TOURS: Record<TourPage, TourStep[]> = {
  dashboard: [
    {
      id: "welcome",
      targetSelector: "[data-tour='oracle-banner']",
      oracleMessage:
        "Welcome to Atlas. I\u2019m The Oracle \u2014 I\u2019ll help you find your voice. Explore any page and I\u2019ll show you the ropes.",
      position: "bottom",
    },
    {
      id: "oracle-always-here",
      targetSelector: "[data-tour='oracle-widget']",
      oracleMessage:
        "I\u2019m always here \u2014 click me anytime for help, drafting ideas, or voice tuning.",
      position: "top",
    },
  ],

  "voice-profiles": [
    {
      id: "voice-sliders",
      targetSelector: "[data-tour='dimension-sliders']",
      oracleMessage:
        "This is your voice DNA. Each slider shapes how your tweets sound. Try dragging one \u2014 see how the preview changes.",
      position: "bottom",
    },
    {
      id: "reference-voices",
      targetSelector: "[data-tour='reference-voices']",
      oracleMessage:
        "Pick writers you admire. I\u2019ll blend their style with yours. Most analysts pick 2\u20133.",
      position: "bottom",
    },
  ],

  crafting: [
    {
      id: "crafting-input",
      targetSelector: "[data-tour='content-input']",
      oracleMessage:
        "This is the Crafting Station. Paste any content \u2014 a report, an article, a hot take \u2014 and I\u2019ll draft a tweet in your voice.",
      position: "bottom",
    },
    {
      id: "generate-draft",
      targetSelector: "[data-tour='generate-button']",
      oracleMessage:
        "Hit Generate and watch. I\u2019ll use your voice profile to craft something that sounds like you, not a bot.",
      position: "bottom",
    },
  ],

  alerts: [
    {
      id: "signals-feed",
      targetSelector: "[data-tour='signals-feed']",
      oracleMessage:
        "Signals watches crypto twitter for you. Trending topics, competitor posts, market moves \u2014 all in one feed.",
      position: "bottom",
    },
    {
      id: "signals-subscribe",
      targetSelector: "[data-tour='signals-subscribe']",
      oracleMessage:
        "Subscribe to topics you care about. I\u2019ll ping you when something breaks through the noise.",
      position: "bottom",
    },
  ],

  analytics: [
    {
      id: "analytics-summary",
      targetSelector: "[data-tour='analytics-summary']",
      oracleMessage:
        "Track what\u2019s working. Your best posts share a pattern \u2014 I\u2019ll help you spot it.",
      position: "bottom",
    },
    {
      id: "analytics-learning",
      targetSelector: "[data-tour='analytics-learning']",
      oracleMessage:
        "The learning log shows how your voice evolves over time. Every draft teaches me more about you.",
      position: "bottom",
    },
  ],

  arena: [
    {
      id: "arena-leaderboard",
      targetSelector: "[data-tour='arena-leaderboard']",
      oracleMessage:
        "The Arena ranks analysts by output, engagement, and consistency. Climb the board.",
      position: "bottom",
    },
    {
      id: "arena-your-rank",
      targetSelector: "[data-tour='arena-your-rank']",
      oracleMessage:
        "This is where you stand. Post more, engage more, and watch your rank rise.",
      position: "bottom",
    },
  ],
};

/** All tour pages in recommended first-visit order. */
export const TOUR_PAGES: TourPage[] = [
  "dashboard",
  "voice-profiles",
  "crafting",
  "alerts",
  "analytics",
  "arena",
];

/** localStorage key for tracking whether a page tour has been completed. */
export function pageTourKey(page: TourPage): string {
  return `atlas_page_toured_${page}`;
}

/** Check if a page tour has been completed. */
export function isPageTourComplete(page: TourPage): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(pageTourKey(page)) === "true";
}

/** Mark a page tour as completed. */
export function markPageTourComplete(page: TourPage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(pageTourKey(page), "true");
}

/** Reset all page tour completion flags. */
export function resetAllPageTours(): void {
  if (typeof window === "undefined") return;
  for (const page of TOUR_PAGES) {
    localStorage.removeItem(pageTourKey(page));
  }
}

// \u2500\u2500 Legacy compat: flat TOUR_STEPS array for anything still referencing it \u2500\u2500
// Remove once all consumers are migrated.
export interface LegacyTourStep extends TourStep {
  route: string;
}
export const TOUR_STEPS: LegacyTourStep[] = Object.entries(PAGE_TOURS).flatMap(
  ([page, steps]) => {
    const route = Object.entries(ROUTE_TO_PAGE).find(
      ([, p]) => p === page,
    )?.[0];
    return steps.map((s) => ({ ...s, route: route ?? `/${page}` }));
  },
);
