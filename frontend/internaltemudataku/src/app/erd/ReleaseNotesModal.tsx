"use client";

import { useEffect, useRef } from "react";
import type {
  ReleaseNote,
  ReleaseNotesResult,
  ReleaseSectionKind,
} from "@/lib/erd/types";
import { Markdown, type MdContext } from "./Markdown";
import { formatReleaseDate } from "./ReleaseCard";

interface ReleaseNotesModalProps {
  open: boolean;
  data?: ReleaseNotesResult;
  /** Nama semua tabel di ERD; `kode` yang cocok jadi tautan lompat. */
  tableNames: Set<string>;
  onJumpTable: (table: string) => void;
  onClose: () => void;
}

const KIND_STYLE: Record<ReleaseSectionKind, { badge: string; sign: string }> =
  {
    added: { badge: "bg-emerald-500/15 text-emerald-500", sign: "+" },
    changed: { badge: "bg-amber-500/15 text-erd-warn", sign: "~" },
    removed: { badge: "bg-red-500/15 text-red-500", sign: "−" },
    other: { badge: "bg-erd-bg text-erd-muted", sign: "•" },
  };

export default function ReleaseNotesModal({
  open,
  data,
  tableNames,
  onJumpTable,
  onClose,
}: ReleaseNotesModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Esc menutup modal. Listener di fase capture + stopPropagation, supaya Esc
  // yang sama tidak ikut membatalkan pilihan tabel di ErdViewer.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const releases = data?.releases ?? [];
  const ctx: MdContext = {
    tableNames,
    current: "",
    // Klik nama tabel di catatan rilis: tutup modal lalu lompat ke tabelnya.
    onJump: (table) => {
      onClose();
      onJumpTable(table);
    },
  };

  return (
    // Sengaja tidak menutup saat klik di luar modal; tutup lewat tombol ✕ atau Esc.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-notes-title"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-erd-border bg-erd-side shadow-2xl"
      >
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-erd-border px-5 py-3.5">
          <h2
            id="release-notes-title"
            className="text-[15px] font-bold text-erd-text"
          >
            Release Notes
          </h2>
          {releases[0] && (
            <span className="rounded-md bg-erd-accent/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-erd-accent">
              v{releases[0].version}
            </span>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            title="Tutup (Esc)"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-erd-border bg-erd-panel text-[13px] text-erd-text hover:border-erd-accent hover:text-erd-accent"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-[12px] leading-relaxed text-erd-faint">
            Riwayat perubahan database: penambahan atau penghapusan tabel dan
            kolom, serta penyesuaian fungsi tabel atau kolom. Klik nama tabel
            untuk melompat ke diagram.
          </p>

          {releases.length === 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-erd-warn">
              {data?.error ?? "Belum ada release notes."}
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {releases.map((r, i) => (
                <Release
                  key={r.version}
                  release={r}
                  latest={i === 0}
                  ctx={ctx}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Release({
  release,
  latest,
  ctx,
}: {
  release: ReleaseNote;
  latest: boolean;
  ctx: MdContext;
}) {
  const date = formatReleaseDate(release.date, "long");
  return (
    <article className="border-b border-erd-border pb-7 last:border-b-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h3 className="font-mono text-[15px] font-bold text-erd-text">
          v{release.version}
        </h3>
        {latest && (
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-500">
            Terbaru
          </span>
        )}
        {release.title && (
          <span className="text-[13px] font-medium text-erd-text">
            {release.title}
          </span>
        )}
        {date && (
          <span className="ml-auto text-[11.5px] text-erd-faint">{date}</span>
        )}
      </div>

      {release.summary && (
        <div className="mb-3">
          <Markdown text={release.summary} ctx={ctx} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {release.sections.map((s, i) => {
          const style = KIND_STYLE[s.kind];
          return (
            <section key={i}>
              <div
                className={`mb-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
              >
                <span className="font-mono">{style.sign}</span>
                {s.title}
              </div>
              <Markdown text={s.body} ctx={ctx} />
            </section>
          );
        })}
      </div>
    </article>
  );
}
