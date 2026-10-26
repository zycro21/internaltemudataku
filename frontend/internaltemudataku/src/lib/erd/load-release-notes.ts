import { promises as fs } from "fs";
import path from "path";
import { parseReleaseNotes } from "./parse-release-notes";
import type { ReleaseNotesResult } from "./types";

// Path sengaja ditulis statis (subfolder "content"), supaya bundler tahu persis
// file mana yang dibaca dan tidak menyertakan seluruh project ke output server.
const RELEASE_NOTES_FILE = path.join(
  process.cwd(),
  "content",
  "release-notes.md",
);

// Cache di memori yang divalidasi lewat waktu ubah file: mengganti isi
// release-notes.md langsung terbaca tanpa build ulang.
let cache: { mtimeMs: number; result: ReleaseNotesResult } | null = null;

export async function loadReleaseNotes(): Promise<ReleaseNotesResult> {
  try {
    const stat = await fs.stat(RELEASE_NOTES_FILE);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.result;

    const md = await fs.readFile(RELEASE_NOTES_FILE, "utf8");
    const releases = parseReleaseNotes(md);
    const result: ReleaseNotesResult =
      releases.length > 0
        ? { releases, updatedAt: stat.mtime.toISOString() }
        : {
            releases: [],
            error:
              "File release notes terbaca tapi tidak ada rilis yang dikenali (format judul '## v1.0.0 — 2026-01-31').",
          };
    cache = { mtimeMs: stat.mtimeMs, result };
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      releases: [],
      error: `Release notes tidak bisa dibaca (${message}).`,
    };
  }
}
