"use client";

import { useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { createShapeId, toRichText, type Editor, type TLShapeId, type TLShapePartial, type TLShape } from "tldraw";
import { AGENT_CANVAS_TOOL_SCHEMAS } from "@/components/agentCanvasTools";
import type { EntityRow, EntityTableShape } from "@/components/EntityTable/EntityTableShape";
import { getTableHeight, DEFAULT_TABLE_WIDTH } from "@/components/EntityTable/EntityTableShape";

// Maps the model's caller-assigned tool ids ("rect-1") to tldraw's own branded shape ids, so a
// later tool call in the same turn (e.g. an arrow referencing a shape created earlier) resolves
// to the real shape. Scoped per-hook-instance (per chat session), not persisted.
type IdMap = Map<string, TLShapeId>;

function resolveShapeId(idMap: IdMap, callerId: string): TLShapeId {
  const existing = idMap.get(callerId);
  if (existing) return existing;
  const id = createShapeId();
  idMap.set(callerId, id);
  return id;
}

// Gemini sometimes emits a literal backslash-n escape sequence in label text (wanting a line
// break) instead of an actual newline character — toRichText only splits on real newlines, so
// without this the literal "\n" shows up as visible text in the shape. Normalizing both here
// makes rendering correct regardless of which form the model produces.
function toShapeRichText(text: string) {
  return toRichText(text.replace(/\\n/g, "\n"));
}

// Looks up a caller-assigned id from earlier in this turn first; falls back to treating the
// input as a real tldraw shape id, since summarizeCanvasContext tells the model the actual ids
// of pre-existing shapes (not caller-ids), and the model is expected to echo those back verbatim
// when referencing shapes from a previous turn (e.g. to delete or update them).
function lookupShape(editor: Editor, idMap: IdMap, id: string): TLShape | undefined {
  const mapped = idMap.get(id);
  if (mapped) return editor.getShape(mapped);
  return editor.getShape(id as TLShapeId);
}

// Shared by createArrow and connectRelationship — both draw an arrow between the centers of two
// existing shapes and bind both ends the same way; row-level anchor snapping (for entity-table
// targets) happens afterward via the store listener already wired in CanvasEditor.
function createArrowBetween(
  editor: Editor,
  arrowId: TLShapeId,
  fromId: TLShapeId,
  toId: TLShapeId,
  label?: string,
): { success: boolean; error?: string } {
  const fromBounds = editor.getShapePageBounds(fromId);
  const toBounds = editor.getShapePageBounds(toId);
  if (!fromBounds || !toBounds) return { success: false, error: "Could not resolve shape bounds" };

  editor.createShape({
    id: arrowId,
    type: "arrow",
    x: 0,
    y: 0,
    props: {
      start: { x: fromBounds.center.x, y: fromBounds.center.y },
      end: { x: toBounds.center.x, y: toBounds.center.y },
      ...(label ? { richText: toShapeRichText(label) } : {}),
    },
  });
  const binding = { isExact: false, isPrecise: false, normalizedAnchor: { x: 0.5, y: 0.5 } };
  editor.createBinding({ type: "arrow", fromId: arrowId, toId: fromId, props: { ...binding, terminal: "start" } });
  editor.createBinding({ type: "arrow", fromId: arrowId, toId: toId, props: { ...binding, terminal: "end" } });
  return { success: true };
}

export function useCanvasAgentChat(editor: Editor | null) {
  const idMap = useRef<IdMap>(new Map());

  const chat = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent/canvas" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      if (!editor) return;

      const toolName = toolCall.toolName;
      const input = toolCall.input;
      const output = executeCanvasTool(editor, idMap.current, toolName, input);

      // Must not be awaited here — the AI SDK schedules the resubmit check synchronously
      // after this callback returns, so awaiting addToolOutput causes it to be missed and
      // the chat hangs after the first tool call.
      chat.addToolOutput({
        tool: toolName as keyof typeof AGENT_CANVAS_TOOL_SCHEMAS,
        toolCallId: toolCall.toolCallId,
        output,
      });
    },
  });

  return chat;
}

