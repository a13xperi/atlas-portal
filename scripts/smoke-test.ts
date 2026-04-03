#!/usr/bin/env tsx

const ROUTES = [
  "/",
  "/dashboard",
  "/crafting",
  "/voice-profiles",
  "/analytics",
  "/alerts",
  "/management",
  "/team-library",
  "/briefing",
  "/search",
  "/profile",
  "/telegram",
  "/onboarding/track-a",
  "/onboarding/track-b",
  "/onboarding/handoff",
] as const;

const BASE_URL = (process.env.NEXT_PUBLIC_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
}

async function smokeTest() {
  console.log(`Smoke testing ${BASE_URL} across ${ROUTES.length} routes...`);

  let passed = 0;
  let failed = 0;

  for (const route of ROUTES) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        console.log(`OK   ${route} (${res.status})`);
        passed++;
      } else {
        console.log(`FAIL ${route} (${res.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`FAIL ${route} (network error: ${getErrorMessage(error)})`);
      failed++;
    }
  }

  console.log(
    `\nResults: ${passed} passed, ${failed} failed out of ${ROUTES.length}`
  );

  process.exit(failed > 0 ? 1 : 0);
}

smokeTest().catch((error) => {
  console.error(`Unexpected error: ${getErrorMessage(error)}`);
  process.exit(1);
});
