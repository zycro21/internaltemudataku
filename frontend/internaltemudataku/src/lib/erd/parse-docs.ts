import type { TableDoc, DocSection, DocEnum, DocColumnsTable } from "./types";

/**
 * Parser untuk dokumentasi database (content/database-docs.md).
 *
 * Format yang dikenali (lihat bagian "Cakupan & Cara Membaca Dokumen Ini"):
 *
 *   ### 5.15 `bookings` (catatan status opsional)
 *   **Fungsi tabel**: ...
 *   #### Kolom                       -> tabel markdown, jadi tabel kolom
 *   #### Primary Key & Foreign Key   -> daftar PK/FK
 *   #### Relasi ke Tabel Lain ...    -> relasi balik
 *   #### 📌 Catatan ...              -> catatan (boleh lebih dari satu)
 *   ---                              -> penutup dokumen satu tabel
 *
 * Plus blok `### Enum: \`Nama\`` yang ditempelkan ke tabel yang disebut di
 * dalamnya ("tabel `xxx`").
 *
 * Parser sengaja toleran: bagian yang tidak dikenali tetap dibawa sebagai
 * section "other" supaya tidak ada isi dokumen yang hilang diam-diam.
 */

/**
 * Nama tabel di dokumentasi yang berbeda dengan nama tabel fisik di ERD.
 * Dokumen menyebut model `AdminActivityLog`, tapi tabel fisiknya `activity_logs`.
 */
const TABLE_ALIASES: Record<string, string> = {
  admin_activity_logs: "activity_logs",
};

const TABLE_HEADING = /^###\s+(\d+[a-z]?(?:\.\d+[a-z]?)*)\s+`([^`]+)`\s*(.*)$/;
const ENUM_HEADING = /^###\s+Enum:\s+`([^`]+)`\s*$/;
const SUBSECTION = /^####\s+(.+?)\s*$/;
const HR = /^---\s*$/;

export function parseTableDocs(markdown: string): Record<string, TableDoc> {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  interface Chunk {
    kind: "table" | "enum";
    heading: RegExpMatchArray;
    body: string[];
  }
  const chunks: Chunk[] = [];
  let current: Chunk | null = null;

  for (const line of lines) {
    const t = line.match(TABLE_HEADING);
    const e = line.match(ENUM_HEADING);
    if (t || e) {
      current = { kind: t ? "table" : "enum", heading: (t ?? e)!, body: [] };
      chunks.push(current);
      continue;
    }
    // Heading level 1-3 lain (mis. "## Modul: ...", "## 6. Penutup") menutup
    // dokumen yang sedang dibaca, supaya teks pengantar modul tidak ikut.
    if (/^#{1,3}\s/.test(line)) {
      current = null;
      continue;
    }
    if (current) current.body.push(line);
  }

  const docs: Record<string, TableDoc> = {};
  const enums: DocEnum[] = [];

  for (const chunk of chunks) {
    // Isi dokumen berakhir di pemisah "---" pertama; teks sesudahnya (mis. catatan
    // penempatan antar-bagian) bukan milik tabel ini.
    const hr = chunk.body.findIndex((l) => HR.test(l));
    const body = trimBlank(hr === -1 ? chunk.body : chunk.body.slice(0, hr));

    if (chunk.kind === "enum") {
      enums.push({ name: chunk.heading[1], body: body.join("\n").trim() });
      continue;
    }

    const [, number, rawName, suffix] = chunk.heading;
    const table = TABLE_ALIASES[rawName] ?? rawName;
    docs[table] = buildTableDoc(table, rawName, number, suffix, body);
  }

  // Tempelkan enum ke tabel yang disebut ("tabel `xxx`") di bodinya.
  for (const en of enums) {
    const targets = new Set<string>();
    for (const m of en.body.matchAll(/tabel\s+`([^`]+)`/g)) {
      const name = TABLE_ALIASES[m[1]] ?? m[1];
      if (docs[name]) targets.add(name);
    }
    for (const name of targets) docs[name].enums.push(en);
  }

  return docs;
}

function buildTableDoc(
  table: string,
  docName: string,
  number: string,
  suffix: string,
  body: string[],
): TableDoc {
  // Pecah per "#### ..." ; teks sebelum sub-judul pertama = pengantar.
  const intro: string[] = [];
  const raw: { title: string; lines: string[] }[] = [];
  for (const line of body) {
    const m = line.match(SUBSECTION);
    if (m) raw.push({ title: m[1], lines: [] });
    else if (raw.length) raw[raw.length - 1].lines.push(line);
    else intro.push(line);
  }

  let columns: DocColumnsTable | null = null;
  const sections: DocSection[] = [];

  for (const r of raw) {
    const text = trimBlank(r.lines).join("\n");
    const title = r.title;
    if (/^kolom$/i.test(title)) {
      columns = parseMarkdownTable(text);
      if (columns) continue; // gagal diparsing -> jatuh ke "other" di bawah
    }
    let kind: DocSection["kind"] = "other";
    let shown = title;
    if (/^primary key/i.test(title)) kind = "keys";
    else if (/^relasi/i.test(title)) kind = "relations";
    else if (title.startsWith("📌")) {
      kind = "notes";
      shown = title.replace(/^📌\s*/, "");
    }
    sections.push({ kind, title: shown, body: text });
  }

  // "(MASIH TIDAK DIPAKAI)" / "(masih belum dipakai)" di judul = status tabel.
  const badge = suffix.match(/^\(([^)]+)\)\s*$/)?.[1]?.trim();

  return {
    table,
    docName,
    number,
    badge: badge
      ? badge.charAt(0).toUpperCase() + badge.slice(1).toLowerCase()
      : undefined,
    intro: trimBlank(intro)
      .join("\n")
      .replace(/^\*\*Fungsi tabel\*\*\s*:\s*/i, "")
      .trim(),
    columns,
    sections,
    enums: [],
  };
}

function trimBlank(lines: string[]): string[] {
  let a = 0;
  let b = lines.length;
  while (a < b && lines[a].trim() === "") a++;
  while (b > a && lines[b - 1].trim() === "") b--;
  return lines.slice(a, b);
}

/** Memecah satu baris tabel markdown, abaikan "|" di dalam backtick atau yang di-escape. */
export function splitTableRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cur = "";
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (ch === "`") {
      inCode = !inCode;
      cur += ch;
    } else if (ch === "|" && !inCode) {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

export function parseMarkdownTable(text: string): DocColumnsTable | null {
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (rows.length < 2 || !/^\|?\s*:?-{2,}/.test(rows[1])) return null;
  const head = splitTableRow(rows[0]);
  const data = rows.slice(2).map((r) => {
    const cells = splitTableRow(r);
    // Samakan jumlah sel dengan header supaya render tidak bergeser.
    while (cells.length < head.length) cells.push("");
    return cells.slice(0, head.length);
  });
  return { head, rows: data };
}
