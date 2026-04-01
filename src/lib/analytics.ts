/**
 * Atlas Analytics — lightweight event tracking + Web Vitals reporting.
 *
 * Web Vitals are reported automatically when WebVitalsReporter is mounted.
 * Custom events can be tracked via `trackEvent()` for product analytics.
 *
 * No external SDK required — events are logged to console in dev,
 * and can be forwarded to an analytics endpoint when ready.
 */

export interface AnalyticsEventPayload {
  name: string;
  category: "navigation" | "engagement" | "performance" | "error";
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL;

/**
 * Track a custom event. Logs to console in dev, POSTs to analytics
 * endpoint in production if configured.
 */
export function trackEvent(event: AnalyticsEventPayload) {
  if (process.env.NODE_ENV === "development") {
    console.debug("[Atlas Analytics]", event.name, event);
    return;
  }

  if (ANALYTICS_ENDPOINT) {
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, timestamp: Date.now() }),
    }).catch(() => {
      // Silent fail — analytics should never break the app
    });
  }
}

/**
 * Report a Web Vital metric. Called by WebVitalsReporter component.
 */
export function reportWebVital(metric: {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}) {
  trackEvent({
    name: `web-vital:${metric.name}`,
    category: "performance",
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    metadata: {
      id: metric.id,
      rating: metric.rating,
    },
  });
}

// ─── Pre-built events ──────────────────────────────────────────────────────

export const events = {
  pageView: (route: string) =>
    trackEvent({ name: "page_view", category: "navigation", metadata: { route } }),

  draftCreated: (sourceType: string) =>
    trackEvent({ name: "draft_created", category: "engagement", metadata: { sourceType } }),

  draftApproved: () =>
    trackEvent({ name: "draft_approved", category: "engagement" }),

  voiceCalibrated: (handle: string) =>
    trackEvent({ name: "voice_calibrated", category: "engagement", metadata: { handle } }),

  searchPerformed: (query: string) =>
    trackEvent({ name: "search_performed", category: "engagement", metadata: { query } }),
} as const;
