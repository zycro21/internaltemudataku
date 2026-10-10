"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  PositionedTable,
  TableDoc,
  TableDocsResult,
} from "@/lib/erd/types";
import { Inline, Markdown, MdTable, type MdContext } from "./Markdown";

type TabId = "ringkasan" | "kolom" | "relasi" | "catatan";

interface DocPanelProps {
  table: PositionedTable;
  color: string;
  docs: TableDocsResult | null; // null = masih dimuat
  /** FK keluar (tabel yang ditunjuk) dan FK masuk (tabel yang merujuk). */
  related: { out: number[]; in: number[] };
  positioned: PositionedTable[];
  /** Tinggi panel sebagai pecahan tinggi area kanvas (0..1). */
  heightFrac: number;
  onHeightChange: (frac: number) => void;
  onJumpTable: (tableName: string) => void;
  onJumpIndex: (idx: number) => void;
  onClose: () => void;
}

export default function DocPanel({
  table,
  color,
  docs,
  related,
  positioned,
  heightFrac,
  onHeightChange,
  onJumpTable,
  onJumpIndex,
  onClose,
}: DocPanelProps) {
  const [tab, setTab] = useState<TabId>("ringkasan");
  const [maximized, setMaximized] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const doc: TableDoc | undefined = docs?.docs[table.table];
  const tableNames = useMemo(
    () => new Set(positioned.map((p) => p.table)),
    [positioned],
  );
  const ctx: MdContext = {
    tableNames,
    current: table.table,
    onJump: onJumpTable,
  };

  const notes =
    doc?.sections.filter((s) => s.kind === "notes" || s.kind === "other") ?? [];
  const relSections =
    doc?.sections.filter((s) => s.kind === "keys" || s.kind === "relations") ??
    [];

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "ringkasan", label: "Ringkasan" },
    {
      id: "kolom",
      label: "Kolom",
      count: doc?.columns?.rows.length ?? table.columns.length,
    },
    { id: "relasi", label: "Relasi" },
  ];
  if (notes.length > 0)
    tabs.push({ id: "catatan", label: "Catatan", count: notes.length });

  // Tab yang dipilih bisa tidak ada di tabel berikutnya (mis. tanpa catatan).
  const activeTab: TabId = tabs.some((t) => t.id === tab) ? tab : "ringkasan";

  // Pindah tabel -> gulir isi ke atas.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [table.table, activeTab]);

  // Seret pegangan di atas panel untuk mengubah tinggi.
  function startResize(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const parent = panelRef.current?.parentElement;
    if (!parent) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const rect = parent.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const frac = (rect.bottom - ev.clientY) / rect.height;
      setMaximized(false);
      onHeightChange(Math.min(0.85, Math.max(0.18, frac)));
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }

  const pkCount = table.columns.filter((c) => c.pk).length;
  const fkCount = table.columns.filter((c) => c.fk).length;

  return (
    <section
      ref={panelRef}
      aria-label={`Dokumentasi tabel ${table.table}`}
      className="flex min-h-0 flex-shrink-0 flex-col border-t border-erd-border bg-erd-side shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
      style={{ height: `${(maximized ? 0.85 : heightFrac) * 100}%` }}
    >
      <div
        onPointerDown={startResize}
        title="Seret untuk mengubah tinggi"
        className="group flex h-3 flex-shrink-0 cursor-row-resize items-center justify-center touch-none"
      >
        <span className="h-1 w-10 rounded-full bg-erd-border group-hover:bg-erd-accent" />
      </div>

      <header className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: color }}
        />
        <h2 className="font-mono text-[15px] font-bold text-erd-text">
          {table.table}
        </h2>
        {doc && (
          <span className="rounded-md border border-erd-border px-1.5 py-0.5 font-mono text-[10.5px] text-erd-faint">
            §{doc.number}
          </span>
        )}
        {doc?.badge && (
          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10.5px] font-medium text-erd-warn">
            {doc.badge}
          </span>
        )}
        <span className="text-[12px] text-erd-faint">{table.module}</span>
        <span className="font-mono text-[11px] text-erd-faint">
          {table.columns.length} kolom &middot; {pkCount} PK &middot; {fkCount}{" "}
          FK
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMaximized((m) => !m)}
            title={maximized ? "Kecilkan panel" : "Perbesar panel"}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-erd-border bg-erd-panel text-[13px] text-erd-text hover:border-erd-accent hover:text-erd-accent"
          >
            {maximized ? "▾" : "▴"}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Tutup (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-erd-border bg-erd-panel text-[13px] text-erd-text hover:border-erd-accent hover:text-erd-accent"
          >
            ✕
          </button>
        </div>
      </header>

      <nav
        role="tablist"
        className="flex flex-shrink-0 gap-1 border-b border-erd-border px-3"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={activeTab === t.id}
            onClick={() => setTab(t.id)}
            className={
              "-mb-px border-b-2 px-3 py-1.5 text-[12.5px] " +
              (activeTab === t.id
                ? "border-erd-accent font-semibold text-erd-text"
                : "border-transparent text-erd-muted hover:text-erd-text")
            }
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 font-mono text-[10.5px] text-erd-faint">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        {docs === null ? (
          <p className="text-[13px] text-erd-faint">Memuat dokumentasi…</p>
        ) : (
          <>
            {!doc && (
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-erd-warn">
                {docs.error ??
                  `Belum ada dokumentasi untuk tabel ${table.table} di file dokumentasi.`}{" "}
                Yang tampil di bawah hanya struktur dari schema.
              </div>
            )}
            {activeTab === "ringkasan" && (
              <div className="flex max-w-4xl flex-col gap-4">
                {doc ? (
                  <Markdown text={doc.intro} ctx={ctx} />
                ) : (
                  <p className="text-[13px] text-erd-faint">
                    Tidak ada penjelasan fungsi tabel.
                  </p>
                )}
                {doc && doc.sections.some((s) => s.kind === "notes") && (
                  <button
                    type="button"
                    onClick={() => setTab("catatan")}
                    className="self-start text-[12px] text-erd-accent hover:underline"
                  >
                    Ada catatan penting untuk tabel ini →
                  </button>
                )}
              </div>
            )}

            {activeTab === "kolom" && (
              <div className="flex flex-col gap-4">
                {doc?.columns ? (
                  <MdTable
                    head={doc.columns.head}
                    rows={doc.columns.rows}
                    ctx={ctx}
                    firstColMono
                  />
                ) : (
                  <SchemaColumns table={table} />
                )}
                {doc?.enums.map((en) => (
                  <div key={en.name} className="max-w-4xl">
                    <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-erd-faint">
                      Enum{" "}
                      <span className="font-mono normal-case text-erd-text">
                        {en.name}
                      </span>
                    </div>
                    <Markdown text={en.body} ctx={ctx} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "relasi" && (
              <div className="flex max-w-4xl flex-col gap-4">
                <RelationChips
                  label="Menunjuk ke (FK)"
                  arrow="→"
                  indices={related.out}
                  positioned={positioned}
                  onJump={onJumpIndex}
                />
                <RelationChips
                  label="Dirujuk oleh"
                  arrow="←"
                  indices={related.in}
                  positioned={positioned}
                  onJump={onJumpIndex}
                />
                {relSections.map((s, i) => (
                  <div key={i}>
                    <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-erd-faint">
                      {s.title}
                    </div>
                    <Markdown text={s.body} ctx={ctx} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "catatan" && (
              <div className="flex max-w-4xl flex-col gap-5">
                {notes.map((s, i) => (
                  <div key={i}>
                    <div className="mb-1.5 text-[12.5px] font-semibold text-erd-text">
                      <Inline text={s.title} ctx={ctx} />
                    </div>
                    <Markdown text={s.body} ctx={ctx} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function RelationChips({
  label,
  arrow,
  indices,
  positioned,
  onJump,
}: {
  label: string;
  arrow: string;
  indices: number[];
  positioned: PositionedTable[];
  onJump: (idx: number) => void;
}) {
  const unique = [...new Set(indices)];
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-erd-faint">
        {label} <span className="font-mono">({unique.length})</span>
      </div>
      {unique.length === 0 ? (
        <div className="text-[12px] text-erd-faint">Tidak ada.</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {unique.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className="rounded-md border border-erd-border bg-erd-panel px-2 py-1 font-mono text-[11.5px] text-erd-muted hover:border-erd-accent hover:text-erd-accent"
            >
              {arrow} {positioned[i].table}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Cadangan kalau dokumentasi tabel tidak ada: tampilkan struktur dari schema saja. */
function SchemaColumns({ table }: { table: PositionedTable }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-erd-border">
      <table className="w-full border-collapse text-left font-mono text-[12px]">
        <thead>
          <tr className="bg-erd-panel text-[10.5px] uppercase tracking-wider text-erd-faint">
            <th className="px-2.5 py-2">Kolom</th>
            <th className="px-2.5 py-2">Tipe</th>
            <th className="px-2.5 py-2">Key</th>
            <th className="px-2.5 py-2">Null</th>
          </tr>
        </thead>
        <tbody>
          {table.columns.map((c) => (
            <tr
              key={c.name}
              className="border-t border-erd-border/60 text-erd-muted"
            >
              <td className="px-2.5 py-1.5 text-erd-text">{c.name}</td>
              <td className="px-2.5 py-1.5">{c.type}</td>
              <td className="px-2.5 py-1.5">
                {c.pk
                  ? "🔑 PK"
                  : c.fk
                    ? `🔗 → ${c.fk}`
                    : c.unique
                      ? "unique"
                      : ""}
              </td>
              <td className="px-2.5 py-1.5">{c.nullable ? "ya" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
