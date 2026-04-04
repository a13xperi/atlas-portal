/**
 * Shared API mock handlers for e2e tests.
 * Re-exports fixtures.ts helpers so extended test suites can import from one place.
 */
export { stubAuth, stubDataEndpoints, mockUser, mockDrafts } from "../fixtures";

import { Page } from "@playwright/test";

/** Stub all API calls to return errors (for error-handling tests). */
export async function stubAllApiErrors(page: Page, status = 500) {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error" }),
    }),
  );
}

/** Stub auth as unauthenticated (401). */
export async function stubUnauthenticated(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) }),
  );
}
