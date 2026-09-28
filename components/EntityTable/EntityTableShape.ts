import { T, type TLShape, type RecordProps } from "tldraw";

export type EntityRow = { id: string; name: string; dataType: string; isPK: boolean; isFK: boolean };

export interface EntityTableShapeProps {
  w: number;
  // Not edited on its own: always derived from rows.length (see getTableHeight).
  h: number;
  tableName: string;
  rows: EntityRow[];
}

// Registers "entity-table" in tldraw's shape union, required for any custom shape
// (https://tldraw.dev/docs/shapes).
declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    "entity-table": EntityTableShapeProps;
  }
}

export type EntityTableShape = TLShape<"entity-table">;

export const entityTableProps: RecordProps<EntityTableShape> = {
  w: T.number,
  h: T.number,
  tableName: T.string,
  rows: T.arrayOf(T.object({ id: T.string, name: T.string, dataType: T.string, isPK: T.boolean, isFK: T.boolean })),
};

export const HEADER_HEIGHT = 36;
export const ROW_HEIGHT = 28;
export const TABLE_WIDTH = 260;

export function getTableHeight(rowCount: number) {
  return HEADER_HEIGHT + Math.max(rowCount, 1) * ROW_HEIGHT;
}

// crypto.randomUUID(), not Date.now(): rapid clicks could otherwise create duplicate row ids.
export function newRow(row: Partial<EntityRow> = {}): EntityRow {
  return { id: crypto.randomUUID(), name: "", dataType: "text", isPK: false, isFK: false, ...row };
}

// The vertical center of a row, as a 0-1 fraction of the table's height (an arrow anchor).
export function rowAnchorY(rowIndex: number, rowCount: number) {
  return (HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2) / getTableHeight(rowCount);
}
