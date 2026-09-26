import { T, type TLShape, type RecordProps } from "tldraw";

export interface EntityRow {
  id: string;
  name: string;
  dataType: string;
  isPK: boolean;
  isFK: boolean;
}

const entityRowValidator = T.object({
  id: T.string,
  name: T.string,
  dataType: T.string,
  isPK: T.boolean,
  isFK: T.boolean,
});

export interface EntityTableShapeProps {
  w: number;
  // h is not independently editable — always derived from rows.length (see getTableHeight).
  h: number;
  tableName: string;
  rows: EntityRow[];
}

// Registers "entity-table" into tldraw's closed TLShape union — required for any custom shape,
// see https://tldraw.dev/docs/shapes.
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
  rows: T.arrayOf(entityRowValidator),
};

export const HEADER_HEIGHT = 36;
export const ROW_HEIGHT = 28;
export const MIN_TABLE_WIDTH = 260;
export const DEFAULT_TABLE_WIDTH = 260;

export function getTableHeight(rowCount: number): number {
  return HEADER_HEIGHT + Math.max(rowCount, 1) * ROW_HEIGHT;
}
