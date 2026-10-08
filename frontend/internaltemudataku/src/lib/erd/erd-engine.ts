import type { TableDef, PositionedTable, ModuleBounds } from "./types";

export const MODULE_COLORS: Record<string, string> = {
  "User & Role": "#6c8ef5",
  "Mentoring & Booking": "#4fbf8b",
  AYCL: "#f5a623",
  "E-Learning": "#e85d9e",
  Practice: "#39c3c9",
  "Payment & Withdrawal": "#f76e6e",
  "Affiliator & Referral": "#b983ff",
  "Voucher & Redeem Code": "#ffd166",
  Article: "#5dd39e",
  "Modul Pendukung": "#9aa5b1",
  "Job Board (Dummy)": "#7d8896",
};
const FALLBACK_COLOR = "#888";

const COL_GAP = 34;
const ROW_GAP = 34;
const MOD_GAP_X = 90;
const MOD_GAP_Y = 90;
const BOX_W = 232;
const MAX_ROW_W = 5400;
const ROW_H = 19;
const LABEL_H = 44;

/** Computes absolute positions for every table, grouped and boxed by module. */
export function layoutTables(tables: TableDef[]): {
  positioned: PositionedTable[];
  moduleBounds: Record<string, ModuleBounds>;
  worldW: number;
  worldH: number;
} {
  const byModule: Record<string, PositionedTable[]> = {};
  const positioned: PositionedTable[] = tables.map((t, idx) => ({
    ...t,
    idx,
    x: 0,
    y: 0,
    w: BOX_W,
    h: 34 + t.columns.length * ROW_H + 8,
  }));
  positioned.forEach((t) => {
    (byModule[t.module] ||= []).push(t);
  });

  const moduleNames = Object.keys(byModule).sort(
    (a, b) => byModule[b].length - byModule[a].length
  );

  const moduleBounds: Record<string, ModuleBounds> = {};
  let cursorX = 0;
  let cursorY = 0;
  let rowMaxH = 0;

  moduleNames.forEach((mod) => {
    const tabs = byModule[mod];
    const n = tabs.length;
    const cols = Math.max(1, Math.round(Math.sqrt(n * 1.5)));

    let cx = 0;
    let cy = 0;
    let curRowH = 0;
    let colCount = 0;
    let modW = 0;

    tabs.forEach((t) => {
      (t as any).relX = cx;
      (t as any).relY = cy;
      curRowH = Math.max(curRowH, t.h);
      cx += t.w + COL_GAP;
      colCount++;
      if (colCount >= cols) {
        modW = Math.max(modW, cx - COL_GAP);
        cy += curRowH + ROW_GAP;
        cx = 0;
        curRowH = 0;
        colCount = 0;
      }
    });
    if (colCount > 0) {
      modW = Math.max(modW, cx - COL_GAP);
      cy += curRowH;
    }
    const modH = cy;

    if (cursorX > 0 && cursorX + modW > MAX_ROW_W) {
      cursorX = 0;
      cursorY += rowMaxH + MOD_GAP_Y;
      rowMaxH = 0;
    }

    tabs.forEach((t) => {
      t.x = cursorX + (t as any).relX;
      t.y = cursorY + (t as any).relY + LABEL_H;
    });

    moduleBounds[mod] = {
      x: cursorX - 22,
      y: cursorY,
      w: modW + 44,
      h: modH + LABEL_H + 22,
      color: MODULE_COLORS[mod] || FALLBACK_COLOR,
      count: n,
    };

    cursorX += modW + MOD_GAP_X;
    rowMaxH = Math.max(rowMaxH, modH + LABEL_H + 22);
  });

  let worldW = 0;
  let worldH = 0;
  Object.values(moduleBounds).forEach((b) => {
    worldW = Math.max(worldW, b.x + b.w);
    worldH = Math.max(worldH, b.y + b.h);
  });

  return { positioned, moduleBounds, worldW, worldH };
}

export interface RelationEdge {
  srcIdx: number;
  dstIdx: number;
  path: string;
}

function boxCenter(t: PositionedTable) {
  return { x: t.x + t.w / 2, y: t.y + t.h / 2 };
}

function boxEdgePoint(t: PositionedTable, towardY: number) {
  const c = boxCenter(t);
  const y = towardY - c.y > 0 ? t.y + t.h : t.y;
  return { x: c.x, y };
}

/** Builds curved SVG path data for every FK relation. */
export function buildRelations(positioned: PositionedTable[]): RelationEdge[] {
  const byTable = new Map(positioned.map((t) => [t.table, t]));
  const edges: RelationEdge[] = [];

  positioned.forEach((t) => {
    t.columns.forEach((col) => {
      if (!col.fk) return;
      const target = byTable.get(col.fk);
      if (!target || target.idx === t.idx) return;

      const c1 = boxCenter(t);
      const c2 = boxCenter(target);
      const p1 = boxEdgePoint(t, c2.y);
      const p2 = boxEdgePoint(target, c1.y);
      const midY = (p1.y + p2.y) / 2;
      const d = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
      edges.push({ srcIdx: t.idx, dstIdx: target.idx, path: d });
    });
  });

  return edges;
}

export function relatedIndices(positioned: PositionedTable[], idx: number) {
  const table = positioned[idx];
  const out = new Set<number>();
  const inSet = new Set<number>();

  table.columns.forEach((c) => {
    if (!c.fk) return;
    const target = positioned.find((p) => p.table === c.fk);
    if (target) out.add(target.idx);
  });
  positioned.forEach((other) => {
    other.columns.forEach((c) => {
      if (c.fk === table.table) inSet.add(other.idx);
    });
  });

  return { out: [...out], in: [...inSet] };
}

export function boundsForTable(t: PositionedTable, pad = 160) {
  return { x: t.x - pad, y: t.y - pad, w: t.w + pad * 2, h: t.h + pad * 2 };
}