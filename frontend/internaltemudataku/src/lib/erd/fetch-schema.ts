import { parsePrismaSchema } from "./parse-schema";
import type { TableDef } from "./types";
import moduleMap from "./module-map.json";
import fallbackData from "./erd-data.json";

export interface ErdFetchResult {
  tables: TableDef[];
  fetchedAt: string;
  source: "github" | "fallback";
  sourceUrl?: string;
  error?: string;
}

/**
 * Fetches schema.prisma live from a public GitHub repo (raw.githubusercontent.com,
 * no auth needed) on every call -- no caching, so this always reflects whatever
 * is currently on that branch. If anything goes wrong (env vars missing, repo/path
 * wrong, GitHub unreachable, or the file parses to zero models), it falls back to
 * the snapshot bundled at build time in ./data/erd-data.json so the page never
 * just breaks -- it degrades to "last known good" and says so.
 *
 * Configure via env vars (see .env.example):
 *   GITHUB_OWNER   - e.g. "temudataku"
 *   GITHUB_REPO    - e.g. "temudataku-backend"
 *   GITHUB_BRANCH  - defaults to "main"
 *   SCHEMA_PATH    - path to schema.prisma inside that repo, defaults to "schema.prisma"
 */
export async function fetchLiveSchema(): Promise<ErdFetchResult> {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.SCHEMA_PATH || "schema.prisma";

  if (!owner || !repo) {
    return {
      tables: fallbackData as TableDef[],
      fetchedAt: new Date().toISOString(),
      source: "fallback",
      error:
        "GITHUB_OWNER / GITHUB_REPO belum diset di environment variables -- menampilkan snapshot bawaan.",
    };
  }

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? `404 -- cek lagi GITHUB_OWNER/GITHUB_REPO/GITHUB_BRANCH/SCHEMA_PATH (URL: ${url})`
          : `GitHub merespons status ${res.status}`,
      );
    }
    const src = await res.text();
    const tables = parsePrismaSchema(src, moduleMap as Record<string, string>);
    if (tables.length === 0) {
      throw new Error(
        "Berhasil fetch tapi 0 model ditemukan -- kemungkinan SCHEMA_PATH salah.",
      );
    }
    return {
      tables,
      fetchedAt: new Date().toISOString(),
      source: "github",
      sourceUrl: url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tables: fallbackData as TableDef[],
      fetchedAt: new Date().toISOString(),
      source: "fallback",
      sourceUrl: url,
      error: `Gagal ambil schema terbaru dari GitHub (${message}). Menampilkan snapshot terakhir yang ter-bundle.`,
    };
  }
}
