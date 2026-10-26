"use client";

import type { ReleaseNotesResult } from "@/lib/erd/types";

/** "2026-10-25" -> "25 Okt 2026" (short) / "25 Oktober 2026" (long), hari WIB. */
export function formatReleaseDate(
  date: string | undefined,
  month: "short" | "long",
): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/** Badge versi kecil di samping judul sidebar. Klik = buka release notes. */
export function VersionPill({
  version,
  onClick,
}: {
  version: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Lihat release notes"
      className="rounded-md bg-erd-accent/15 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-erd-accent hover:bg-erd-accent/25"
    >
      v{version}
    </button>
  );
}

/** Kartu di sidebar: versi aktif + tombol buka release notes. */
export default function ReleaseCard({
  data,
  onOpen,
}: {
  data?: ReleaseNotesResult;
  onOpen: () => void;
}) {
  const latest = data?.releases[0];
  const meta = latest
    ? [formatReleaseDate(latest.date, "short"), latest.title]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-lg border border-erd-border bg-erd-panel p-2.5 text-left hover:border-erd-accent"
    >
      <div className="flex items-center gap-2">
        {latest && (
          <span className="rounded-md bg-erd-accent/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-erd-accent">
            v{latest.version}
          </span>
        )}
        <span className="text-[12.5px] font-medium text-erd-text">
          Release Notes
        </span>
        <span className="ml-auto text-erd-faint group-hover:text-erd-accent">
          →
        </span>
      </div>
      <div className="mt-1 text-[10.5px] leading-relaxed text-erd-faint">
        {latest
          ? meta
            ? `Update terakhir ${meta}`
            : "Lihat riwayat perubahan database"
          : "Belum ada catatan rilis"}
      </div>
    </button>
  );
}