// Narrow, explicit switch over tool name rather than a generic dispatch table — keeps each
// branch's input type concrete (via the zod schemas) instead of threading `unknown` through.
function executeCanvasTool(editor: Editor, idMap: IdMap, toolName: string, rawInput: unknown): { success: boolean; error?: string } {
  try {
    switch (toolName) {
      case "createRectangle": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.createRectangle.parse(rawInput);
        editor.createShape({
          id: resolveShapeId(idMap, input.id),
          type: "geo",
          x: input.position.x,
          y: input.position.y,
          props: {
            geo: "rectangle",
            w: input.width,
            h: input.height,
            ...(input.label ? { richText: toShapeRichText(input.label) } : {}),
          },
        });
        return { success: true };
      }

      case "createEllipse": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.createEllipse.parse(rawInput);
        editor.createShape({
          id: resolveShapeId(idMap, input.id),
          type: "geo",
          x: input.position.x,
          y: input.position.y,
          props: {
            geo: "ellipse",
            w: input.width,
            h: input.height,
            ...(input.label ? { richText: toShapeRichText(input.label) } : {}),
          },
        });
        return { success: true };
      }

      case "createText": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.createText.parse(rawInput);
        editor.createShape({
          id: resolveShapeId(idMap, input.id),
          type: "text",
          x: input.position.x,
          y: input.position.y,
          props: {
            richText: toShapeRichText(input.text),
            ...(input.fontSize ? { size: fontSizeToStyle(input.fontSize) } : {}),
          },
        });
        return { success: true };
      }

      case "createArrow": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.createArrow.parse(rawInput);
        const fromShape = lookupShape(editor, idMap, input.fromShapeId);
        const toShape = lookupShape(editor, idMap, input.toShapeId);
        if (!fromShape || !toShape) {
          return { success: false, error: "fromShapeId or toShapeId does not refer to a known shape" };
        }
        return createArrowBetween(editor, resolveShapeId(idMap, input.id), fromShape.id, toShape.id, input.label);
      }

      case "updateShape": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.updateShape.parse(rawInput);
        const shape = lookupShape(editor, idMap, input.id);
        if (!shape) return { success: false, error: "Unknown shape id" };
        // This tool intentionally updates a shape of unknown/dynamic type at runtime — tldraw's
        // updateShape() generic can't statically narrow across the full shape union here, so
        // TLShapePartial<TLShape> (the same loose type the SDK itself uses for this case) is
        // asserted explicitly rather than fought with further generics.
        const patch = {
          ...shape,
          ...(input.position ? { x: input.position.x, y: input.position.y } : {}),
          props: {
            ...shape.props,
            ...(input.width ? { w: input.width } : {}),
            ...(input.height ? { h: input.height } : {}),
            ...(input.label && "richText" in shape.props ? { richText: toShapeRichText(input.label) } : {}),
          },
        } as TLShapePartial<TLShape>;
        editor.updateShape(patch);
        return { success: true };
      }

      case "deleteShape": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.deleteShape.parse(rawInput);
        const shape = lookupShape(editor, idMap, input.id);
        if (!shape) return { success: false, error: "Unknown shape id" };
        editor.deleteShape(shape.id);
        return { success: true };
      }

      case "createEntityTable": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.createEntityTable.parse(rawInput);
        const rows: EntityRow[] = input.columns.map((c) => ({
          id: crypto.randomUUID(),
          name: c.name,
          dataType: c.dataType,
          isPK: c.isPK,
          isFK: c.isFK,
        }));
        editor.createShape<EntityTableShape>({
          id: resolveShapeId(idMap, input.id),
          type: "entity-table",
          x: input.position.x,
          y: input.position.y,
          props: {
            w: DEFAULT_TABLE_WIDTH,
            h: getTableHeight(rows.length),
            tableName: input.tableName,
            rows,
          },
        });
        return { success: true };
      }

      case "addColumn": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.addColumn.parse(rawInput);
        const table = lookupShape(editor, idMap, input.tableId) as EntityTableShape | undefined;
        if (!table) return { success: false, error: "Unknown table id" };
        const rows = [
          ...table.props.rows,
          { id: crypto.randomUUID(), name: input.name, dataType: input.dataType, isPK: input.isPK, isFK: input.isFK },
        ];
        editor.updateShape<EntityTableShape>({ id: table.id, type: "entity-table", props: { rows, h: getTableHeight(rows.length) } });
        return { success: true };
      }

      case "updateColumn": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.updateColumn.parse(rawInput);
        const table = lookupShape(editor, idMap, input.tableId) as EntityTableShape | undefined;
        if (!table) return { success: false, error: "Unknown table id" };
        const rows = table.props.rows.map((r) =>
          r.name === input.columnName
            ? {
                ...r,
                ...(input.name ? { name: input.name } : {}),
                ...(input.dataType ? { dataType: input.dataType } : {}),
                ...(input.isPK !== undefined ? { isPK: input.isPK } : {}),
                ...(input.isFK !== undefined ? { isFK: input.isFK } : {}),
              }
            : r,
        );
        editor.updateShape<EntityTableShape>({ id: table.id, type: "entity-table", props: { rows } });
        return { success: true };
      }

      case "removeColumn": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.removeColumn.parse(rawInput);
        const table = lookupShape(editor, idMap, input.tableId) as EntityTableShape | undefined;
        if (!table) return { success: false, error: "Unknown table id" };
        const rows = table.props.rows.filter((r) => r.name !== input.columnName);
        editor.updateShape<EntityTableShape>({ id: table.id, type: "entity-table", props: { rows, h: getTableHeight(rows.length) } });
        return { success: true };
      }

      case "connectRelationship": {
        const input = AGENT_CANVAS_TOOL_SCHEMAS.connectRelationship.parse(rawInput);
        const fromTable = lookupShape(editor, idMap, input.fromTableId);
        const toTable = lookupShape(editor, idMap, input.toTableId);
        if (!fromTable || !toTable) return { success: false, error: "Unknown table id" };
        // Row-level anchor snapping happens the same way it does for manually-drawn arrows —
        // via the store listener already wired in CanvasEditor, since creating both bindings
        // triggers the same "added" store event.
        return createArrowBetween(editor, resolveShapeId(idMap, input.id), fromTable.id, toTable.id);
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function fontSizeToStyle(px: number): "s" | "m" | "l" | "xl" {
  if (px <= 18) return "s";
  if (px <= 24) return "m";
  if (px <= 36) return "l";
  return "xl";
}
