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