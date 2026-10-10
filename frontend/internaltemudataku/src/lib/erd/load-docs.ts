import { promises as fs } from "fs";
import path from "path";
import { parseTableDocs } from "./parse-docs";
import type { TableDocsResult } from "./types";

/**
 * Lokasi file dokumentasi database. Bisa diganti lewat env DOCS_PATH
 * (relatif terhadap root project atau absolut).
 */
function docsFile(): string {
  const p = process.env.DOCS_PATH || "content/database-docs.md";
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

// Cache sederhana di memori, divalidasi lewat waktu ubah file: mengganti file
// dokumentasi langsung terbaca tanpa build ulang, dan tidak parse ulang tiap request.
let cache: { file: string; mtimeMs: number; result: TableDocsResult } | null =
  null;

export async function loadTableDocs(): Promise<TableDocsResult> {
  const file = docsFile();
  try {
    const stat = await fs.stat(file);
    if (cache && cache.file === file && cache.mtimeMs === stat.mtimeMs) {
      return cache.result;
    }
    const md = await fs.readFile(file, "utf8");
    const docs = parseTableDocs(md);
    const result: TableDocsResult =
      Object.keys(docs).length > 0
        ? { docs, updatedAt: stat.mtime.toISOString() }
        : {
            docs: {},
            error:
              "File dokumentasi terbaca tapi tidak ada tabel yang dikenali (format judul '### 5.x `nama_tabel`').",
          };
    cache = { file, mtimeMs: stat.mtimeMs, result };
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      docs: {},
      error: `Dokumentasi tabel tidak bisa dibaca (${message}).`,
    };
  }
}
