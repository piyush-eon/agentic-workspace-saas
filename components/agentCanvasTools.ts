import { z } from "zod";

// Fine-grained tool schemas for the canvas agent — one tool per shape primitive rather than one
// big "draw a diagram" tool, so each call is a single animatable step (see plan doc's rationale
// for the live agent cursor). Every tool takes a caller-assigned `id` so the model can reference
// a shape it just created later in the same turn, before any round-trip back to it.
//
// These are pure schemas, not yet wrapped in the AI SDK's tool() — kept separate so the schema
// design isn't blocked on confirming the exact tool() call shape for the installed SDK version.
// Actual client-side execution (against the live tldraw editor) lives in a separate module.

const point = z.object({ x: z.number(), y: z.number() });

export const createRectangleInput = z.object({
  id: z.string().describe("Caller-assigned unique id for this shape, e.g. 'rect-1'"),
  position: point,
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
});

export const createEllipseInput = z.object({
  id: z.string().describe("Caller-assigned unique id for this shape, e.g. 'ellipse-1'"),
  position: point,
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
});

export const createTextInput = z.object({
  id: z.string().describe("Caller-assigned unique id for this shape, e.g. 'text-1'"),
  position: point,
  text: z.string(),
  fontSize: z.number().optional(),
});

export const createArrowInput = z.object({
  id: z.string().describe("Caller-assigned unique id for this shape, e.g. 'arrow-1'"),
  fromShapeId: z.string().describe("id of the shape this arrow starts at"),
  toShapeId: z.string().describe("id of the shape this arrow ends at"),
  label: z.string().optional(),
});

export const updateShapeInput = z.object({
  id: z.string().describe("id of the shape to update"),
  position: point.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string().optional(),
});

export const deleteShapeInput = z.object({
  id: z.string().describe("id of the shape to delete"),
});

// --- ERD entity-table tools --------------------------------------------------------------

export const createEntityTableInput = z.object({
  id: z.string().describe("Caller-assigned unique id for this table, e.g. 'table-users'"),
  position: point,
  tableName: z.string(),
  columns: z
    .array(
      z.object({
        name: z.string(),
        dataType: z.string().describe("e.g. 'uuid', 'text', 'timestamptz', 'int'"),
        isPK: z.boolean().default(false),
        isFK: z.boolean().default(false),
      }),
    )
    .describe("Initial columns for the table, in order"),
});

export const addColumnInput = z.object({
  tableId: z.string().describe("id of the entity-table to add a column to"),
  name: z.string(),
  dataType: z.string(),
  isPK: z.boolean().default(false),
  isFK: z.boolean().default(false),
});

export const updateColumnInput = z.object({
  tableId: z.string(),
  columnName: z.string().describe("current name of the column to update"),
  name: z.string().optional(),
  dataType: z.string().optional(),
  isPK: z.boolean().optional(),
  isFK: z.boolean().optional(),
});

export const removeColumnInput = z.object({
  tableId: z.string(),
  columnName: z.string(),
});

export const connectRelationshipInput = z.object({
  id: z.string().describe("Caller-assigned unique id for the relationship arrow"),
  fromTableId: z.string().describe("id of the table on the primary-key side"),
  fromColumnName: z.string().describe("name of the primary-key column"),
  toTableId: z.string().describe("id of the table on the foreign-key side"),
  toColumnName: z.string().describe("name of the foreign-key column"),
});

export const AGENT_CANVAS_TOOL_SCHEMAS = {
  createRectangle: createRectangleInput,
  createEllipse: createEllipseInput,
  createText: createTextInput,
  createArrow: createArrowInput,
  updateShape: updateShapeInput,
  deleteShape: deleteShapeInput,
  createEntityTable: createEntityTableInput,
  addColumn: addColumnInput,
  updateColumn: updateColumnInput,
  removeColumn: removeColumnInput,
  connectRelationship: connectRelationshipInput,
} as const;
