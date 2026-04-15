#!/usr/bin/env node
/**
 * env-contract.mjs
 *
 * Asserts that public/backend API URLs do not contain private/internal
 * hostnames that would leak at build time or fail in the browser.
 *
 * Incident context: DNS_HOSTNAME_RESOLVED_PRIVATE — Apr 15 2026
 */

const VIOLATIONS = [];

function check(name, value) {
  if (!value) return;
  const lower = value.toLowerCase();
  if (lower.includes(".railway.internal")) {
    VIOLATIONS.push(`${name} contains .railway.internal: ${value}`);
  }
  if (lower.includes("localhost")) {
    VIOLATIONS.push(`${name} contains localhost: ${value}`);
  }
}

check("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
check("BACKEND_API_URL", process.env.BACKEND_API_URL);

if (VIOLATIONS.length > 0) {
  console.error("ENV CONTRACT VIOLATION:");
  for (const v of VIOLATIONS) {
    console.error("  - " + v);
  }
  process.exit(1);
}

console.log("ENV CONTRACT OK");
process.exit(0);
