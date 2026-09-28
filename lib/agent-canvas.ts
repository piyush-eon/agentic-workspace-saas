import {
  createShapeId,
  toRichText,
  type Editor,
  type TLShape,
  type TLShapeId,
  type TLShapePartial,
  type VecModel,
} from "tldraw";
import { TABLE_WIDTH, getTableHeight, newRow, rowAnchorY, type EntityRow, type EntityTableShape } from "@/components/EntityTable/EntityTableShape";
import { canvasToolDefs, fail, normalizeModelText, ok, type ToolResult } from "@/lib/agent-tools";

// Maps the model's caller-assigned ids ("rect-1") to real tldraw ids, so later calls in the same
// chat can reference shapes it just created. Pre-existing shapes are referenced by their real ids.
export type ShapeIdMap = Map<string, TLShapeId>;

// Compact state sent with every request, so the model only references shapes that exist.
export function summarizeCanvas(editor: Editor) {
  const shapes = editor.getCurrentPageShapes();
  if (shapes.length === 0) return "(empty canvas)";
  return shapes.map(summarizeShape).join("\n");
}

function summarizeShape(shape: TLShape) {
  const base = `- id: ${shape.id}, type: ${shape.type}, position: (${Math.round(shape.x)}, ${Math.round(shape.y)})`;
  if (shape.type === "entity-table") {
    const { tableName, rows } = (shape as EntityTableShape).props;
    const columns = rows.map((r) => `${r.name}:${r.dataType}${r.isPK ? " PK" : ""}${r.isFK ? " FK" : ""}`);
    return `${base}, table: "${tableName}", columns: [${columns.join(", ")}]`;
  }
  const text = "richText" in shape.props ? plainText(shape.props.richText) : "";
  return text ? `${base}, label: "${text}"` : base;
}

// tldraw's richText is a small ProseMirror JSON doc; the agent only needs its text.
function plainText(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  const { text, content } = node as { text?: string; content?: unknown[] };
  return [text ?? "", ...(content ?? []).map(plainText)].filter(Boolean).join(" ");
}

const richText = (text: string) => toRichText(normalizeModelText(text));

function resolveNewId(idMap: ShapeIdMap, callerId: string) {
  const id = idMap.get(callerId) ?? createShapeId();
  idMap.set(callerId, id);
  return id;
}

function lookupShape(editor: Editor, idMap: ShapeIdMap, id: string) {
  return editor.getShape(idMap.get(id) ?? (id as TLShapeId));
}

function lookupTable(editor: Editor, idMap: ShapeIdMap, id: string) {
  const shape = lookupShape(editor, idMap, id);
  return shape?.type === "entity-table" ? (shape as EntityTableShape) : undefined;
}

// Where an arrow should attach on a table: the vertical center of the named column's row.
function rowAnchor(table: EntityTableShape, columnName: string): VecModel {
  const index = table.props.rows.findIndex((r) => r.name === columnName);
  return { x: 0.5, y: index === -1 ? 0.5 : rowAnchorY(index, table.props.rows.length) };
}

function createArrowBetween(
  editor: Editor,
  arrowId: TLShapeId,
  from: { id: TLShapeId; anchor?: VecModel },
  to: { id: TLShapeId; anchor?: VecModel },
  label?: string
) {
  const fromBounds = editor.getShapePageBounds(from.id);
  const toBounds = editor.getShapePageBounds(to.id);
  if (!fromBounds || !toBounds) return fail("Could not resolve shape bounds");

  editor.createShape({
    id: arrowId,
    type: "arrow",
    props: {
      // Plain {x, y}: tldraw records can't hold class instances like the Vec that .center returns.
      start: { x: fromBounds.center.x, y: fromBounds.center.y },
      end: { x: toBounds.center.x, y: toBounds.center.y },
      ...(label && { richText: richText(label) }),
    },
  });
  for (const [terminal, end] of [["start", from], ["end", to]] as const) {
    editor.createBinding({
      type: "arrow",
      fromId: arrowId,
      toId: end.id,
      props: {
        terminal,
        normalizedAnchor: end.anchor ?? { x: 0.5, y: 0.5 },
        isPrecise: !!end.anchor,
        isExact: false,
      },
    });
  }
  return ok();
}

function fontSizeToStyle(px: number) {
  if (px <= 18) return "s";
  if (px <= 24) return "m";
  if (px <= 36) return "l";
  return "xl";
}

