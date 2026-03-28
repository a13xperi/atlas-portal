import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://zoirudjyqfqvpxsrxepr.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaXJ1ZGp5cWZxdnB4c3J4ZXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzE4MjgsImV4cCI6MjA4MzYwNzgyOH0.6W6OzRfJ-nmKN_23z1OBCS4Cr-ODRq9DJmF_yMwOCfo";

interface BugRecord {
  title: string;
  description: string;
  page_route: string;
  severity: string;
  steps_to_reproduce: string;
  source: string;
  project: string;
  branch: string;
  test_run_date: string;
}

/**
 * Playwright reporter that auto-logs test failures and captured errors
 * to the Supabase `bugs` table. Deduplicates by title to avoid
 * re-inserting known bugs on repeated runs.
 */
class SupabaseBugReporter implements Reporter {
  private bugs: Map<string, BugRecord> = new Map();
  private branch: string = "unknown";

  onBegin(_config: FullConfig, _suite: Suite) {
    // Try to detect current git branch
    try {
      const { execSync } = require("child_process");
      this.branch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
      }).trim();
    } catch {
      this.branch = "unknown";
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Only log bugs for failed tests
    if (result.status !== "failed" && result.status !== "timedOut") return;

    // Extract page route from test title or file path
    const route = this.extractRoute(test);
    const errorMessage =
      result.errors.map((e) => e.message || "").join("\n") || "Test failed";

    const title = `[E2E] ${test.title}`;

    // Use Map keyed by title so retries overwrite rather than duplicate
    this.bugs.set(title, {
      title,
      description: errorMessage.slice(0, 2000),
      page_route: route,
      severity: result.status === "timedOut" ? "high" : "medium",
      steps_to_reproduce: `Automated E2E test failure:\n- Test: ${test.titlePath().join(" > ")}\n- File: ${test.location.file}:${test.location.line}\n- Status: ${result.status}\n- Duration: ${result.duration}ms`,
      source: "e2e_automated",
      project: "atlas-portal",
      branch: this.branch,
      test_run_date: new Date().toISOString(),
    });
  }

  async onEnd(_result: FullResult) {
    const allBugs = Array.from(this.bugs.values());

    if (allBugs.length === 0) {
      console.log("[supabase-reporter] No bugs to log.");
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch existing bug titles to dedup across runs
    const { data: existing } = await supabase
      .from("bugs")
      .select("title")
      .eq("project", "atlas-portal")
      .eq("source", "e2e_automated");

    const existingTitles = new Set(
      (existing || []).map((b: { title: string }) => b.title)
    );

    const newBugs = allBugs.filter((b) => !existingTitles.has(b.title));

    if (newBugs.length === 0) {
      console.log(
        `[supabase-reporter] ${allBugs.length} bug(s) detected, all already logged. Skipping.`
      );
      return;
    }

    // Auto-assign bug_number by getting the current max
    const { data: maxRow } = await supabase
      .from("bugs")
      .select("bug_number")
      .order("bug_number", { ascending: false })
      .limit(1);

    let nextNumber = ((maxRow?.[0] as { bug_number: number } | undefined)?.bug_number || 0) + 1;

    const toInsert = newBugs.map((bug) => ({
      ...bug,
      bug_number: nextNumber++,
      status: "open",
    }));

    const { error } = await supabase.from("bugs").insert(toInsert);

    if (error) {
      console.error("[supabase-reporter] Failed to log bugs:", error.message);
    } else {
      console.log(
        `[supabase-reporter] Logged ${toInsert.length} new bug(s) to Supabase.`
      );
    }
  }

  private extractRoute(test: TestCase): string {
    // Try to extract route from the spec file name
    const file = test.location.file;
    const match = file.match(/pages\/(\w+)\.spec/);
    if (match) {
      const routeMap: Record<string, string> = {
        dashboard: "/dashboard",
        crafting: "/crafting",
        alerts: "/alerts",
        analytics: "/analytics",
        management: "/management",
        login: "/",
        "voice-profiles": "/voice-profiles",
        remaining: "/unknown",
      };
      return routeMap[match[1]] || `/${match[1]}`;
    }
    return "/unknown";
  }
}

export default SupabaseBugReporter;
