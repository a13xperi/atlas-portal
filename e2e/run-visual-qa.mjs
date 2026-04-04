#!/usr/bin/env node
/**
 * Visual QA runner — captures baselines or runs regression checks.
 *
 * Usage:
 *   node e2e/run-visual-qa.mjs --update    # Capture new baselines
 *   node e2e/run-visual-qa.mjs             # Run regression check
 */
import { execSync } from "node:child_process";

const isUpdate = process.argv.includes("--update");
const config = "playwright-e2e.config.ts";

const cmd = [
  "npx",
  "playwright",
  "test",
  `--config=${config}`,
  "--project=visual",
  "--project=responsive",
  isUpdate ? "--update-snapshots" : "",
].filter(Boolean).join(" ");

console.log(`\n  Visual QA: ${isUpdate ? "updating baselines" : "running regression check"}\n`);
console.log(`  > ${cmd}\n`);

try {
  execSync(cmd, { stdio: "inherit", env: { ...process.env } });
  console.log("\n  Visual QA passed.\n");
} catch {
  if (!isUpdate) {
    console.error("\n  Visual QA failed — see diff screenshots in test-results/\n");
  }
  process.exit(1);
}
