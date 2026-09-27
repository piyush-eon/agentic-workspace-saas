import type { Block, BlockNoteEditor } from "@blocknote/core";
import { docToolDefs, fail, normalizeModelText, ok, type ToolResult } from "@/lib/agent-tools";

const SUMMARY_BLOCK_CHARS = 400;

// A new doc is a single empty paragraph; treat that as empty so content replaces it.
function isEmptyDoc(blocks: Block[]) {
  const [first] = blocks;
  return blocks.length === 1 && first.type === "paragraph" && !first.children.length &&
    Array.isArray(first.content) && first.content.length === 0;
}

// One line per top-level block (id + type + its Markdown), so the model can target edits.
export function summarizeDoc(editor: BlockNoteEditor) {
  const blocks = editor.document;
  if (isEmptyDoc(blocks)) return "(empty doc)";
  return blocks
    .map((block) => {
      const text = editor.blocksToMarkdownLossy([block]).trim().replace(/\s*\n\s*/g, " / ");
      const clipped = text.length > SUMMARY_BLOCK_CHARS ? `${text.slice(0, SUMMARY_BLOCK_CHARS)}…` : text;
      return `- id: ${block.id}, type: ${block.type}: ${clipped}`;
    })
    .join("\n");
}

function toBlocks(editor: BlockNoteEditor, markdown: string) {
  if (!markdown.trim()) throw new Error("The Markdown is empty");
  return editor.tryParseMarkdownToBlocks(normalizeModelText(markdown));
}

export function executeDocTool(editor: BlockNoteEditor, toolName: string, rawInput: unknown): ToolResult {
  const defs = docToolDefs;
  switch (toolName) {
    case "insertDocContent": {
      const input = defs.insertDocContent.inputSchema.parse(rawInput);
      const blocks = toBlocks(editor, input.markdown);
      const doc = editor.document;
      if (!input.afterBlockId && isEmptyDoc(doc)) {
        editor.replaceBlocks(doc, blocks);
        return ok();
      }
      const reference = input.afterBlockId ? editor.getBlock(input.afterBlockId) : doc.at(-1);
      if (!reference) return fail("Unknown block id");
      editor.insertBlocks(blocks, reference, "after");
      return ok();
    }

    case "updateDocBlock": {
      const input = defs.updateDocBlock.inputSchema.parse(rawInput);
      if (!editor.getBlock(input.blockId)) return fail("Unknown block id");
      // Update in place so the block keeps its id for later calls; any extra blocks follow it.
      const [first, ...rest] = toBlocks(editor, input.markdown);
      editor.updateBlock(input.blockId, first);
      if (rest.length) editor.insertBlocks(rest, input.blockId, "after");
      return ok();
    }

    case "deleteDocBlocks": {
      const input = defs.deleteDocBlocks.inputSchema.parse(rawInput);
      const missing = input.blockIds.filter((id) => !editor.getBlock(id));
      if (missing.length) return fail(`Unknown block ids: ${missing.join(", ")}`);
      // A doc can't have zero blocks, so deleting everything leaves one empty paragraph.
      const deletesAll = editor.document.every((block) => input.blockIds.includes(block.id));
      if (deletesAll) editor.replaceBlocks(editor.document, [{ type: "paragraph" }]);
      else editor.removeBlocks(input.blockIds);
      return ok();
    }

    case "replaceDoc": {
      const input = defs.replaceDoc.inputSchema.parse(rawInput);
      editor.replaceBlocks(editor.document, toBlocks(editor, input.markdown));
      return ok();
    }

    default:
      return fail(`Unknown doc tool: ${toolName}`);
  }
}
