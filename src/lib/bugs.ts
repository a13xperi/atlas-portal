export type BugSeverity = "critical" | "high" | "medium" | "low";
export type BugStatus = "open" | "in-progress" | "fixed";

export interface BugReport {
  id: string;
  title: string;
  description: string;
  route: string | null;
  severity: BugSeverity;
  status: BugStatus;
  reporter: string | null;
  createdAt: string;
}

export interface CreateBugReportInput {
  title: string;
  description?: string;
  route?: string | null;
  severity?: BugSeverity;
  status?: BugStatus;
  reporter?: string | null;
}

const seedBugReports: BugReport[] = [
  {
    id: "bug_wallet-login-hang",
    title: "Wallet login spinner never resolves",
    description: "Users can get stuck on the auth spinner after a successful signature round-trip.",
    route: "/dashboard",
    severity: "critical",
    status: "open",
    reporter: "ops",
    createdAt: "2026-04-14T08:15:00.000Z",
  },
  {
    id: "bug-alerts-empty-state",
    title: "Alert filters collapse the empty state copy",
    description: "The empty state card keeps the previous filter label and looks broken after reset.",
    route: "/alerts",
    severity: "medium",
    status: "in-progress",
    reporter: "qa",
    createdAt: "2026-04-14T09:40:00.000Z",
  },
  {
    id: "bug-voice-profile-save",
    title: "Voice profile save toast clips on small screens",
    description: "The confirmation toast overlaps the page header below the mobile breakpoint.",
    route: "/voice-profiles",
    severity: "low",
    status: "fixed",
    reporter: "design",
    createdAt: "2026-04-13T16:05:00.000Z",
  },
];

declare global {
  var __atlasBugReports: BugReport[] | undefined;
}

function getBugStore() {
  if (!globalThis.__atlasBugReports) {
    globalThis.__atlasBugReports = [...seedBugReports];
  }

  return globalThis.__atlasBugReports;
}

export function isBugSeverity(value: unknown): value is BugSeverity {
  return value === "critical" || value === "high" || value === "medium" || value === "low";
}

export function isBugStatus(value: unknown): value is BugStatus {
  return value === "open" || value === "in-progress" || value === "fixed";
}

export function listBugReports() {
  return [...getBugStore()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function createBugReport(input: CreateBugReportInput): BugReport {
  const bug: BugReport = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || "No description provided.",
    route: input.route?.trim() || null,
    severity: input.severity ?? "medium",
    status: input.status ?? "open",
    reporter: input.reporter?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  getBugStore().unshift(bug);
  return bug;
}
