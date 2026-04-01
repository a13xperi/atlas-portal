#!/usr/bin/env ts-node
/**
 * Atlas E2E Smoke Test
 *
 * Validates environment variables and runs a full end-to-end flow
 * against the configured API. Intended as a pre-deploy gate.
 *
 * Usage:
 *   npx ts-node scripts/smoke-test.ts
 *   SMOKE_API_URL=https://api-production-9bef.up.railway.app npx ts-node scripts/smoke-test.ts
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

const API_URL =
  process.env.SMOKE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const TEST_HANDLE = `smoke_${Date.now()}`;
const TEST_EMAIL = `${TEST_HANDLE}@smoke.atlas.test`;
const TEST_PASSWORD = "SmokeTest123!";

let token: string | null = null;
let passed = 0;
let failed = 0;

// ─── helpers ────────────────────────────────────────────────────────────────

function ok(label: string) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

async function req<T>(
  path: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── checks ─────────────────────────────────────────────────────────────────

function checkEnvVars() {
  console.log("\n[1] Environment Variables");
  // When SMOKE_API_URL is explicitly provided, NEXT_PUBLIC_API_URL need not be
  // set in the shell — we treat it as overridden.
  if (process.env.SMOKE_API_URL) {
    ok(`SMOKE_API_URL set (overrides NEXT_PUBLIC_API_URL)`);
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    ok(`NEXT_PUBLIC_API_URL is set`);
  } else {
    fail(`Neither SMOKE_API_URL nor NEXT_PUBLIC_API_URL is set`);
  }
  console.log(`    API target: ${API_URL}`);
}

async function checkApiReachable(): Promise<boolean> {
  console.log("\n[2] API Reachability");
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok || res.status === 404) {
      // 404 just means /health isn't defined — server is still up
      ok(`API responds at ${API_URL}`);
      return true;
    } else {
      fail(`API returned ${res.status}`);
      return false;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(`API unreachable`, msg);
    return false;
  }
}

async function checkRegister() {
  console.log("\n[3] Register");
  try {
    const data = await req<{ user: { id: string; handle: string }; token: string; refresh_token: string }>(
      "/api/auth/register",
      "POST",
      { handle: TEST_HANDLE, email: TEST_EMAIL, password: TEST_PASSWORD }
    );
    token = data.token;
    ok(`Registered user: ${data.user.handle} (id: ${data.user.id})`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("Register failed", msg);
    throw new Error("FATAL: cannot continue without auth token");
  }
}

async function checkMe() {
  console.log("\n[4] Auth — /me");
  try {
    const data = await req<{ user: { handle: string } }>("/api/auth/me");
    ok(`/me returned user: ${data.user.handle}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("/me failed", msg);
  }
}

async function checkVoiceProfile() {
  console.log("\n[5] Voice Profile");
  try {
    const data = await req<{ profile: { id: string } }>("/api/voice/profile");
    ok(`Voice profile exists (id: ${data.profile.id})`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("Voice profile fetch failed", msg);
  }
}

async function checkCreateDraft() {
  console.log("\n[6] Create Draft");
  let draftId: string | null = null;
  try {
    const data = await req<{ draft: { id: string; content: string; status: string } }>(
      "/api/drafts",
      "POST",
      { content: "Smoke test draft — safe to delete", sourceType: "manual" }
    );
    draftId = data.draft.id;
    ok(`Draft created (id: ${draftId}, status: ${data.draft.status})`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("Draft creation failed", msg);
    return null;
  }
  return draftId;
}

async function checkApproveDraft(draftId: string) {
  console.log("\n[7] Approve Draft");
  try {
    const data = await req<{ draft: { id: string; status: string } }>(
      `/api/drafts/${draftId}`,
      "PATCH",
      { status: "APPROVED" }
    );
    ok(`Draft approved (status: ${data.draft.status})`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("Draft approval failed", msg);
  }
}

async function checkDeleteDraft(draftId: string) {
  console.log("\n[8] Cleanup — Delete Test Draft");
  try {
    await req(`/api/drafts/${draftId}`, "DELETE");
    ok("Test draft deleted");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Non-fatal — just warn
    console.warn(`  ⚠ Could not delete test draft: ${msg}`);
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Atlas E2E Smoke Test");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════");

  checkEnvVars();
  const reachable = await checkApiReachable();

  // Stop early only if API is unreachable — env var issues don't block functional checks.
  if (!reachable) {
    printSummary();
    process.exit(1);
  }

  try {
    await checkRegister();
  } catch {
    // FATAL — already reported
    printSummary();
    process.exit(1);
  }

  await checkMe();
  await checkVoiceProfile();

  const draftId = await checkCreateDraft();
  if (draftId) {
    await checkApproveDraft(draftId);
    await checkDeleteDraft(draftId);
  }

  printSummary();
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const total = passed + failed;
  console.log("\n═══════════════════════════════════════════");
  if (failed === 0) {
    console.log(`  ✅ ALL CHECKS PASSED (${total}/${total})`);
  } else {
    console.log(`  ❌ ${failed} CHECK(S) FAILED (${passed}/${total} passed)`);
  }
  console.log("═══════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
