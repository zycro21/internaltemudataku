import { NextResponse } from "next/server";
import { fetchLiveSchema } from "@/lib/erd/fetch-schema";

// Never cache this route -- every hit re-fetches schema.prisma from GitHub.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await fetchLiveSchema();
  // Always 200: the endpoint successfully returned data either way. Callers
  // should check `source`/`error` in the body to know if it's live or a
  // fallback snapshot, rather than treating a degraded response as a failed request.
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}