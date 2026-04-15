/**
 * Environment variable validation.
 * Runs at module load time — fails fast with a clear message if required
 * vars are missing or malformed, instead of silently using undefined.
 *
 * Only validates NEXT_PUBLIC_* vars (client-accessible).
 * Server-only vars belong in the backend repo.
 */

const required = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const;

function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Atlas] Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        `Set them in .env.local (local dev) or Vercel project settings (staging/production).`
    );
  }

  const apiUrl = required.NEXT_PUBLIC_API_URL!;
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(
      `[Atlas] NEXT_PUBLIC_API_URL is not a valid URL: "${apiUrl}"\n` +
        "Expected format: a fully-qualified URL beginning with http:// or https://"
    );
  }
}

// Run validation at runtime only (not during `next build` static generation,
// where env vars may not be injected). NEXT_PUBLIC_* vars are inlined at
// build time when set in Vercel, but are absent in local `next build` without .env.local.
if (typeof window !== "undefined" || process.env.NODE_ENV === "development") {
  validateEnv();
}

export const env = {
  apiUrl: required.NEXT_PUBLIC_API_URL!,
} as const;
