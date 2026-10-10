import { Fragment, type ReactNode } from "react";
import { parseMarkdownTable } from "@/lib/erd/parse-docs";

/**
 * Renderer markdown mini untuk isi dokumentasi tabel. Hanya mendukung subset
 * yang dipakai dokumen: paragraf, daftar (- / 1.), kutipan (>), tabel, serta
 * inline `kode`, **tebal**, dan *miring*. Semua dirender sebagai elemen React
 * (tidak ada dangerouslySetInnerHTML), jadi teks dokumen tidak bisa menyisipkan HTML.
 */

export interface MdContext {
  /** Nama semua tabel di ERD; `kode` yang cocok dijadikan tautan lompat. */
  tableNames: Set<string>;
  /** Tabel yang sedang dibuka (tidak perlu ditautkan ke dirinya sendiri). */
  current: string;
  onJump: (table: string) => void;
}

const INLINE = /(`[^`]+`|\*\*.+?\*\*|\*[^*\s][^*]*?\*)/g;

export function Inline({ text, ctx }: { text: string; ctx: MdContext }) {
  return <>{renderInline(text, ctx)}</>;
}

function renderInline(text: string, ctx: MdContext): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const code = part.slice(1, -1);
      // "users" atau "users.id" -> tautan ke tabel users
      const target = code.split(".")[0];
      if (target !== ctx.current && ctx.tableNames.has(target)) {
        return (
          <button
            key={i}
            type="button"
            onClick={() => ctx.onJump(target)}
            title={`Buka tabel ${target}`}
            className="rounded bg-erd-bg px-1 py-px font-mono text-[0.92em] text-erd-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            {code}
          </button>
        );
      }
      return (
        <code
          key={i}
          className={
            "rounded bg-erd-bg px-1 py-px font-mono text-[0.92em] text-erd-text" +
            // Kode pendek (mis. `custom()`) jangan dipatah di tengah kolom sempit.
            (code.length <= 16 ? " whitespace-nowrap" : "")
          }
        >
          {code}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-erd-text">
          {renderInline(part.slice(2, -2), ctx)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{renderInline(part.slice(1, -1), ctx)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "table"; text: string };

const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d+\.\s+(.*)$/;

function parseBlocks(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
    } else if (line.trimStart().startsWith("|")) {
      const start = i;
      while (i < lines.length && lines[i].trimStart().startsWith("|")) i++;
      blocks.push({ t: "table", text: lines.slice(start, i).join("\n") });
    } else if (line.trimStart().startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        buf.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ t: "quote", text: buf.join("\n") });
    } else if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = ORDERED.test(line);
      const marker = ordered ? ORDERED : BULLET;
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(marker);
        if (m) {
          items.push(m[1]);
          i++;
        } else if (
          lines[i].trim() !== "" &&
          items.length > 0 &&
          !BULLET.test(lines[i]) &&
          !ORDERED.test(lines[i]) &&
          !lines[i].trimStart().startsWith(">") &&
          !lines[i].trimStart().startsWith("|")
        ) {
          // baris lanjutan item sebelumnya (teks dibungkus ke baris berikutnya)
          items[items.length - 1] += " " + lines[i].trim();
          i++;
        } else break;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
    } else {
      const buf: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].trimStart().startsWith("|") &&
        !lines[i].trimStart().startsWith(">") &&
        !(buf.length > 0 && (BULLET.test(lines[i]) || ORDERED.test(lines[i])))
      ) {
        buf.push(lines[i].trim());
        i++;
      }
      blocks.push({ t: "p", text: buf.join(" ") });
    }
  }
  return blocks;
}

export function Markdown({ text, ctx }: { text: string; ctx: MdContext }) {
  if (!text.trim()) return null;
  return (
    <div className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-erd-muted">
      {parseBlocks(text).map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i}>{renderInline(b.text, ctx)}</p>;
          case "ul":
            return (
              <ul key={i} className="flex flex-col gap-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-[0.55em] h-1 w-1 flex-shrink-0 rounded-full bg-erd-faint" />
                    <span>{renderInline(it, ctx)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="flex flex-col gap-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="w-4 flex-shrink-0 text-right font-mono text-[11px] text-erd-faint">
                      {j + 1}.
                    </span>
                    <span>{renderInline(it, ctx)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <div
                key={i}
                className="rounded-md border-l-2 border-erd-accent/60 bg-erd-panel px-3 py-2"
              >
                <Markdown text={b.text} ctx={ctx} />
              </div>
            );
          case "table": {
            const tbl = parseMarkdownTable(b.text);
            if (!tbl) return <p key={i}>{b.text}</p>;
            return (
              <MdTable key={i} head={tbl.head} rows={tbl.rows} ctx={ctx} />
            );
          }
        }
      })}
    </div>
  );
}

export function MdTable({
  head,
  rows,
  ctx,
  firstColMono = false,
}: {
  head: string[];
  rows: string[][];
  ctx: MdContext;
  firstColMono?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-erd-border">
      <table className="w-full border-collapse text-left text-[12px] leading-snug">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="sticky top-0 whitespace-nowrap border-b border-erd-border bg-erd-panel px-2.5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-erd-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-erd-border/60 last:border-b-0 hover:bg-erd-panel/60"
            >
              {r.map((c, j) => (
                <td
                  key={j}
                  className={
                    "px-2.5 py-1.5 align-top text-erd-muted [overflow-wrap:anywhere] " +
                    (j === 0
                      ? "whitespace-nowrap font-medium text-erd-text "
                      : "") +
                    (firstColMono && j === 0 ? "font-mono " : "")
                  }
                >
                  {renderInline(c, ctx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
