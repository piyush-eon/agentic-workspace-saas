import type { Editor, TLShape } from "tldraw";
import type { EntityTableShape } from "@/components/EntityTable/EntityTableShape";

// Compact per-shape summary sent to the agent on every turn (per the plan doc's context-
// injection decision — full state, not a diff, so the model never references a shape it wasn't
// actually told about). Deliberately excludes tldraw's full internal shape records (styles,
// rotation, etc.) to keep the prompt small; only what the agent needs to reference shapes back.
export function summarizeCanvasContext(editor: Editor): string {
  const shapes = editor.getCurrentPageShapes();
  if (shapes.length === 0) return "(empty canvas, no shapes yet)";

  return shapes.map((shape) => summarizeShape(shape)).join("\n");
}

function summarizeShape(shape: TLShape): string {
  const base = `- id: ${shape.id}, type: ${shape.type}, position: (${Math.round(shape.x)}, ${Math.round(shape.y)})`;

  if (shape.type === "entity-table") {
    const table = shape as EntityTableShape;
    const columns = table.props.rows
      .map((r) => `${r.name}:${r.dataType}${r.isPK ? " PK" : ""}${r.isFK ? " FK" : ""}`)
      .join(", ");
    return `${base}, table: "${table.props.tableName}", columns: [${columns}]`;
  }

  if (shape.type === "geo" || shape.type === "text") {
    const props = shape.props as { richText?: { content?: unknown[] } };
    const text = extractPlainText(props.richText);
    return text ? `${base}, label: "${text}"` : base;
  }

  return base;
}

// tldraw's richText is a small prosemirror-ish JSON doc — this pulls out just the plain text
// for the agent's context rather than sending the whole document structure.
function extractPlainText(richText: { content?: unknown[] } | undefined): string {
  if (!richText?.content) return "";
  const texts: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node !== "object" || node === null) return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && n.text) texts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  richText.content.forEach(walk);
  return texts.join(" ");
}
