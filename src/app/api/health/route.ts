import {
  createHeadResponse,
  createJsonResponse,
  getLivenessPayload,
} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return createJsonResponse(getLivenessPayload());
}

export async function HEAD() {
  return createHeadResponse();
}
