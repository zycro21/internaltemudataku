import type { ReleaseNote, ReleaseSection, ReleaseSectionKind } from "./types";

/**
 * Parser untuk content/release-notes.md.
 *
 * Format yang dikenali:
 *
 *   ## v1.1.0 — 2026-10-25 — Judul opsional     -> satu rilis
 *   Teks ringkasan rilis ...                    -> summary
 *   ### Ditambahkan | Diubah | Dihapus          -> sub-bagian rilis
 *   - isi ...                                   -> body sub-bagian (markdown)
 *
 * Tanggal (YYYY-MM-DD) dan judul boleh tidak ada. Pemisah boleh —, –, | atau -.
 * Teks sebelum rilis pertama (judul file + panduan menulis) diabaikan.
 * Heading "## ..." yang bukan versi menutup rilis yang sedang dibaca, supaya
 * bagian panduan tidak ikut masuk.
 */

const VERSION_HEADING = /^##\s+v?(\d+(?:\.\d+)*)\b\s*(.*)$/i;
const SECTION_HEADING = /^###\s+(.+?)\s*$/;
const ANY_HEADING = /^#{1,3}\s/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function kindOf(title: string): ReleaseSectionKind {
  if (/^(ditambahkan|penambahan|baru|added|new)\b/i.test(title)) return "added";
  if (/^(diubah|perubahan|penyesuaian|diperbaiki|changed|fixed)\b/i.test(title))
    return "changed";
  if (/^(dihapus|penghapusan|removed|deleted)\b/i.test(title)) return "removed";
  return "other";
}

/** Bandingkan nomor versi secara numerik: 1.10.0 > 1.9.0. */
function compareVersionsDesc(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function trimBlank(lines: string[]): string[] {
  let a = 0;
  let b = lines.length;
  while (a < b && lines[a].trim() === "") a++;
  while (b > a && lines[b - 1].trim() === "") b--;
  return lines.slice(a, b);
}

export function parseReleaseNotes(markdown: string): ReleaseNote[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  interface Draft {
    version: string;
    date?: string;
    title?: string;
    intro: string[];
    sections: { title: string; lines: string[] }[];
  }
  const drafts: Draft[] = [];
  let current: Draft | null = null;

  for (const line of lines) {
    const v = line.match(VERSION_HEADING);
    if (v) {
      const rest = v[2].replace(/^[—–|-]\s*/, "");
      let date: string | undefined;
      let title: string | undefined;
      for (const part of rest.split(/\s+[—–|]\s+|\s+-\s+/)) {
        const p = part.trim();
        if (!p) continue;
        if (!date && ISO_DATE.test(p)) date = p;
        else if (!title) title = p;
      }
      current = { version: v[1], date, title, intro: [], sections: [] };
      drafts.push(current);
      continue;
    }
    if (!current) continue;

    const s = line.match(SECTION_HEADING);
    if (s) {
      current.sections.push({ title: s[1], lines: [] });
      continue;
    }
    if (ANY_HEADING.test(line)) {
      // "## ..." / "# ..." lain = akhir rilis ini
      current = null;
      continue;
    }
    if (/^---\s*$/.test(line)) continue;

    if (current.sections.length > 0)
      current.sections[current.sections.length - 1].lines.push(line);
    else current.intro.push(line);
  }

  return drafts
    .map((d): ReleaseNote => {
      const sections: ReleaseSection[] = d.sections
        .map((s) => ({
          kind: kindOf(s.title),
          title: s.title,
          body: trimBlank(s.lines).join("\n"),
        }))
        .filter((s) => s.body !== "");
      return {
        version: d.version,
        date: d.date,
        title: d.title,
        summary: trimBlank(d.intro).join("\n"),
        sections,
      };
    })
    .sort((a, b) => compareVersionsDesc(a.version, b.version));
}
