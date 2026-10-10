"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type {
  TableDef,
  PositionedTable,
  TableDocsResult,
} from "@/lib/erd/types";
import {
  MODULE_COLORS,
  layoutTables,
  buildRelations,
  relatedIndices,
  boundsForTable,
} from "@/lib/erd/erd-engine";
import styles from "./erd.module.css";
import ThemeToggle from "./ThemeToggle";
import DocPanel from "./DocPanel";

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ErdViewerProps {
  initialTables: TableDef[];
  initialFetchedAt?: string;
  initialSource?: "github" | "fallback";
  initialError?: string;
}

export default function ErdViewer({
  initialTables,
  initialFetchedAt,
  initialSource,
  initialError,
}: ErdViewerProps) {
  const [tables, setTables] = useState(initialTables);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [source, setSource] = useState(initialSource);
  const [fetchError, setFetchError] = useState(initialError);
  const [refreshing, setRefreshing] = useState(false);

  // Dokumentasi tabel (content/database-docs.md). null = masih dimuat.
  const [docs, setDocs] = useState<TableDocsResult | null>(null);
  // Tinggi panel dokumentasi sebagai pecahan tinggi area kanvas + panel.
  const [docHeightFrac, setDocHeightFrac] = useState(0.4);

  async function loadDocs() {
    try {
      const res = await fetch("/api/table-docs", { cache: "no-store" });
      setDocs((await res.json()) as TableDocsResult);
    } catch (err) {
      setDocs({
        docs: {},
        error: `Dokumentasi tabel gagal dimuat (${err instanceof Error ? err.message : String(err)}).`,
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocs();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    void loadDocs();
    try {
      const res = await fetch("/api/erd-data", { cache: "no-store" });
      const data = await res.json();
      setTables(data.tables);
      setFetchedAt(data.fetchedAt);
      setSource(data.source);
      setFetchError(data.error);
    } catch (err) {
      setFetchError(
        `Gagal refresh dari browser (${err instanceof Error ? err.message : String(err)}).`,
      );
    } finally {
      setRefreshing(false);
    }
  }

  const { positioned, moduleBounds, worldW, worldH } = useMemo(
    () => layoutTables(tables),
    [tables],
  );
  const relations = useMemo(() => buildRelations(positioned), [positioned]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const panState = useRef({
    panning: false,
    moved: false,
    startX: 0,
    startY: 0,
    txStart: 0,
    tyStart: 0,
  });
  const pinchState = useRef<{ dist: number | null }>({ dist: null });

  function fitTo(b: Bounds, pad = 70, vhOverride?: number) {
    const vp = viewportRef.current;
    if (!vp) return;
    const vw = vp.clientWidth;
    const vh = vhOverride ?? vp.clientHeight;
    const s = Math.min((vw - pad * 2) / b.w, (vh - pad * 2) / b.h, 1.6);
    const scale = Math.max(s, 0.04);
    const tx = vw / 2 - (b.x + b.w / 2) * scale;
    const ty = vh / 2 - (b.y + b.h / 2) * scale;
    setTransform({ scale, tx, ty });
  }

  useEffect(() => {
    fitTo({ x: -20, y: -20, w: worldW + 40, h: worldH + 40 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldW, worldH]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = vp!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setTransform((prev) => {
        const delta = e.deltaY < 0 ? 1.12 : 0.89;
        const newScale = Math.min(3, Math.max(0.03, prev.scale * delta));
        const tx = mx - (mx - prev.tx) * (newScale / prev.scale);
        const ty = my - (my - prev.ty) * (newScale / prev.scale);
        return { scale: newScale, tx, ty };
      });
    }

    function onMouseDown(e: MouseEvent) {
      const st = panState.current;
      st.panning = true;
      st.moved = false;
      st.startX = e.clientX;
      st.startY = e.clientY;
      setTransform((prev) => {
        st.txStart = prev.tx;
        st.tyStart = prev.ty;
        return prev;
      });
      setIsPanning(true);
    }
    function onMouseMove(e: MouseEvent) {
      const st = panState.current;
      if (!st.panning) return;
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) st.moved = true;
      setTransform((prev) => ({
        ...prev,
        tx: st.txStart + dx,
        ty: st.tyStart + dy,
      }));
    }
    function onMouseUp() {
      panState.current.panning = false;
      setIsPanning(false);
    }

    function onTouchStart(e: TouchEvent) {
      const st = panState.current;
      if (e.touches.length === 1) {
        st.panning = true;
        st.moved = false;
        st.startX = e.touches[0].clientX;
        st.startY = e.touches[0].clientY;
        setTransform((prev) => {
          st.txStart = prev.tx;
          st.tyStart = prev.ty;
          return prev;
        });
      } else if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        pinchState.current.dist = Math.hypot(
          a.clientX - b.clientX,
          a.clientY - b.clientY,
        );
      }
    }
    function onTouchMove(e: TouchEvent) {
      const st = panState.current;
      if (e.touches.length === 1 && st.panning) {
        const dx = e.touches[0].clientX - st.startX;
        const dy = e.touches[0].clientY - st.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) st.moved = true;
        setTransform((prev) => ({
          ...prev,
          tx: st.txStart + dx,
          ty: st.tyStart + dy,
        }));
      } else if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const rect = vp!.getBoundingClientRect();
        const mx = (a.clientX + b.clientX) / 2 - rect.left;
        const my = (a.clientY + b.clientY) / 2 - rect.top;
        const prevDist = pinchState.current.dist;
        if (prevDist) {
          setTransform((prev) => {
            const newScale = Math.min(
              3,
              Math.max(0.03, prev.scale * (dist / prevDist)),
            );
            const tx = mx - (mx - prev.tx) * (newScale / prev.scale);
            const ty = my - (my - prev.ty) * (newScale / prev.scale);
            return { scale: newScale, tx, ty };
          });
        }
        pinchState.current.dist = dist;
      }
    }
    function onTouchEnd() {
      panState.current.panning = false;
      pinchState.current.dist = null;
    }

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    vp.addEventListener("touchstart", onTouchStart, { passive: true });
    vp.addEventListener("touchmove", onTouchMove, { passive: true });
    vp.addEventListener("touchend", onTouchEnd);

    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove", onTouchMove);
      vp.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function selectTable(idx: number, doFit: boolean) {
    // Panel dokumentasi muncul di bawah kanvas dan memotong tinggi kanvas.
    // Saat panel baru akan terbuka, hitung tinggi kanvas SETELAH panel ada,
    // supaya tabel yang dipilih tidak tertutup panel.
    const opening = selected === null;
    const vp = viewportRef.current;
    const areaH = vp?.parentElement?.clientHeight;
    const futureVh = opening && areaH ? areaH * (1 - docHeightFrac) : undefined;
    setSelected(idx);
    if (doFit) {
      fitTo(boundsForTable(positioned[idx]), 70, futureVh);
    } else if (futureVh !== undefined) {
      const t = positioned[idx];
      const margin = 16;
      setTransform((prev) => {
        const top = t.y * prev.scale + prev.ty;
        const bottom = (t.y + t.h) * prev.scale + prev.ty;
        if (bottom <= futureVh - margin) return prev;
        // Geser kanvas ke atas secukupnya; jangan sampai bagian atas tabel terpotong.
        const shift = Math.min(bottom - (futureVh - margin), top - margin);
        return shift > 0 ? { ...prev, ty: prev.ty - shift } : prev;
      });
    }
  }
  function jumpToTableName(name: string) {
    const t = positioned.find((p) => p.table === name);
    if (t) selectTable(t.idx, true);
  }
  function clearSelection() {
    setSelected(null);
  }

  // Esc menutup panel dokumentasi (dan membatalkan pilihan tabel).
  useEffect(() => {
    if (selected === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        return;
      setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Klik di area kosong kanvas = batalkan pilihan, KECUALI klik itu hanyalah
  // ujung dari gerakan drag/pan (browser tetap mengirim event "click" setelah
  // mouseup di elemen yang sama). panState.moved bernilai true kalau pointer
  // bergeser > 3px sejak mousedown, jadi pilihan tabel tidak ikut terhapus.
  function handleCanvasClick(e: ReactMouseEvent) {
    if (e.target !== e.currentTarget) return;
    if (panState.current.moved) return;
    clearSelection();
  }

  const related =
    selected !== null ? relatedIndices(positioned, selected) : null;
  const relatedSet =
    selected !== null && related
      ? new Set([selected, ...related.out, ...related.in])
      : null;

  const results =
    query.trim().length > 0
      ? positioned
          .filter((t) =>
            t.table.toLowerCase().includes(query.trim().toLowerCase()),
          )
          .slice(0, 10)
      : [];

  const moduleEntries = Object.entries(moduleBounds);

  return (
    <div className="flex h-screen h-dvh bg-erd-bg text-erd-text antialiased">
      {/* Sidebar */}
      <aside className="flex w-[290px] min-w-[290px] flex-col gap-4 overflow-y-auto border-r border-erd-border bg-erd-side p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-erd-text">
              ERD TemuDataku
            </h1>
            <div className="mt-1 font-mono text-[11.5px] text-erd-muted">
              {positioned.length} tabel &middot;{" "}
              {positioned.reduce((s, t) => s + t.columns.length, 0)} kolom
              &middot; {relations.length} relasi
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div
          className={
            "rounded-lg border p-2.5 text-xs " +
            (source === "fallback"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-erd-border bg-erd-panel")
          }
        >
          <div className="flex items-center gap-2">
            <span
              className={
                "h-2 w-2 flex-shrink-0 rounded-full " +
                (source === "fallback" ? "bg-amber-400" : "bg-emerald-400")
              }
            />
            <span className="text-erd-text">
              {source === "fallback" ? "Data cadangan" : "Live dari GitHub"}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Fetch ulang schema.prisma sekarang"
              className="ml-auto rounded-md border border-erd-border bg-erd-panel px-2 py-0.5 text-erd-text hover:border-erd-accent hover:text-erd-accent disabled:opacity-50"
            >
              {refreshing ? "..." : "↻"}
            </button>
          </div>
          {fetchedAt && (
            <div className="mt-1 font-mono text-[10.5px] text-erd-faint">
              dicek {new Date(fetchedAt).toLocaleTimeString("id-ID")}
            </div>
          )}
          {fetchError && (
            <div className="mt-1.5 text-[10.5px] leading-relaxed text-erd-warn">
              {fetchError}
            </div>
          )}
        </div>

        <div className="relative">
          <input
            placeholder="Cari nama tabel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-erd-border bg-erd-panel px-2.5 py-2 text-[13px] text-erd-text outline-none placeholder:text-erd-faint focus:border-erd-accent"
          />
          {results.length > 0 && (
            <div className="mt-1.5 flex max-h-[220px] flex-col gap-0.5 overflow-y-auto">
              {results.map((t) => (
                <div
                  key={t.table}
                  onClick={() => selectTable(t.idx, true)}
                  className="flex cursor-pointer justify-between gap-1.5 rounded-md px-2 py-1.5 font-mono text-xs text-erd-text hover:bg-erd-panel"
                >
                  <span>{t.table}</span>
                  <span className="text-[10px] font-sans text-erd-faint">
                    {t.module}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-erd-faint">
            Modul
          </div>
          <div className="flex flex-col gap-0.5">
            {moduleEntries.map(([mod, b]) => (
              <div
                key={mod}
                onClick={() => {
                  setActiveModule(mod);
                  clearSelection();
                  fitTo(b);
                }}
                className={
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-[12.5px] text-erd-text hover:bg-erd-panel " +
                  (activeModule === mod
                    ? "border-erd-border bg-erd-panel"
                    : "border-transparent")
                }
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: b.color }}
                />
                <span>{mod}</span>
                <span className="ml-auto font-mono text-[11px] text-erd-faint">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DetailPanel
          selected={selected}
          positioned={positioned}
          related={related}
          onJump={(idx) => selectTable(idx, true)}
        />

        <div className="mt-auto border-t border-erd-border pt-3 font-mono text-[11px] leading-relaxed text-erd-faint">
          {positioned.length} tabel &middot; {moduleEntries.length} modul
          <br />
          Live dari schema.prisma
        </div>
      </aside>

      {/* Kanvas + panel dokumentasi (di bawah kanvas) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          ref={viewportRef}
          className={styles.viewport + (isPanning ? " " + styles.panning : "")}
          onClick={handleCanvasClick}
        >
          <div
            className={styles.world}
            style={{
              transform: `translate(${transform.tx}px,${transform.ty}px) scale(${transform.scale})`,
            }}
            onClick={handleCanvasClick}
          >
            <svg
              className={styles.relLayer}
              width={worldW}
              height={worldH}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              {relations.map((r, i) => {
                const rel =
                  selected !== null &&
                  (r.srcIdx === selected || r.dstIdx === selected);
                const dimmed = selected !== null && !rel;
                return (
                  <path
                    key={i}
                    d={r.path}
                    className={
                      rel ? styles.hl : dimmed ? styles.dim : undefined
                    }
                  />
                );
              })}
            </svg>

            {moduleEntries.map(([mod, b]) => (
              <div
                key={mod}
                className={styles.modbg}
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.w,
                  height: b.h,
                  borderColor: b.color + "55",
                  background: b.color + "0c",
                }}
              >
                <span className={styles.modlabel} style={{ color: b.color }}>
                  {mod} <span className={styles.modcount}>({b.count})</span>
                </span>
              </div>
            ))}

            {positioned.map((t) => (
              <TableBox
                key={t.table}
                t={t}
                dim={relatedSet !== null && !relatedSet.has(t.idx)}
                hl={selected === t.idx}
                onClick={() => {
                  if (panState.current.moved) return;
                  selectTable(t.idx, false);
                }}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-[230px] rounded-lg border border-erd-border bg-erd-panel px-3 py-2 text-[11px] leading-relaxed text-erd-faint">
            🔑 = Primary Key &middot; 🔗 = Foreign Key &middot; scroll untuk
            zoom, Drag untuk geser, Klik tabel untuk highlight relasi dan buka
            dokumentasinya di bawah.
          </div>
          <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-erd-border bg-erd-panel px-2.5 py-1.5 font-mono text-[11px] text-erd-faint">
            {Math.round(transform.scale * 100)}%
          </div>
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              onClick={() =>
                setTransform((p) => ({
                  ...p,
                  scale: Math.min(3, p.scale * 1.25),
                }))
              }
              title="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-erd-border bg-erd-panel text-base text-erd-text hover:border-erd-accent hover:text-erd-accent"
            >
              +
            </button>
            <button
              onClick={() =>
                setTransform((p) => ({
                  ...p,
                  scale: Math.max(0.03, p.scale * 0.8),
                }))
              }
              title="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-erd-border bg-erd-panel text-base text-erd-text hover:border-erd-accent hover:text-erd-accent"
            >
              &minus;
            </button>
            <button
              onClick={() => {
                setActiveModule(null);
                fitTo({ x: -20, y: -20, w: worldW + 40, h: worldH + 40 });
              }}
              title="Fit semua"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-erd-border bg-erd-panel text-base text-erd-text hover:border-erd-accent hover:text-erd-accent"
            >
              &#9723;
            </button>
          </div>
        </div>

        {selected !== null && (
          <DocPanel
            table={positioned[selected]}
            color={MODULE_COLORS[positioned[selected].module] || "#888"}
            docs={docs}
            related={related ?? { out: [], in: [] }}
            positioned={positioned}
            heightFrac={docHeightFrac}
            onHeightChange={setDocHeightFrac}
            onJumpTable={jumpToTableName}
            onJumpIndex={(idx) => selectTable(idx, true)}
            onClose={clearSelection}
          />
        )}
      </div>
    </div>
  );
}

function TableBox({
  t,
  dim,
  hl,
  onClick,
}: {
  t: PositionedTable;
  dim: boolean;
  hl: boolean;
  onClick: () => void;
}) {
  const color = MODULE_COLORS[t.module] || "#888";
  return (
    <div
      className={
        styles.tbox +
        (dim ? " " + styles.dim : "") +
        (hl ? " " + styles.hl : "")
      }
      style={{ left: t.x, top: t.y, width: t.w }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      <div className={styles.thead} style={{ background: color }}>
        {t.table}
      </div>
      {t.columns.map((c) => (
        <div
          key={c.name}
          className={
            styles.trow +
            (c.pk ? " " + styles.ispk : "") +
            (c.fk ? " " + styles.isfk : "")
          }
        >
          <span className={styles.flag}>{c.pk ? "🔑" : c.fk ? "🔗" : ""}</span>
          <span className={styles.cname}>{c.name}</span>
          <span className={styles.ctype}>
            {c.type}
            {c.nullable ? "?" : ""}
            {c.unique && !c.pk ? " U" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function DetailPanel({
  selected,
  positioned,
  related,
  onJump,
}: {
  selected: number | null;
  positioned: PositionedTable[];
  related: { out: number[]; in: number[] } | null;
  onJump: (idx: number) => void;
}) {
  if (selected === null || !related) {
    return (
      <div className="border-t border-erd-border pt-3.5 text-xs leading-relaxed text-erd-faint">
        Klik sebuah tabel untuk lihat relasinya di sini.
      </div>
    );
  }
  const t = positioned[selected];
  return (
    <div className="border-t border-erd-border pt-3.5 text-xs leading-relaxed text-erd-muted">
      <b className="text-erd-text">{t.table}</b>
      <div className="mb-2 mt-0.5 text-[11px] text-erd-faint">{t.module}</div>
      {related.out.length > 0 && (
        <>
          <div className="mt-1.5 text-[10.5px] text-erd-faint">
            MENUNJUK KE (FK):
          </div>
          {[...new Set(related.out)].map((i) => (
            <span
              key={i}
              onClick={() => onJump(i)}
              className="block cursor-pointer py-0.5 font-mono text-[11px] text-erd-muted hover:text-erd-accent"
            >
              → {positioned[i].table}
            </span>
          ))}
        </>
      )}
      {related.in.length > 0 && (
        <>
          <div className="mt-2 text-[10.5px] text-erd-faint">DIRUJUK OLEH:</div>
          {[...new Set(related.in)].map((i) => (
            <span
              key={i}
              onClick={() => onJump(i)}
              className="block cursor-pointer py-0.5 font-mono text-[11px] text-erd-muted hover:text-erd-accent"
            >
              ← {positioned[i].table}
            </span>
          ))}
        </>
      )}
      {related.out.length === 0 && related.in.length === 0 && (
        <div className="text-erd-faint">Tidak ada relasi FK.</div>
      )}
    </div>
  );
}
