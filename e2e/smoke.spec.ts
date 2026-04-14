import { expect, request, test, type Page } from "@playwright/test";
import {
  resolveVercelBypassCookies,
  resolveVercelBypassHeaders,
} from "./playwright-env";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "https://staging-delphi-atlas.vercel.app";
const FRONTEND_HOST = new URL(BASE_URL).hostname;
const API_URL =
  process.env.PLAYWRIGHT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-production-9bef.up.railway.app";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const HAS_AUTH_CREDENTIALS = Boolean(TEST_USER_EMAIL && TEST_USER_PASSWORD);
const HAS_VERCEL_BYPASS = Boolean(resolveVercelBypassHeaders());

test.use({ extraHTTPHeaders: resolveVercelBypassHeaders() });

async function addVercelBypassCookie(page: Page) {
  const bypassCookies = resolveVercelBypassCookies(FRONTEND_HOST);
  if (bypassCookies.length > 0) {
    await page.context().addCookies(bypassCookies);
  }
}

async function loginAndSeedSession(page: Page) {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD for authenticated smoke tests.",
    );
  }

  await addVercelBypassCookie(page);

  const apiContext = await request.newContext({ baseURL: API_URL });
  try {
    let token: string | null = null;

    const loginResponse = await apiContext.post("/api/auth/login", {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
      failOnStatusCode: false,
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      token = typeof body?.token === "string" ? body.token : null;
    }

    if (!token && (loginResponse.status() === 404 || loginResponse.status() === 401)) {
      await apiContext.post("/api/auth/register", {
        data: { handle: "e2e-smoke-user", email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
        failOnStatusCode: false,
      });

      const retryResponse = await apiContext.post("/api/auth/login", {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
        failOnStatusCode: false,
      });

      if (retryResponse.ok()) {
        const body = await retryResponse.json();
        token = typeof body?.token === "string" ? body.token : null;
      }
    }

    if (!token) {
      throw new Error("Login failed: unable to obtain token.");
    }

    await page.context().addCookies([
      {
        name: "atlas_session",
        value: "1",
        domain: FRONTEND_HOST,
        path: "/",
      },
    ]);

    await page.addInitScript((sessionToken: string) => {
      localStorage.setItem("atlas_access_token", sessionToken);
      document.cookie = "atlas_session=1; path=/";
    }, token);
  } finally {
    await apiContext.dispose();
  }
}

function skipIfAuthenticatedSmokeCannotRun() {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    "Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run authenticated smoke checks.",
  );
  test.skip(
    BASE_URL === "https://staging-delphi-atlas.vercel.app" && !HAS_VERCEL_BYPASS,
    "Set VERCEL_AUTOMATION_BYPASS_SECRET to reach the protected staging app for authenticated smoke checks.",
  );
}

test("login page (/) loads and shows input fields", async ({ page }) => {
  await addVercelBypassCookie(page);
  await page.goto("/", { waitUntil: "load" });

  if (page.url().includes("vercel.com/login")) {
    await expect(
      page.getByRole("textbox", { name: /email address/i }),
    ).toBeVisible();
    return;
  }

  const visibleInputs = page.locator("input:visible");
  if ((await visibleInputs.count()) > 0) {
    await expect(visibleInputs.first()).toBeVisible();
    return;
  }

  await expect(
    page.getByRole("button", { name: /continue with x/i }),
  ).toBeVisible();
});

test("NavBar avatar is a Link element with href=/profile", async ({
  page,
}) => {
  skipIfAuthenticatedSmokeCannotRun();
  await loginAndSeedSession(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  const avatarLink = page.locator(
    'nav[aria-label="Main navigation"] a[href="/profile"]',
  );

  await expect(avatarLink).toBeVisible();
  await expect(avatarLink).toHaveAttribute("href", "/profile");
  expect(await avatarLink.evaluate((element) => element.tagName)).toBe("A");
});

test("profile page (/profile) loads without redirecting to /crafting", async ({
  page,
}) => {
  skipIfAuthenticatedSmokeCannotRun();
  await loginAndSeedSession(page);
  await page.goto("/profile", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByLabel(/display name/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /log out/i })).toBeVisible();
});
