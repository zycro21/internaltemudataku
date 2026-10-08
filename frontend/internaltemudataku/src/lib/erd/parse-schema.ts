import type { TableDef, ColumnDef } from "./types";

/**
 * Parses raw Prisma schema source text into the TableDef[] shape the ERD
 * viewer consumes. This is the TypeScript twin of
 * scripts/generate-erd-data.mjs -- that script is for offline/local
 * generation (writes data/erd-data.json to disk), this function is for the
 * live API route (app/api/erd-data/route.ts), which fetches schema.prisma
 * from GitHub on every request and parses it in-memory. Keep the two in
 * sync if you change the parsing rules.
 */

const SCALAR_TYPES = new Set([
  "DateTime",
  "Json",
  "JsonB",
  "Decimal",
  "Int",
  "String",
  "Boolean",
  "Float",
  "BigInt",
  "Bytes",
]);

interface RawField {
  name: string;
  type: string;
  nullable: boolean;
  list: boolean;
  isRelationField: boolean;
  pk: boolean;
  unique: boolean;
}

export function parsePrismaSchema(
  src: string,
  moduleMap: Record<string, string>,
): TableDef[] {
  const enumNames = new Set(
    [...src.matchAll(/^\s*enum\s+(\w+)/gm)].map((m) => m[1]),
  );

  const modelRe = /^\s*model\s+(\w+)\s*\{([\s\S]*?)^\s*\}/gm;

  const models: Record<
    string,
    {
      table: string;
      fields: RawField[];
      relationFkCols: Record<string, string>;
    }
  > = {};
  const order: string[] = [];

  for (const m of src.matchAll(modelRe)) {
    const name = m[1];
    const body = m[2];
    order.push(name);

    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    const table = mapMatch ? mapMatch[1] : name.toLowerCase();

    const fields: RawField[] = [];
    const relationFkCols: Record<string, string> = {};

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (
        !line ||
        line.startsWith("//") ||
        line.startsWith("@@") ||
        line.startsWith("/")
      ) {
        continue;
      }

      const fm = line.match(/^(\w+)\s+([A-Za-z_][\w[\]?.]*)/);
      if (!fm) continue;
      const fname = fm[1];
      const ftypeRaw = fm[2];

      const nullable = ftypeRaw.endsWith("?");
      const isList = ftypeRaw.endsWith("[]");
      const ftype = ftypeRaw.replace(/\?$/, "").replace(/\[\]$/, "");

      const isEnum = enumNames.has(ftype);
      const isRelationField =
        !isEnum &&
        (line.includes("@relation") ||
          (/^[A-Z]/.test(ftype) && !SCALAR_TYPES.has(ftype)));

      const relFieldsMatch = line.match(/fields:\s*\[([^\]]+)\]/);
      if (relFieldsMatch && isRelationField) {
        for (const c of relFieldsMatch[1].split(",").map((s) => s.trim())) {
          relationFkCols[c] = ftype; // target model name
        }
      }

      fields.push({
        name: fname,
        type: ftype,
        nullable,
        list: isList,
        isRelationField,
        pk: /@id\b/.test(line),
        unique: /@unique\b/.test(line),
      });
    }

    models[name] = { table, fields, relationFkCols };
  }

  const modelToTable: Record<string, string> = {};
  for (const [name, m] of Object.entries(models)) modelToTable[name] = m.table;

  return order.map((name) => {
    const md = models[name];
    const columns: ColumnDef[] = md.fields
      .filter((f) => !f.isRelationField)
      .map((f) => {
        const fkTargetModel = md.relationFkCols[f.name];
        const fkTargetTable = fkTargetModel
          ? (modelToTable[fkTargetModel] ?? null)
          : null;
        return {
          name: f.name,
          type: f.type + (f.list ? "[]" : ""),
          pk: f.pk,
          fk: fkTargetTable,
          unique: f.unique,
          nullable: f.nullable,
        };
      });

    return {
      table: md.table,
      model: name,
      module: moduleMap[md.table] || "Lainnya",
      columns,
    };
  });
}