export function executeCanvasTool(editor: Editor, idMap: ShapeIdMap, toolName: string, rawInput: unknown): ToolResult {
  const defs = canvasToolDefs;
  switch (toolName) {
    case "createRectangle":
    case "createEllipse": {
      const input = defs[toolName].inputSchema.parse(rawInput);
      editor.createShape({
        id: resolveNewId(idMap, input.id),
        type: "geo",
        x: input.position.x,
        y: input.position.y,
        props: {
          geo: toolName === "createRectangle" ? "rectangle" : "ellipse",
          w: input.width,
          h: input.height,
          ...(input.label && { richText: richText(input.label) }),
        },
      });
      return ok();
    }

    case "createText": {
      const input = defs.createText.inputSchema.parse(rawInput);
      editor.createShape({
        id: resolveNewId(idMap, input.id),
        type: "text",
        x: input.position.x,
        y: input.position.y,
        props: { richText: richText(input.text), ...(input.fontSize && { size: fontSizeToStyle(input.fontSize) }) },
      });
      return ok();
    }

    case "createArrow": {
      const input = defs.createArrow.inputSchema.parse(rawInput);
      const from = lookupShape(editor, idMap, input.fromShapeId);
      const to = lookupShape(editor, idMap, input.toShapeId);
      if (!from || !to) return fail("fromShapeId or toShapeId does not refer to a known shape");
      return createArrowBetween(editor, resolveNewId(idMap, input.id), { id: from.id }, { id: to.id }, input.label);
    }

    case "updateShape": {
      const input = defs.updateShape.inputSchema.parse(rawInput);
      const shape = lookupShape(editor, idMap, input.id);
      if (!shape) return fail("Unknown shape id");
      // Shape type is only known at runtime, so the patch uses tldraw's loose partial type.
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        ...(input.position && { x: input.position.x, y: input.position.y }),
        props: {
          ...(input.width && { w: input.width }),
          ...(input.height && { h: input.height }),
          ...(input.label && "richText" in shape.props && { richText: richText(input.label) }),
        },
      } as TLShapePartial<TLShape>);
      return ok();
    }

    case "deleteShape": {
      const input = defs.deleteShape.inputSchema.parse(rawInput);
      const shape = lookupShape(editor, idMap, input.id);
      if (!shape) return fail("Unknown shape id");
      editor.deleteShape(shape.id);
      return ok();
    }

    case "createEntityTable": {
      const input = defs.createEntityTable.inputSchema.parse(rawInput);
      const rows = input.columns.map(newRow);
      editor.createShape<EntityTableShape>({
        id: resolveNewId(idMap, input.id),
        type: "entity-table",
        x: input.position.x,
        y: input.position.y,
        props: { w: TABLE_WIDTH, h: getTableHeight(rows.length), tableName: input.tableName, rows },
      });
      return ok();
    }

    case "addColumn":
    case "updateColumn":
    case "removeColumn": {
      const { tableId, ...column } = defs[toolName].inputSchema.parse(rawInput);
      const table = lookupTable(editor, idMap, tableId);
      if (!table) return fail("Unknown table id");
      const rows = columnRows(table.props.rows, toolName, column);
      if (!rows) return fail(`No column named "${"columnName" in column ? column.columnName : ""}"`);
      editor.updateShape<EntityTableShape>({
        id: table.id,
        type: "entity-table",
        props: { rows, h: getTableHeight(rows.length) },
      });
      return ok();
    }

    case "connectRelationship": {
      const input = defs.connectRelationship.inputSchema.parse(rawInput);
      const fromTable = lookupTable(editor, idMap, input.fromTableId);
      const toTable = lookupTable(editor, idMap, input.toTableId);
      if (!fromTable || !toTable) return fail("Unknown table id");
      return createArrowBetween(
        editor,
        resolveNewId(idMap, input.id),
        { id: fromTable.id, anchor: rowAnchor(fromTable, input.fromColumnName) },
        { id: toTable.id, anchor: rowAnchor(toTable, input.toColumnName) }
      );
    }

    default:
      return fail(`Unknown canvas tool: ${toolName}`);
  }
}

type ColumnInput =
  | { name: string; dataType: string; isPK: boolean; isFK: boolean }
  | { columnName: string; name?: string; dataType?: string; isPK?: boolean; isFK?: boolean };

// Returns the table's new rows, or null when the named column doesn't exist.
function columnRows(rows: EntityRow[], toolName: string, input: ColumnInput): EntityRow[] | null {
  if (!("columnName" in input)) return [...rows, newRow(input)];
  if (!rows.some((r) => r.name === input.columnName)) return null;
  if (toolName === "removeColumn") return rows.filter((r) => r.name !== input.columnName);

  const { columnName, ...changes } = input;
  const defined = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
  return rows.map((r) => (r.name === columnName ? { ...r, ...defined } : r));
}
