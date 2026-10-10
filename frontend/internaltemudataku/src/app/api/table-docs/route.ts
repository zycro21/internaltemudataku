import { NextResponse } from "next/server";
import { loadTableDocs } from "@/lib/erd/load-docs";

// Dibaca saat request (bukan saat build), supaya file dokumentasi yang diganti
// di server langsung terpakai.
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadTableDocs();
  // Selalu 200 seperti /api/erd-data: kalau dokumentasi gagal dimuat, ERD tetap
  // jalan dan panel menampilkan pesan dari field `error`.
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-cache" },
  });
}
