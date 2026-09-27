import { z } from "zod";

// Single source for every agent tool: the API route wraps these in the AI SDK's tool() (with no
// `execute`, so they run client-side), and the browser parses inputs with the same schemas.
// Canvas tools are fine-grained (one call per shape) and take a caller-assigned `id`, so the
// model can reference a shape it just created later in the same turn.

const point = z.object({ x: z.number(), y: z.number() });
const shapeId = (example: string) => z.string().describe(`Caller-assigned unique id, e.g. '${example}'`);
const boxShape = (example: string) =>
  z.object({ id: shapeId(example), position: point, width: z.number(), height: z.number(), label: z.string().optional() });

export const canvasToolDefs = {
  createRectangle: { description: "Create a rectangle on the canvas.", inputSchema: boxShape("rect-1") },
  createEllipse: { description: "Create an ellipse on the canvas.", inputSchema: boxShape("ellipse-1") },
  createText: {
    description: "Create a text label on the canvas.",
    inputSchema: z.object({ id: shapeId("text-1"), position: point, text: z.string(), fontSize: z.number().optional() }),
  },
  createArrow: {
    description: "Create an arrow connecting two existing shapes by their ids.",
    inputSchema: z.object({
      id: shapeId("arrow-1"),
      fromShapeId: z.string().describe("id of the shape this arrow starts at"),
      toShapeId: z.string().describe("id of the shape this arrow ends at"),
      label: z.string().optional(),
    }),
  },
  updateShape: {
    description: "Update an existing shape's position, size, or label.",
    inputSchema: z.object({
      id: z.string().describe("id of the shape to update"),
      position: point.optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      label: z.string().optional(),
    }),
  },
  deleteShape: {
    description: "Delete a shape from the canvas.",
    inputSchema: z.object({ id: z.string().describe("id of the shape to delete") }),
  },
  createEntityTable: {
    description: "Create an ERD entity-table (a database table box with a name and typed columns) on the canvas.",
    inputSchema: z.object({
      id: shapeId("table-users"),
      position: point,
      tableName: z.string(),
      columns: z
        .array(
          z.object({
            name: z.string(),
            dataType: z.string().describe("e.g. 'uuid', 'text', 'timestamptz', 'int'"),
            isPK: z.boolean().default(false),
            isFK: z.boolean().default(false),
          })
        )
        .describe("Initial columns, in order"),
    }),
  },
  addColumn: {
    description: "Add a column to an existing entity-table.",
    inputSchema: z.object({
      tableId: z.string().describe("id of the entity-table"),
      name: z.string(),
      dataType: z.string(),
      isPK: z.boolean().default(false),
      isFK: z.boolean().default(false),
    }),
  },
  updateColumn: {
    description: "Update a column on an entity-table (rename, retype, or toggle PK/FK).",
    inputSchema: z.object({
      tableId: z.string(),
      columnName: z.string().describe("current name of the column"),
      name: z.string().optional(),
      dataType: z.string().optional(),
      isPK: z.boolean().optional(),
      isFK: z.boolean().optional(),
    }),
  },
  removeColumn: {
    description: "Remove a column from an entity-table.",
    inputSchema: z.object({ tableId: z.string(), columnName: z.string() }),
  },
  connectRelationship: {
    description:
      "Draw a foreign-key arrow from a primary-key column on one entity-table to the matching foreign-key column on another.",
    inputSchema: z.object({
      id: shapeId("rel-1"),
      fromTableId: z.string().describe("id of the table on the primary-key side"),
      fromColumnName: z.string().describe("name of the primary-key column"),
      toTableId: z.string().describe("id of the table on the foreign-key side"),
      toColumnName: z.string().describe("name of the foreign-key column"),
    }),
  },
};

const markdown = z.string().describe("Content as Markdown: headings, lists, checklists, tables, code, bold, links");

export const docToolDefs = {
  insertDocContent: {
    description: "Add content to the doc, at the end or after a given block.",
    inputSchema: z.object({
      markdown,
      afterBlockId: z.string().optional().describe("Insert after this block id; omit to append at the end"),
    }),
  },
  updateDocBlock: {
    description: "Rewrite one existing block of the doc (it may become several blocks).",
    inputSchema: z.object({ blockId: z.string(), markdown }),
  },
  deleteDocBlocks: {
    description: "Delete blocks from the doc.",
    inputSchema: z.object({ blockIds: z.array(z.string()).min(1) }),
  },
  replaceDoc: {
    description: "Replace the entire doc. Use only for a full rewrite or a brand-new doc.",
    inputSchema: z.object({ markdown }),
  },
};

export const agentToolDefs = { ...canvasToolDefs, ...docToolDefs };

export type ToolResult = { success: true } | { success: false; error: string };
export const ok = (): ToolResult => ({ success: true });
export const fail = (error: string): ToolResult => ({ success: false, error });

// Gemini sometimes escapes newlines as a literal "\n" inside tool arguments. Only unescape when
// the text has no real line breaks, so code that genuinely contains "\n" stays intact.
export function normalizeModelText(text: string) {
  return text.includes("\n") ? text : text.replace(/\\n/g, "\n");
}
