import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { streamText, convertToModelMessages, tool, type UIMessage } from "ai";
import { AGENT_CANVAS_TOOL_SCHEMAS } from "@/components/agentCanvasTools";

// Every tool below omits `execute` — that marks it as client-side-only in the AI SDK's client
// tool pattern. The actual shape mutation happens in the browser against the live tldraw editor
// (see useCanvasAgentChat.ts), since there's no server-side canvas state to mutate against.
const tools = {
  createRectangle: tool({
    description: "Create a rectangle shape on the canvas.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.createRectangle,
  }),
  createEllipse: tool({
    description: "Create an ellipse shape on the canvas.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.createEllipse,
  }),
  createText: tool({
    description: "Create a text label on the canvas.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.createText,
  }),
  createArrow: tool({
    description: "Create an arrow connecting two existing shapes by their ids.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.createArrow,
  }),
  updateShape: tool({
    description: "Update an existing shape's position, size, or label.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.updateShape,
  }),
  deleteShape: tool({
    description: "Delete a shape from the canvas.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.deleteShape,
  }),
  createEntityTable: tool({
    description:
      "Create an ERD entity-table shape (a database table box with a name and a list of typed columns) on the canvas.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.createEntityTable,
  }),
  addColumn: tool({
    description: "Add a column to an existing entity-table.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.addColumn,
  }),
  updateColumn: tool({
    description:
      "Update an existing column on an entity-table (rename, retype, or toggle PK/FK).",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.updateColumn,
  }),
  removeColumn: tool({
    description: "Remove a column from an entity-table.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.removeColumn,
  }),
  connectRelationship: tool({
    description:
      "Draw a foreign-key relationship arrow from a primary-key column on one entity-table to a column on another, marking the target column as a foreign key.",
    inputSchema: AGENT_CANVAS_TOOL_SCHEMAS.connectRelationship,
  }),
};

const SYSTEM_PROMPT = `You are Outpost's canvas agent. You draw and edit diagrams on an infinite whiteboard by calling tools: one tool call per shape or edit, never by describing what you would draw in text. Never use em dashes in your replies.

Use fine-grained calls: to draw a flowchart, call createRectangle/createEllipse/createText/createArrow once per shape, not one big composite action. Every shape you create needs a unique caller-assigned "id" string (e.g. "rect-1") so you can reference it later in the same turn (e.g. an arrow's fromShapeId/toShapeId) before any round-trip back to you.

For entity-relationship diagrams, prefer the ERD tools (createEntityTable, addColumn, updateColumn, removeColumn, connectRelationship) over generic rectangles, since they render as proper database table boxes with typed columns and PK/FK badges.

Layout rules: diagrams must never look cluttered or have overlapping shapes. The canvas is infinite: do NOT try to fit everything into a small area or near (0,0). Spread out as far as needed, there is no viewport to fit into, the user can pan/zoom.

You choose each box's width/height yourself, based on how much text the label needs (a short label like "Start" might be 140x80; a longer label needing 2-3 lines might be 260x140). Because sizes vary, spacing must be computed from actual sizes, not a fixed grid:

- Before placing a shape, know the width/height you're about to give it AND the width/height of the shape(s) already placed near where you're about to put it.
- Vertical gap between a box and the box below it must be at least 100px of empty space (i.e. next box's y >= previous box's y + previous box's height + 100).
- Horizontal gap between side-by-side boxes (e.g. Yes/No branches) must be at least 120px of empty space (i.e. next box's x >= previous box's x + previous box's width + 120).
- Walk through your planned layout step by step, box by box, adding up actual positions and sizes as you go. Don't just pick round numbers and hope they don't collide.
- A title (createText) goes above the whole diagram with at least 100px of clearance from the topmost box, horizontally centered over the diagram, never overlapping any box.
- For entity-relationship diagrams, give each table its own column with at least 150px of horizontal clearance from neighboring tables, since tables can be tall depending on column count.

The current canvas state (existing shapes and their ids) is provided in the system context below on every turn. Only ever reference shape ids that actually exist there or that you create earlier in the same turn. Never invent an id.`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const {
    messages,
    canvasContext,
  }: { messages: UIMessage[]; canvasContext?: string } = await req.json();

  const result = streamText({
    model: google("gemini-3.5-flash-lite"),
    system: canvasContext
      ? `${SYSTEM_PROMPT}\n\nCurrent canvas state:\n${canvasContext}`
      : SYSTEM_PROMPT,
    tools,
    messages: await convertToModelMessages(messages),
    providerOptions: {
      google: {
        thinkingConfig: { includeThoughts: true },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
