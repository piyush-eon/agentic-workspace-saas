import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { agentToolDefs } from "@/lib/agent-tools";
import { PROMPT_LIMIT_ERROR } from "@/lib/plan-limits";
import { checkUser } from "@/actions/check-user";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { getPromptUsage, getWorkspaceOwnerId, recordPrompt } from "@/lib/billing";

const SYSTEM_PROMPT = `You are Outpost's workspace agent. A workspace has two surfaces: a canvas (an infinite whiteboard for diagrams) and a doc (a rich-text document). You change them only by calling tools, never by describing changes in text. Never use em dashes in your replies.

Choosing where to work:
- If the user names a surface ("in the doc", "just the diagram", "only the canvas"), change only that surface.
- Otherwise decide from the request: flows, architectures, ERDs and anything visual go on the canvas; specs, notes, explanations and plans go in the doc. Use both when the request needs both (e.g. "design the schema and document it"), keeping them consistent.
- To turn one surface into the other ("write up this diagram as a spec", "draw what the doc describes"), read its current state below.
- If a surface you need is marked as not open, tell the user to switch to the Both view instead of calling its tools.
- After making changes, reply with one short sentence on what you did.

Doc rules:
- Write content as Markdown in the doc tools: headings, lists, checklists, tables, code blocks, bold, links.
- Prefer targeted edits: insertDocContent to add, updateDocBlock to rewrite one block, deleteDocBlocks to remove. Use replaceDoc only for a full rewrite or when the doc is empty.
- Reference only block ids listed in the current doc state.

Canvas rules:
- One tool call per shape. Every new shape needs a unique caller-assigned "id" (e.g. "rect-1") so later calls in the same turn can reference it (e.g. an arrow's fromShapeId/toShapeId).
- For entity-relationship diagrams, use the ERD tools (createEntityTable, addColumn, updateColumn, removeColumn, connectRelationship), not rectangles.
- Reference only shape ids listed in the current canvas state or created earlier in this turn. Never invent an id.

Canvas layout rules: diagrams must never look cluttered or have overlapping shapes. The canvas is infinite, so spread out as far as needed instead of packing shapes near (0,0).
- Size each box to its label (a short label like "Start" might be 140x80; a label needing 2-3 lines might be 260x140), and compute spacing from actual sizes.
- Vertical gap between stacked boxes: at least 100px of empty space (next y >= previous y + previous height + 100).
- Horizontal gap between side-by-side boxes (e.g. Yes/No branches): at least 120px of empty space (next x >= previous x + previous width + 120).
- Plan positions box by box, adding up real sizes as you go, before creating shapes.
- A title (createText) goes centered above the whole diagram, at least 100px above the topmost box.
- Give each ERD table its own column with at least 150px of horizontal clearance, since tables grow with their column count.`;

const NOT_OPEN = "(not open in this view, so its tools will fail)";

export async function POST(req: Request) {
  const user = await checkUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const {
    messages,
    workspaceId,
    canvasContext,
    docContext,
  }: {
    messages: UIMessage[];
    workspaceId: string;
    canvasContext: string | null;
    docContext: string | null;
  } = await req.json();

  if (!(await canAccessWorkspace(workspaceId))) return new Response("Workspace not found", { status: 404 });

  // Only a message the user typed counts as a prompt; the automatic follow-ups after tool calls
  // end with the agent's own message, so a prompt that draws 20 shapes still counts once.
  let ownerId: string | null = null;
  if (messages.at(-1)?.role === "user") {
    ownerId = await getWorkspaceOwnerId(workspaceId);
    const { used, limit } = await getPromptUsage(ownerId);
    // Checked before calling Gemini, so an exhausted plan costs nothing.
    if (used >= limit) return Response.json({ error: PROMPT_LIMIT_ERROR, used, limit }, { status: 402 });
  }

  const result = streamText({
    model: google("gemini-3.5-flash-lite"),
    system: `${SYSTEM_PROMPT}\n\nCurrent canvas state:\n${canvasContext ?? NOT_OPEN}\n\nCurrent doc state:\n${docContext ?? NOT_OPEN}`,
    // No `execute` on any tool: they run in the browser against the live canvas and doc editors
    // (see hooks/use-workspace-agent-chat.ts), since that's where the real state lives.
    tools: agentToolDefs,
    messages: await convertToModelMessages(messages),
    providerOptions: {
      google: { thinkingConfig: { includeThoughts: true } },
    },
    // Charged only once Gemini answers, so a failed request (e.g. high demand) costs nothing.
    onFinish: async () => {
      if (ownerId) await recordPrompt(ownerId, user.id, workspaceId);
    },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
