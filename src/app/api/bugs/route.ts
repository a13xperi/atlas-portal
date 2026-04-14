import { NextResponse } from "next/server";
import {
  createBugReport,
  isBugSeverity,
  isBugStatus,
  listBugReports,
  type CreateBugReportInput,
} from "@/lib/bugs";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  return NextResponse.json(
    { bugs: listBugReports() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!payload || typeof payload !== "object") {
    return badRequest("Request body must be a JSON object.");
  }

  const input = payload as CreateBugReportInput;

  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    return badRequest("`title` is required.");
  }

  if (input.severity !== undefined && !isBugSeverity(input.severity)) {
    return badRequest("`severity` must be one of critical, high, medium, or low.");
  }

  if (input.status !== undefined && !isBugStatus(input.status)) {
    return badRequest("`status` must be one of open, in-progress, or fixed.");
  }

  if (input.description !== undefined && typeof input.description !== "string") {
    return badRequest("`description` must be a string when provided.");
  }

  if (input.route !== undefined && input.route !== null && typeof input.route !== "string") {
    return badRequest("`route` must be a string or null when provided.");
  }

  if (input.reporter !== undefined && input.reporter !== null && typeof input.reporter !== "string") {
    return badRequest("`reporter` must be a string or null when provided.");
  }

  const bug = createBugReport(input);

  return NextResponse.json(
    { bug },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
