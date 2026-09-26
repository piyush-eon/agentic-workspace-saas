# Outpost — YouTube Project Plan (Agentic Workspace App)

## Context / Origin

- Channel: roadsidecoder — makes Next.js project tutorials similar in style to Code With Antonio / JS Mastery.
- Previous video: AI agentic app builder (agent performs actions in a live UI).
- This project is a sequel/follow-up in the same "agent performs visible actions" vein, but built around a canvas instead of an app builder.
- Researched the space: existing tldraw-skill / mcp-excalidraw / agent-canvas tools are dev-facing (coding agents drawing diagrams for developers), not consumer-facing apps where an end user chats with AI to build a whiteboard live. That's the gap this project fills — no polished YouTube tutorial covers this yet.
- Compared to Eraser.io / Miro: those have "prompt to diagram" AI features already (e.g. Eraser's DiagramGPT), but they snap-render the final result. This project's differentiator is the AI actually appears to draw live, shape-by-shape, with a visible agent cursor — closer to a "second collaborator" than a black-box generate button.
- Pitch framing for the video: "I built my own AI-powered Miro/Eraser — here's how the agent actually draws on the canvas." Honest framing since the internals (agent loop, tool calls, streaming) are the real teaching content, not a UI clone.

## Naming / Scope Decision

- Considered category names: Agentic Whiteboard, AI Diagram Generator, AI Canvas App, AI Work OS, Agent OS, Agentic Productivity App. Landed on **Agentic Workspace App** as the product category — broader than "whiteboard," pulls in Notion/ClickUp/productivity-tool search audience, not just design-tool audience.
- Important constraint: "Workspace" is only an accurate category if the agent acts across **at least two distinct surfaces** (not just one canvas with a chat sidebar). Decision made: build **two surfaces, canvas + docs**, and earn the name through the agent acting across both (e.g. writing a diagram up as a spec doc). A separate tasks surface was cut (see "Workspace board" below). If scope ever gets cut back to canvas-only, describe it as an "Agentic Canvas App" instead.
- **Product name: Outpost.** Considered against past project-naming pattern (Vehiql, Sensai, Welth, Zcrum, Trimrr, Splitr, Servd, Kribb, Forge — mostly short/compressed/vowel-dropped names). Outpost breaks that compression pattern deliberately, same way **Forge** (the agentic app builder, closest sibling project) did — reserved for more ambitious/flagship-feeling builds. Metaphor: a forward base for doing work in unfamiliar territory — fits "workspace" well, reasonable fit for "canvas" (base camp for mapping something out), weaker fit for "agent" specifically. Runner-up considered: **Relay** (stronger agent/collaborator connotation, weaker workspace connotation) — could revisit if the live agent cursor ends up being marketed harder than the workspace framing.

## Branding

- **Mascot/logo**: a black robot-head icon with a winking circular "eye" (doubles as a subtle power/loading-ring motif) and a visor slit — friendly but techy, fits an "agent as collaborator" personality.
- **Wordmark**: bold condensed "OUTPOST" lockup with the bot mascot perched on/integrated into the "P," tilted slightly for energy. Strong and distinctive at large sizes (hero/thumbnail).
- **Asset generation**: source files (`outpost-bot.png`, `outpost-logo.png`, both flattened on white) were processed with a Pillow script (`scripts/generate-assets.py`) — keys out the white background to transparency, autocrops, generates square icon variants, inverted (white-on-transparent) dark-mode variants, and a dark-background OG/social image from the wordmark. Re-run with `python3 scripts/generate-assets.py` any time the source art changes.
- **Known issue**: at true 16×16 favicon size, the mascot's antenna + lightning-bolt details compete with the eye/visor and the icon reads as noise, not a shape. Works fine from 32px up. Not yet fixed — would need a separate, more simplified crop (eye + visor only) specifically for the 16px favicon frame.
- **Final asset layout in `public/`**:
  - `public/favicon.ico`, `public/icon.png`, `public/apple-icon.png` — kept at root; required there by Next.js App Router auto-detection, cannot be nested.
  - `public/brand/` — `logo.png`, `logo-dark.png`, `logo-navbar.png`, `logo-navbar-dark.png`, `mascot.png`, `mascot-dark.png`
  - `public/icons/` — `icon-192.png`, `icon-512.png` (referenced by `manifest.json` for PWA)
  - `public/social/` — `og-image.png`, `twitter-image.png`
  - `public/source/` — original flattened source PNGs, kept for regenerating assets later
- **Still to do**: simplified 16px-safe favicon crop; possibly a horizontal vs. stacked lockup variant for different UI placements (navbar vs. landing hero) if the current navbar crop doesn't work well in practice.

## Pages / Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, demo video, CTA |
| `/sign-in`, `/sign-up` | Clerk auth |
| `/dashboard` | Kanban board of the active org's workspaces (see "Workspace board"), "New" button |
| `/workspace/[id]` | Doc + canvas side by side, `?view=doc\|canvas` toggle, agent panel |
| `/workspace/[id]/settings` | Rename, members, permissions, delete |
| `/shared/[token]` | Public/read-only shared view |
| `/pricing` | Free vs Pro (agent usage limits) |
| `/api/*` | Route handlers (agent runs, CRUD, webhooks) |

## Core Features

### Workspace shell
- Document / Both / Canvas toggle in the workspace header
- Global command bar (Cmd+K) to summon the agent from anywhere
- Persistent agent chat panel, context-aware of the active surface

### Canvas surface (flagship, most visual)
- Infinite canvas (tldraw), shapes/text/arrows/freehand
- Agent streams shapes live from a prompt ("map out a marketing funnel")
- Follow-up edits: agent reads current canvas state, diffs and edits existing shapes
- Self-critique pass: second agent pass reviews its own diagram for overlap/missing links, auto-fixes
- Voice-to-diagram via Gemini native audio input (no separate Whisper needed)
- Templates: flowchart, architecture, ERD, user journey, org chart
- **Live "agent cursor"** (see dedicated section below) — the standout feature

### Docs surface
- **BlockNote** (block-based, Notion-style editor, built on Tiptap/Prosemirror) — decided over raw Tiptap/Novel
- Agent can draft, rewrite, or summarize a doc from a prompt
- Agent can pull content from a canvas into a doc ("write up this diagram as a spec")
- Uses BlockNote's AI features wired to our own Gemini calls via Vercel AI SDK (consistent with how the canvas is driven), rather than any hosted AI backend

### Workspace board (replaces the cut tasks surface)
- The dashboard shows the active org's workspaces as cards on a kanban board with fixed columns: Planning → In progress → In review → Done. Cards are a fixed, compact height and show the name plus an optional description (entered in the new-workspace dialog).
- Drag and drop moves a card between columns and reorders it within a column.
- Schema: `Workspace.status` (enum `WorkspaceStatus`: PLANNING, IN_PROGRESS, IN_REVIEW, DONE, default PLANNING), `Workspace.description` (optional) and `Workspace.position` (Float, default 0; a dropped card takes a value between its neighbors, so only the moved card is updated).
- Not live: other members see moves after a refresh.
- No agent involvement. It's dashboard polish, built after doc collaboration and the agent's doc tools.
- **Why the tasks surface was cut:** doc + canvas already meet the two-surface rule once the agent acts across both; a third surface means another editor, sync layer and tool set, and a kanban task board is the most common tutorial build, so it's the least distinctive part of the video.

### Collaboration
- Real-time multiplayer cursors/presence (tldraw sync for canvas; Supabase Realtime for docs)
- Access: any member of a workspace's Clerk org can open it anytime; no per-workspace member lists
- Invite by email/link, roles (viewer/editor)
- Comments/pins

### Account / SaaS layer
- Clerk auth, org support for team workspaces
- Usage limits (free tier: capped agent actions/month — exact number and mechanism not yet decided; earlier discussion sketched Free/Pro tiers but nothing was finalized or written up)
- **Clerk Billing** for Pro subscription (replaces separate Stripe integration — Clerk Billing is built on Stripe under the hood but managed through Clerk directly, keeping auth + billing in one sponsor/provider)

## Live Agent Cursor — Implementation Notes

The single most "watchable"/clip-worthy feature: a visible cursor + label ("Agent is drawing...") that moves and draws on the canvas in real time, like a second collaborator, instead of a chat log.

**Concept:** Treat the agent as just another collaborator in the existing multiplayer presence system (tldraw sync), driven by the backend instead of a human's mouse.

**Steps:**
1. Give the agent a presence identity — synthetic client with `userId: "agent"`, distinct name/color/avatar, broadcast into the same presence channel as human cursors.
2. Drive cursor movement from the backend agent loop — before/while each tool call executes (e.g. `createRectangle at (x,y)`), push a presence update to that position. Interpolate/animate movement client-side (~200-400ms lerp) rather than teleporting.
3. Custom cursor component with a labeled pill showing live status text ("thinking...", "drawing rectangle...", "connecting shapes...") driven by the current tool-call name — tldraw supports overriding the default collaborator cursor renderer.
4. Sequencing for the illusion: cursor arrives at target position **first**, then the shape is created/appears — this ordering is what sells "the agent is actually drawing" rather than shapes just popping in.
5. Optional polish: trailing pen/ghost-hand icon while drawing; fade cursor in/out on join/idle ("Agent joined the board"); multiple colored cursors if running a planner + critic multi-agent setup.

**Effort estimate:** roughly half a day to a full day total.
- Easy (~1-2 hrs): faking agent presence via existing sync APIs — same function a human client would call, fake user ID.
- Easy-medium (~1-2 hrs): custom cursor UI component with label/status pill.
- Medium (~2-4 hrs): wiring cursor movement to the tool-call stream in correct sequence/timing.
- Fiddly bits: smooth interpolation, and choosing sensible cursor waypoints for multi-point shapes (e.g. arrows — use start-point then end-point as two waypoints).

No exotic tech required — it's clever reuse of the multiplayer presence system that would already be built for human collaboration.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Canvas | tldraw SDK |
| Docs editor | BlockNote (MPL 2.0 core, built on Tiptap/Prosemirror) |
| Realtime sync | tldraw sync (canvas) + Supabase Realtime (docs) — canvas uses tldraw's hosted demo server, see "tldraw Sync Server" below |
| Auth | Clerk (sponsor) |
| DB | Supabase (sponsor) — Postgres + Prisma ORM (via `@prisma/adapter-pg`) |
| File/asset storage | Supabase Storage |
| AI (agent, voice, critique) | Gemini via Vercel AI SDK (`@ai-sdk/google`) — single provider for drawing agent, follow-up edits, self-critique, and voice-to-diagram (Gemini has native audio input, no separate Whisper needed) |
| Payments | Clerk Billing |
| Styling | Tailwind + shadcn/ui |
| Forms | Plain controlled inputs + Server Actions by default; React Hook Form + Zod only if a form grows complex enough to need it (e.g. workspace settings, billing upgrade flow) — not a default dependency |
| Deployment | Vercel |

## tldraw Licensing Notes

- tldraw SDK is **source-available, not fully open-source/MIT** — production use requires a license key (free in dev regardless).
- License tiers:
  - **Hobby license** — free, permanent, but shows a **tldraw watermark** in production. This is what we'll use.
  - **Trial license** — free, no watermark, but expires 100 days after issuance (enforced by the SDK's runtime license check reading the key you pass into `<Tldraw licenseKey="..." />`, not by npm/package restrictions). Not suitable for a tutorial meant to stay working long-term.
  - **Commercial license** — paid, no watermark, custom sales-quote pricing. Needed only for real production/monetized use.
- **No key at all** in production → same watermark as hobby tier anyway, so there's no reason to skip the free signup — it's a ~2 minute form on tldraw.dev (email/GitHub signup, then request hobby license), no payment info required.
- **Decision for this project:** build and record the entire tutorial without ever signing up or showing a license key — nothing is gated in local dev. Only mention licensing briefly **at the end**, when discussing production deployment ("tldraw needs a free license key for production, grab one from their site, it's free") — a 10-second honest heads-up rather than a mid-tutorial interruption. Get the actual hobby key off-camera after recording, drop into env vars for the live deployed demo.
- Alternative considered and rejected (but worth remembering): **Excalidraw** is MIT-licensed, fully free forever, no watermark, no key — trade-off is a less polished SDK/API for custom app-building and less AI-native tooling around it currently. Could revisit if licensing friction becomes a bigger issue than expected.

## tldraw Sync Server

- **Decision:** the canvas syncs through tldraw's hosted **demo** server (`useSyncDemo` from `@tldraw/sync`), including after the Vercel deployment. Deploying our own sync server is out of scope for the tutorial.
- **Why it's acceptable here:** it's a tutorial, and the demo server works from any domain with zero setup. Room ids are `outpost-<workspaceId>`.
- **Known limits (mention in the video):**
  - Rooms are public: anyone with a room id can join, so Clerk org access checks don't apply to the live canvas.
  - The demo server wipes data periodically. The Postgres canvas autosave is the safety net, since an empty room gets re-seeded from Postgres on load.
  - tldraw documents it as prototyping-only, with no uptime guarantees.
- **Tell viewers:** for a real product, deploy your own sync server with tldraw's Cloudflare template (`npm create tldraw@latest -- --template sync-cloudflare`), register the custom `entity-table` shape on it, check Clerk org membership before a client joins a room, then swap `useSyncDemo` for `useSync({ uri })` in `components/CanvasEditor.tsx`. Once the server stores the canvas, the Postgres canvas autosave can be removed.

## Doc Collaboration

- **How it works:** BlockNote's built-in Yjs collaboration (`CollaborationExtension` from `@blocknote/core/yjs`) handles merging edits and live cursors. The connection between browsers is our own small provider (`lib/supabase-yjs-provider.ts`) on a **Supabase Realtime** broadcast channel per doc (`doc:<workspaceId>`), with events for doc updates, cursors, and newcomers asking peers for unsaved edits.
- **Saving:** each client saves only its own edits, debounced. The server merges the incoming Yjs state into `Doc.yjsState` inside a row-locked transaction, so simultaneous saves can't lose edits. A readable JSON copy is still saved to `Doc.content` for server-side features (agent, share view).
- **Old docs:** docs saved before collaboration only have JSON; the first person to open one imports it into the shared doc.
- **Rejected:** Liveblocks (paid SaaS), `y-supabase` (unmaintained alpha), y-websocket/Hocuspocus (need a server Vercel can't host), y-webrtc (unreliable).
- **Tutorial scope:** the channel is **public**, so anyone with the anon key and a doc id could join. Tell viewers: for production, use private channels with Supabase Realtime Authorization (RLS on `realtime.messages`) and sign clients in with their Clerk session token via Supabase's Clerk integration.

## BlockNote Licensing Notes

- Core BlockNote library is **MPL 2.0** — free to use in commercial/closed-source apps, no key needed.
- BlockNote **AI features** are under a separate dual-license ("XL") tier: free if the consuming project is **open source**, otherwise requires a paid commercial license (bundled into their Business subscription).
- **Decision:** this project is being open-sourced (repo will be public for viewers to clone), so we qualify for free use of BlockNote AI under the open-source exception.
- Note for future: if this ever pivots to a closed-source/monetized product, BlockNote AI would need a commercial license at that point — the base editor itself would remain free regardless (MPL 2.0).
- Tiptap (the library BlockNote sits on) has a similar open-core split worth remembering: **core editor is MIT/free**, but Tiptap's own **Cloud Platform** (hosted realtime collab, comments, doc history, their AI Toolkit — from $49/mo, no free tier) is separate and not something we need, since realtime sync/presence is being built ourselves via tldraw sync and Supabase Realtime.

## Data Layer Patterns

Reference: [piyush-eon/ai-app-builder](https://github.com/piyush-eon/ai-app-builder) (Forge, the prior agentic-app-builder project) — reusing its proven Clerk + DB pattern rather than redesigning from scratch.

- **ORM: Prisma**, not Drizzle (original stack draft said Drizzle — switched after reviewing the reference repo's working Prisma setup; no strong technical reason to prefer Drizzle for this project specifically, and reusing a battle-tested pattern reduces build risk and video prep time). Uses `@prisma/adapter-pg` driver adapter against Supabase's Postgres connection string — Prisma 7's adapter-based engine resolves the old serverless cold-start concerns that used to favor Drizzle.
- **User sync pattern (`checkUser`)**: on each authenticated request, look up the local `User` row by `clerkId`; create it on first sight (free plan defaults), reconcile plan/credits from Clerk Billing's `auth().has({ plan: "..." })` check into local columns if it has changed. Local DB is the source of truth for app-side plan/usage state; Clerk is the source of truth for the actual subscription.
- **Data access: Server Actions only** — `"use server"` functions in an `actions/` directory, called directly from client components. No client-side data-fetching library (see TanStack Query decision below).
- **Schema conventions to carry over**: `cuid()` ids, `onDelete: Cascade` on relations back to `User`, plan reconciled onto the `User` row itself rather than a separate billing table (kept simple since Clerk Billing owns the actual subscription). Note: the reference repo uses a *credits* system (numeric balance spent per generation) — Outpost has not decided to use credits specifically; only "capped actions/month" has been discussed, unfinalized. Don't assume credits carry over without deciding that explicitly.
- **Not yet drafted**: actual Outpost schema (Workspace, Surface types for canvas/doc/task, Member/role table, agent action log for usage metering) — first real task for the build session.

### TanStack Query — decided against

The reference repo uses zero client-side fetching libraries: Server Components for reads, Server Actions + `revalidatePath`/`router.refresh()` for writes. Decided to follow the same pattern for Outpost rather than introduce TanStack Query.

Where it might have seemed tempting — the canvas surface's live agent state (tool-call progress, streaming status, presence) — isn't actually a "fetch and cache" problem, it's a subscribe-to-a-stream problem, which the Vercel AI SDK's own streaming hooks and tldraw sync's presence system already handle natively. Adding TanStack Query on top would be a second, redundant state-management paradigm for something already covered. Server Actions remain the default everywhere else (dashboard, settings, docs CRUD).

### `useFetch` — standard client-side wrapper for mutation Server Actions

In place of TanStack Query, adopt a small hand-rolled hook to wrap Server Action calls triggered from client components (button clicks, form submits) — gives `data`/`loading`/`error` state plus an automatic error toast, without pulling in a full caching library. Appropriately scoped given the Server-Actions-first decision above: this covers the "single request/response mutation" case; it does NOT cover the canvas/agent streaming case, which stays on the AI SDK's streaming hooks and tldraw sync.

```ts
import { useState } from "react";
import { toast } from "sonner";

function useFetch<T, Args extends unknown[]>(cb: (...args: Args) => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: Args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (err) {
      const e = err as Error;
      setError(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
}

export default useFetch;
```

**Where it applies**: workspace create/rename/delete, invite member, plan-upgrade click — any button-triggered Server Action mutation from a client component. **Where it doesn't**: canvas/agent streaming state (not a single request/response shape).

## Agent Tool-Call Schema

Fine-grained primitives, not coarse composite tools — one tool per tldraw shape primitive, so the agent composes a diagram from many small calls. This is what makes the live agent cursor's "drawing shape by shape" effect work naturally: each tool call is one clean, visible, animatable step, rather than a big structured object rendered all at once with an artificially staggered reveal.

**Context injection (decided): Option A — always inject current canvas state before every agent turn.** Before each agent invocation, the backend reads current shapes (id, type, label, position) and includes them in context, so the model only ever references real shape ids it's actually been told about — rather than inventing/recalling ids and relying on tool-level error-and-retry to self-correct. Costs some extra tokens on every call, but keeps agent behavior reliable for a live demo, which matters more here than the token savings from the leaner alternative.

**Canvas tools** (Zod schemas, Vercel AI SDK tool-calling):
- `createRectangle` / `createEllipse` — id, position, width, height, label, style
- `createText` — id, position, text, fontSize
- `createArrow` — id, fromShapeId/toShapeId (or raw fromPoint/toPoint), label
- `updateShape` — id + any of position/width/height/label/style
- `deleteShape` — id
- `groupShapes` — groupId, shapeIds[], label

All tools take a **caller-assigned `id` string** (not DB-generated) so the agent can reference a shape it just created later in the same turn (e.g. "draw an arrow from rect-1 to rect-2") before any DB round-trip happens.

**Follow-up edits and the self-critique pass are not separate tools** — both reuse the same canvas tool set above with a different system prompt (self-critique: "review this diagram for overlaps/missing connections") plus the current canvas state as context. Keeps the tool surface small; self-critique is a behavior, not a new capability.

**Cross-surface tools** (the part that actually justifies the "workspace," not just "canvas," naming):
- `summarizeToDoc` — writes the current canvas up as structured blocks in the workspace's doc ("write up this diagram as a spec")
- Kept as distinct, nameable tools rather than one generic "move data between surfaces" tool — more reliable for the model to invoke correctly, and produces a readable audit trail (each tool's name is self-explanatory) wherever tool invocations get logged.

**Docs tools:** `writeDocBlock` (append/replace a BlockNote block — paragraph/heading/list item/quote).

## Open / Next Steps (not yet decided)

- Chapter-by-chapter video outline / script — not yet created.
- Final title/thumbnail line — leaning toward "Agentic Workspace App" but not locked.
- Landing page "three surfaces" section still shows a Tasks mockup (`TasksMock` in `components/SurfaceVisuals.tsx`) — replace it (e.g. with the workspace board) now that tasks is cut.
