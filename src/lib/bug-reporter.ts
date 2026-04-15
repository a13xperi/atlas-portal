/**
 * Console Error Auto-Capture for Atlas
 *
 * Hooks into window.onerror, unhandledrejection, and console.error to
 * automatically report bugs to Supabase. Uses fingerprint-based dedup
 * so the same error hitting 100 times results in 1 row with
 * occurrence_count=100.
 *
 * Rate-limited to 5 reports per minute per session.
 */

const SUPA_URL = "https://zoirudjyqfqvpxsrxepr.supabase.co";
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let initialized = false;
const reportTimestamps: number[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const headers: Record<string, string> = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/**
 * Simple hash of a string — produces a hex fingerprint.
 * Uses the first 3 frames of a stack trace + error message to identify
 * duplicate errors.
 */
async function hashFingerprint(input: string): Promise<string> {
  // Use SubtleCrypto if available (all modern browsers), otherwise fallback
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: simple djb2 hash
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function extractFirstFrames(stack: string, count = 3): string {
  const lines = stack
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("at ") || l.includes("@"));
  return lines.slice(0, count).join("\n");
}

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps outside the window
  while (reportTimestamps.length > 0 && reportTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    reportTimestamps.shift();
  }
  if (reportTimestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }
  reportTimestamps.push(now);
  return false;
}

function firstLine(msg: string): string {
  const line = msg.split("\n")[0].trim();
  return line.length > 200 ? line.slice(0, 200) + "..." : line;
}

// ---------------------------------------------------------------------------
// Core: report an error to Supabase with fingerprint dedup
// ---------------------------------------------------------------------------

async function reportError(message: string, stack: string): Promise<void> {
  if (!SUPA_KEY) return;
  if (isRateLimited()) return;

  // Ignore errors from extensions, browser internals, etc.
  if (stack && (stack.includes("chrome-extension://") || stack.includes("moz-extension://"))) {
    return;
  }

  const frames = extractFirstFrames(stack);
  const fingerprintInput = `${message}|||${frames}`;
  const fingerprint = await hashFingerprint(fingerprintInput);

  try {
    // Check if a bug with this fingerprint already exists
    const checkRes = await fetch(
      `${SUPA_URL}/rest/v1/bugs?fingerprint=eq.${encodeURIComponent(fingerprint)}&select=id,occurrence_count&limit=1`,
      { headers },
    );

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.length > 0) {
        // Increment occurrence count and update last_seen_at
        const bug = existing[0];
        await fetch(`${SUPA_URL}/rest/v1/bugs?id=eq.${bug.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            occurrence_count: bug.occurrence_count + 1,
            last_seen_at: new Date().toISOString(),
          }),
        });
        return;
      }
    }

    // Insert new bug
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

    await fetch(`${SUPA_URL}/rest/v1/bugs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: firstLine(message),
        description: stack || message,
        fingerprint,
        status: "open",
        severity: "low",
        source: "console",
        project: "atlas",
        page_url: pageUrl,
        page_route: typeof window !== "undefined" ? window.location.pathname : null,
        user_agent: userAgent,
        occurrence_count: 1,
        last_seen_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — we never want the bug reporter to cause bugs
  }
}

// ---------------------------------------------------------------------------
// Public: initialize hooks
// ---------------------------------------------------------------------------

export function initBugReporter(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!SUPA_KEY) {
    console.warn("[bug-reporter] NEXT_PUBLIC_SUPABASE_ANON_KEY not set — auto-capture disabled");
    return;
  }

  initialized = true;

  // 1. Hook window.onerror
  const prevOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = typeof message === "string" ? message : String(message);
    const stack =
      error?.stack || `${msg}\n    at ${source || "unknown"}:${lineno || 0}:${colno || 0}`;
    reportError(msg, stack);

    if (typeof prevOnError === "function") {
      return prevOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // 2. Hook unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg =
      reason instanceof Error ? reason.message : typeof reason === "string" ? reason : String(reason);
    const stack = reason instanceof Error ? reason.stack || msg : msg;
    reportError(`Unhandled Promise Rejection: ${msg}`, stack);
  });

  // 3. Wrap console.error
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    // Call original first
    originalConsoleError.apply(console, args);

    // Build message from args
    const parts = args.map((a) => {
      if (a instanceof Error) return a.message;
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    });
    const msg = parts.join(" ");

    // Extract stack if any arg is an Error
    const errorArg = args.find((a) => a instanceof Error) as Error | undefined;
    const stack = errorArg?.stack || msg;

    // Skip reporting our own internal errors or React internal noise
    if (msg.includes("[bug-reporter]")) return;
    if (msg.includes("Warning: ")) return; // React dev warnings
    if (msg.includes("Download the React DevTools")) return;

    reportError(msg, stack);
  };
}
