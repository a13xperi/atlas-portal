/** Tour step definitions for the FTUE guided tour. */

export interface TourStep {
  id: string;
  route: string;
  targetSelector: string;
  oracleMessage: string;
  position: "top" | "bottom" | "left" | "right";
  /** If set, user must interact with the target before proceeding */
  requiresAction?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    route: "/dashboard",
    targetSelector: "[data-tour='oracle-banner']",
    oracleMessage:
      "Welcome to Atlas. I'm The Oracle — I'll help you find your voice. Let me show you around.",
    position: "bottom",
  },
  {
    id: "voice-sliders",
    route: "/voice-profiles",
    targetSelector: "[data-tour='dimension-sliders']",
    oracleMessage:
      "This is your voice DNA. Each slider shapes how your tweets sound. Try dragging one — see how the preview changes.",
    position: "right",
    requiresAction: true,
  },
  {
    id: "reference-voices",
    route: "/voice-profiles",
    targetSelector: "[data-tour='reference-voices']",
    oracleMessage:
      "Pick writers you admire. I'll blend their style with yours. Most analysts pick 2-3.",
    position: "top",
  },
  {
    id: "crafting-input",
    route: "/crafting",
    targetSelector: "[data-tour='content-input']",
    oracleMessage:
      "This is the Crafting Station. Paste any content — a report, an article, a hot take — and I'll draft a tweet in your voice.",
    position: "top",
  },
  {
    id: "generate-draft",
    route: "/crafting",
    targetSelector: "[data-tour='generate-button']",
    oracleMessage:
      "Hit Generate and watch. I'll use your voice profile to craft something that sounds like you, not a bot.",
    position: "top",
  },
  {
    id: "signals-feed",
    route: "/alerts",
    targetSelector: "[data-tour='signals-feed']",
    oracleMessage:
      "Signals watches crypto twitter for you. Trending topics, competitor posts, market moves — all in one feed. Draft a response right from here.",
    position: "top",
  },
  {
    id: "tour-complete",
    route: "/dashboard",
    targetSelector: "[data-tour='oracle-widget']",
    oracleMessage:
      "That's the basics. I'm always here — click me anytime for help, drafting ideas, or voice tuning. Now go craft something.",
    position: "left",
  },
];
