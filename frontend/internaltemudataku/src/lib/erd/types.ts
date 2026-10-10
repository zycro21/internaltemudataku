export interface ColumnDef {
  name: string;
  type: string;
  pk: boolean;
  fk: string | null; // target table name, or null
  unique: boolean;
  nullable: boolean;
}

export interface TableDef {
  table: string;
  model: string;
  module: string;
  columns: ColumnDef[];
}

/** Internal shape used by the render engine once positions are computed. */
export interface PositionedTable extends TableDef {
  idx: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ModuleBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  count: number;
}

/* ---------- Dokumentasi tabel (content/database-docs.md) ---------- */

/** Tabel "Kolom" di dokumentasi: header + baris sel mentah (markdown inline). */
export interface DocColumnsTable {
  head: string[];
  rows: string[][];
}

/** Satu sub-bagian "#### ..." di dokumentasi satu tabel. */
export interface DocSection {
  kind: "keys" | "relations" | "notes" | "other";
  title: string;
  body: string;
}

export interface DocEnum {
  name: string;
  body: string;
}

export interface TableDoc {
  /** Nama tabel fisik (kunci di ERD). */
  table: string;
  /** Nama yang tertulis di judul dokumen (bisa beda dari tabel fisik). */
  docName: string;
  /** Nomor bagian, mis. "5.15" atau "5.3a". */
  number: string;
  /** Status di judul, mis. "Masih tidak dipakai". */
  badge?: string;
  /** Penjelasan "Fungsi tabel". */
  intro: string;
  columns: DocColumnsTable | null;
  sections: DocSection[];
  enums: DocEnum[];
}

export interface TableDocsResult {
  docs: Record<string, TableDoc>;
  /** Waktu ubah file dokumentasi. */
  updatedAt?: string;
  /** Ada kalau dokumentasi gagal dimuat / tidak ada tabel yang dikenali. */
  error?: string;
}