import {
  createHeadResponse,
  createJsonResponse,
  getReadinessPayload,
} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const { payload, httpStatus } = await getReadinessPayload();
  return createJsonResponse(payload, httpStatus);
}

export async function HEAD() {
  const { httpStatus } = await getReadinessPayload();
  return createHeadResponse(httpStatus);
}
