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
- **Asset generation**: source files (`outpost-bot.png`, `outpost-logo.png`, both flattened on white) were processed with a Pillow script (`scripts/generate-assets.py`) — keys out the white background to transparency, autocrops, generates square icon variants, inverted (white-on-transparent) dark-mode variants, and a dark-background OG/social image from the wordmark. That script was never committed to this repo, so regenerating assets means recreating it; the source art is kept in `assets/source/`.
- **Known issue**: at true 16×16 favicon size, the mascot's antenna + lightning-bolt details compete with the eye/visor and the icon reads as noise, not a shape. Works fine from 32px up. Not yet fixed — would need a separate, more simplified crop (eye + visor only) specifically for the 16px favicon frame.
- **Visual identity (replaces the old film grain and glow blobs, which read as a generic AI-built site):**
  - **Topographic contours** (`public/textures/topo.svg`) behind hero sections, applied with the `topo-bg` utility in `globals.css`. The SVG masks a color gradient, so lines glow amber at the center and cool to grey at the edges, then fade out softly. `MapAnnotations` adds printed-map corner labels (coordinates, elevation, a "You are here" marker, scale bar) on the landing hero and closing section (not the dashboard, which stays simpler), hidden on phones. Generated from a smooth random terrain with every 4th line thicker as an index contour, like a survey map. Ties to the name: an outpost is a base for mapping unknown territory. Never used over the doc or canvas editors.
  - **Bricolage Grotesque** for headings (h1-h3, via `--font-heading`, with the optical-size axis); Geist stays for body text. Doc headings keep the editor's own font.
  - The accent word in the landing headline is solid amber instead of gradient text.
  - **Survey-map details on the landing page:** amber registration marks (`survey-frame` utility) around the product mockups and hero demo; numbered monospace section labels (`01 · Surfaces`, `02 · The route`, `03 · Pricing`; the testimonial section was removed) instead of generic badges and sparkle icons; the four "how it works" steps joined as waypoints on a dashed trail; a pulsing "You are here" marker; and the closing CTA back over the contours.
- **Asset layout** (unused variants removed on 2026-09-27; git history has them):
  - `public/favicon.ico`, `public/icon.png`, `public/apple-icon.png` — kept at root; required there by Next.js App Router auto-detection, cannot be nested.
  - `public/brand/` — `logo-navbar-dark.png` (site header), `mascot.png`, `mascot-dark.png`
  - `public/icons/` — `icon-192.png`, `icon-512.png` (referenced by `manifest.json` for PWA)
  - `public/social/og-image.png` — link preview image, wired into `openGraph` and `twitter` metadata in `app/layout.tsx`
  - `public/textures/topo.svg` — contour background
  - `public/videos/` — landing hero video (`hero.webm`, `hero.mp4` fallback, `hero-poster.jpg`), encoded from the original
  - `assets/source/` (not deployed) — original brand artwork (`outpost-bot.png`, `outpost-logo.png`) and the original hero video `outpost.mp4`, which is gitignored because of its size
- **Still to do**: simplified 16px-safe favicon crop; possibly a horizontal vs. stacked lockup variant for different UI placements (navbar vs. landing hero) if the current navbar crop doesn't work well in practice.

## Pages / Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, demo video, CTA |
| `/sign-in`, `/sign-up` | Clerk auth |
| `/dashboard` | Prompt hero (see "Dashboard prompt") plus the 4 most recently active workspaces, with links to the board and "New workspace" |
| `/workspaces` | Kanban board of all the active org's workspaces (see "Workspace board") |
| `/workspace/[id]` | Doc + canvas side by side, `?view=doc\|canvas` toggle, agent panel |
| `/shared/[token]` | Public read-only view of the doc and canvas (see "Sharing & PDF Export") |
| `/api/agent` | The agent route (Gemini, tools, prompt limits) |

## Core Features

### Workspace shell
- Document / Both / Canvas toggle in the workspace header
- Global command bar (Cmd+K) to summon the agent from anywhere
- Persistent agent chat panel, context-aware of the active surface

### Canvas surface (flagship, most visual)
- Infinite canvas (tldraw), shapes/text/arrows/freehand
- Agent streams shapes live from a prompt ("map out a marketing funnel")
- Follow-up edits: agent reads current canvas state, diffs and edits existing shapes
- ~~Self-critique pass~~: **cut** (2026-09-28). Diagram layout quality relies on the agent's layout rules instead.
- Voice input: a mic button (`components/MicButton.tsx`) on the dashboard prompt box and the agent chat panel. Uses the browser's built-in speech recognition to fill the text box with an editable transcript, so no backend and no Gemini quota. Works in Chrome, Edge and Safari; hidden in Firefox, which doesn't support it. Chosen over Gemini native audio so users can fix misheard words before the agent acts.
- Templates: flowchart, architecture, ERD, user journey, org chart
- **Live "agent cursor"** (see dedicated section below) — the standout feature

### Docs surface
- **BlockNote** (block-based, Notion-style editor, built on Tiptap/Prosemirror) — decided over raw Tiptap/Novel
- Agent can draft, rewrite, or summarize a doc from a prompt
- Agent can pull content from a canvas into a doc ("write up this diagram as a spec")
- Uses BlockNote's AI features wired to our own Gemini calls via Vercel AI SDK (consistent with how the canvas is driven), rather than any hosted AI backend

### Dashboard prompt
- A prompt box above the board ("What do you want to plan?"), with the mic button. Submitting creates a workspace in the active org (name taken from the prompt's first words, the full prompt as its description) and opens it at `/workspace/<id>?prompt=...`.
- The workspace opens with the agent panel open and sends the prompt as the first message once both the doc and canvas editors are ready, then removes `prompt` from the URL so a refresh doesn't resend it. The "New workspace" button still creates a blank workspace.

### Workspace board (replaces the cut tasks surface)
- The board lives on its own page, `/workspaces` (linked from the dashboard's "View board" and the site header), so it gets the full page instead of sitting below the dashboard's prompt hero. It shows the active org's workspaces as cards on a kanban board with fixed columns: Planning → In progress → In review → Done. Cards are a fixed, compact height and show the name plus an optional description (entered in the new-workspace dialog).
- Drag and drop moves a card between columns and reorders it within a column.
- Schema: `Workspace.status` (enum `WorkspaceStatus`: PLANNING, IN_PROGRESS, IN_REVIEW, DONE, default PLANNING), `Workspace.description` (optional) and `Workspace.position` (Float, default 0; a dropped card takes a value between its neighbors, so only the moved card is updated).
- Not live: other members see moves after a refresh.
- No agent involvement. It's dashboard polish, built after doc collaboration and the agent's doc tools.
- **Why the tasks surface was cut:** doc + canvas already meet the two-surface rule once the agent acts across both; a third surface means another editor, sync layer and tool set, and a kanban task board is the most common tutorial build, so it's the least distinctive part of the video.

### Collaboration
- Real-time multiplayer cursors/presence (tldraw sync for canvas; Supabase Realtime for docs)
- Access: any member of a workspace's Clerk org can open it anytime; no per-workspace member lists
- Invite by email/link, roles (viewer/editor)
- ~~Comments/pins~~: **cut** (2026-09-28).
- Doc callouts: **cut** (2026-09-28). BlockNote's default blocks have no callout, so the landing page lists headings, lists, checklists, tables and code instead.

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
| AI (agent) | Gemini via Vercel AI SDK (`@ai-sdk/google`) — single provider for the agent and its follow-up edits. Voice input uses the browser's speech recognition instead (see Canvas surface). |
| Payments | Clerk Billing |
| Styling | Tailwind + shadcn/ui |
| Forms | Plain controlled inputs + Server Actions by default; React Hook Form + Zod only if a form grows complex enough to need it (e.g. a billing upgrade flow) — not a default dependency |
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
- **Tell viewers:** for a real product, deploy your own sync server with tldraw's Cloudflare template (`npm create tldraw@latest -- --template sync-cloudflare`), register the custom `entity-table` shape on it, check Clerk org membership before a client joins a room, then swap `useSyncDemo` for `useSync({ uri })` in `app/(main)/workspace/[id]/_components/CanvasEditor.tsx`. Once the server stores the canvas, the Postgres canvas autosave can be removed.

## Billing (Clerk Billing)

- **Plans** (set up in the Clerk dashboard, monthly only, no annual):
  - Users: default **Free**, and **Pro** (key `pro`), $12/month.
  - Organizations: default **Free**, **Team** (key `team`), seat-based at $12 per member per month, no base fee, unlimited members; and **Enterprise** (key `enterprise`), seat-based at $25 per member per month with higher limits (`agent_prompts_2000`) plus everything in Team.
  - **Gating features** (checked by code; never attach to a Free plan): `unlimited_workspaces`, `public_sharing`, `pdf_export`, and the prompt allowances `agent_prompts_500` (Pro, Team; display name "500 agent prompts per seat / month") and `agent_prompts_2000` (Enterprise; "2,000 agent prompts per seat / month").
  - **Display-only features** (shown on pricing cards, ignored by code; limits are enforced in `lib/plan-limits.ts`): `agent_prompts_20` ("20 agent prompts per month") and `workspaces_3` ("Up to 3 workspaces") on both Free plans; `live_collaboration` ("Live collaboration on docs and canvas") and `voice_input` ("Voice input") on every plan, Free and paid.
  - Development uses the Clerk development gateway (test payments); connect a real Stripe account before going live.
- **Shared pricing component** (`components/PricingPlans.tsx`), used in two places: the landing page's pricing section (`#pricing`) and the **upgrade dialog** (`components/UpgradeDialog.tsx`), which any code can open with a reason via `useUpgradeDialog()`, e.g. `openUpgrade({ title: "You're out of agent prompts" })`. The dialog closes itself when checkout starts, since it would otherwise block Clerk's checkout drawer.
- **Header plan button** (`components/PlanButton.tsx`): inside the app it replaces the Dashboard/Workspaces links. On a free plan it shows **Upgrade** (opens the dialog); on a paid plan it shows the plan's name and opens Clerk's subscription details (only for members who can manage billing). It follows the personal account or the org selected in the switcher and shows the prompts left this month (e.g. `18 left`) with a small progress ring, full detail in the tooltip; free plans open the upgrade dialog on click, paid plans open subscription details.
- **Pricing card details:** custom cards that load plans, prices and features from Clerk via `usePlans`, with Personal / Team tabs (defaulting to the current context). Paid cards open Clerk's checkout drawer with `CheckoutButton` (`planPeriod="month"`); Team checkout charges the **active organization**, shows "Upgrading <org>", and only members with `org:sys_billing:manage` (admins) can buy. `useSubscription` marks the current plan.
- `CheckoutButton`, `usePlans` and `useSubscription` come from `@clerk/nextjs/experimental` (Billing is in public beta), so `@clerk/nextjs` and `@clerk/ui` are pinned to exact versions.
- **Entitlements** (`lib/billing.ts`): every check uses the **workspace owner's** plan (its Clerk org, or its creator for personal workspaces), looked up on the server with Clerk's backend billing API (`getOrganizationBillingSubscription` / `getUserBillingSubscription`). So it works for any workspace regardless of the org selected in the switcher, and for signed-out viewers of shared links. `past_due` keeps access; no subscription or an unreachable Clerk means the free plan.
- **Limits** (numbers and upgrade messages in `lib/plan-limits.ts`):
  - **Agent prompts:** 20/month free; `agent_prompts_500` / `agent_prompts_2000` per member (pooled) on paid plans. Every prompt a user sends (not tool follow-ups) is recorded in `AgentPrompt` per owner once Gemini finishes answering (a failed request, e.g. Gemini high demand, costs nothing) and counted per calendar month (UTC); rows survive workspace deletion. `/api/agent` checks the limit **before** calling Gemini and returns HTTP 402 `prompt_limit_reached`; the chat opens the upgrade dialog and shows an inline note.
  - **Workspaces:** 3 per owner without `unlimited_workspaces`, checked in `createWorkspace`.
  - **Public links:** need `public_sharing`, checked when turning sharing on and when a shared page is opened (links stop working after a downgrade).
  - **PDF export:** needs `pdf_export`; the workspace page passes the flag to the Share dialog (export runs in the browser, so this is a UI lock).
  - Limit results are returned from server actions, not thrown, since Next hides thrown messages in production. Each opens the upgrade dialog with its reason.

## Sharing & PDF Export

- **Share dialog** (header Share button): an on/off switch for a public read-only link, plus Copy and Reset. Turning sharing on (or resetting) generates a fresh `Workspace.shareToken`, so old links stop working; off sets it to null.
- **Shared page** `/shared/<token>`: no sign-in, read-only doc (from `Doc.content` JSON) and canvas (from the last saved Postgres snapshot, not the live room). Marked noindex.
- **Doc PDF:** a direct download with real, selectable text, built from the live doc editor by BlockNote's own exporter (`@blocknote/xl-pdf-exporter/react-pdf` + `@react-pdf/renderer`, both lazy-loaded on click). We use the react-pdf variant rather than the newer Typst one, which downloads a 25 MB WebAssembly compiler on first export; the react-pdf variant is marked deprecated but ships in 0.54 and our version is pinned to 0.54.x.
- **License consequence:** `@blocknote/xl-pdf-exporter` is **GPL-3.0** (or a paid BlockNote Business license). Using it means the Outpost repo itself is released under GPL-3.0: the repo has a `LICENSE` file with the GPL-3.0 text and `"license": "GPL-3.0-only"` in `package.json`. Mention this to viewers: anyone reusing the code in a closed-source product must either drop the PDF exporter or buy BlockNote's commercial license.
- **Live editors for export:** `WorkspaceEditorsContext` shares the live doc and canvas editors with the header; each export button is disabled while its panel isn't mounted (Document-only or Canvas-only view).
- **Canvas PDF:** tldraw renders the shapes to a 2x PNG (`editor.toImageDataUrl`), and jsPDF (MIT, lazy-loaded) wraps it in a single page of the same size. Custom ERD tables are included via tldraw's HTML fallback for shapes without `toSvg`.
- **Known limit:** the shared page reads the saved copies, so edits made in the last second or so (before the debounced save) may be missing there. Exports use the live editors, so they're always current.

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
- **Precisely:** the XL packages are GPL-3.0, so "open source" means the repo must be GPL-3.0 licensed, not just public. XL packages in use: `@blocknote/xl-pdf-exporter` (see "Sharing & PDF Export").
- Note for future: if this ever pivots to a closed-source/monetized product, BlockNote AI would need a commercial license at that point — the base editor itself would remain free regardless (MPL 2.0).
- Tiptap (the library BlockNote sits on) has a similar open-core split worth remembering: **core editor is MIT/free**, but Tiptap's own **Cloud Platform** (hosted realtime collab, comments, doc history, their AI Toolkit — from $49/mo, no free tier) is separate and not something we need, since realtime sync/presence is being built ourselves via tldraw sync and Supabase Realtime.

## Data Layer Patterns

Reference: [piyush-eon/ai-app-builder](https://github.com/piyush-eon/ai-app-builder) (Forge, the prior agentic-app-builder project) — reusing its proven Clerk + DB pattern rather than redesigning from scratch.

- **ORM: Prisma**, not Drizzle (original stack draft said Drizzle — switched after reviewing the reference repo's working Prisma setup; no strong technical reason to prefer Drizzle for this project specifically, and reusing a battle-tested pattern reduces build risk and video prep time). Uses `@prisma/adapter-pg` driver adapter against Supabase's Postgres connection string — Prisma 7's adapter-based engine resolves the old serverless cold-start concerns that used to favor Drizzle.
- **User sync pattern (`checkUser`)**: on each authenticated request, look up the local `User` row by `clerkId` and create it on first sight. Plans are **not** copied into the database: Clerk Billing is the only source of truth for subscriptions, read on demand (see "Billing"). Usage is the one billing fact stored locally (`AgentPrompt`).
- **Data access: Server Actions only** — `"use server"` functions in an `actions/` directory, called directly from client components. No client-side data-fetching library (see TanStack Query decision below).
- **Schema conventions carried over**: `cuid()` ids, `onDelete: Cascade` on relations back to `User`. Unlike the reference repo's stored credit balance, Outpost counts prompts per month against a plan allowance (see "Billing").

### Database schema (`prisma/schema.prisma`, Supabase Postgres)

No member or role tables: org membership and roles live in Clerk Organizations. No plan tables: subscriptions live in Clerk Billing.

| Model | Key fields | Notes |
|---|---|---|
| `User` | `clerkId` (unique), `email` (unique), `name`, `imageUrl` | Local mirror of the Clerk user, created by `checkUser`. No plan field: plans come from Clerk. |
| `Workspace` | `name`, `description`, `creatorId` → User, `clerkOrgId` (null = personal), `status` (enum `WorkspaceStatus`), `position` (Float), `shareToken` (unique, null = sharing off) | Indexed on `creatorId` and `clerkOrgId`. `status` + `position` place it on the board. |
| `Doc` | `workspaceId` (unique), `yjsState` (Bytes), `content` (JSON) | 1:1 with Workspace. `yjsState` is the real-time collaboration source of truth; `content` is a readable JSON copy for server-side use (shared page). |
| `Canvas` | `workspaceId` (unique), `content` (JSON) | 1:1 with Workspace. Last saved tldraw snapshot: the backup that re-seeds an empty sync room and feeds the shared page. |
| `AgentPrompt` | `ownerId` (Clerk org or user id), `userId` → User, `workspaceId` → Workspace (nullable), `createdAt` | One row per prompt sent. Indexed on (`ownerId`, `createdAt`) for monthly counts. |

**Deletion:** Doc and Canvas cascade with their Workspace; AgentPrompt rows are kept (`workspaceId` set to null) so usage can't be reset by deleting a workspace; everything cascades with its User.

**Migrations** (in `prisma/migrations/`, oldest first):
1. `init`: initial User / workspace tables.
2. `switch_to_clerk_orgs`, `require_clerk_org_id`: workspaces keyed to Clerk orgs instead of local membership.
3. `doc_canvas_workspace_model`: every workspace gets exactly one Doc and one Canvas.
4. `workspace_board`, `backfill_workspace_positions`: board `status` + `position`, with existing workspaces numbered by recency.
5. `workspace_review_and_description`: `IN_REVIEW` status and `description`.
6. `doc_yjs_state`: `Doc.yjsState` for real-time doc collaboration.
7. `workspace_share_token`: `Workspace.shareToken` for public links.
8. `agent_prompt_usage`: replaced the never-used `AgentActionLog` (one row per tool call) with `AgentPrompt` (one row per prompt).
9. `drop_user_plan`: removed the unused `User.plan` column and `Plan` enum.

**Workflow note:** when `prisma migrate dev` can't run (non-interactive environments, or warnings it wants confirmed), the migration SQL is generated with `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, reviewed, saved as a new migration folder, and applied with `prisma migrate deploy`; a second `migrate diff` should then print an empty migration. After any schema change, run `prisma generate` and restart the dev server.

### TanStack Query — decided against

The reference repo uses zero client-side fetching libraries: Server Components for reads, Server Actions + `revalidatePath`/`router.refresh()` for writes. Decided to follow the same pattern for Outpost rather than introduce TanStack Query.

Where it might have seemed tempting — the canvas surface's live agent state (tool-call progress, streaming status, presence) — isn't actually a "fetch and cache" problem, it's a subscribe-to-a-stream problem, which the Vercel AI SDK's own streaming hooks and tldraw sync's presence system already handle natively. Adding TanStack Query on top would be a second, redundant state-management paradigm for something already covered. Server Actions remain the default everywhere else (dashboard, board, docs CRUD).

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

**Where it lives:** `lib/agent-tools.ts` is the single source of every tool's description and Zod schema; the API route (`app/api/agent/route.ts`) passes them to `streamText` with no `execute`, and the browser runs them against the live editors (`lib/agent-canvas.ts`, `lib/agent-doc.ts`, routed by `hooks/use-workspace-agent-chat.ts`). Every request, including the automatic follow-ups after tool calls, carries a fresh summary of both the canvas (shape ids, labels, table columns) and the doc (block ids, types, Markdown). A tool always returns `{ success }` or `{ success: false, error }`, including when its surface isn't open, so the chat never hangs waiting on a missing output.

**Canvas tools:** `createRectangle`, `createEllipse`, `createText`, `createArrow`, `updateShape`, `deleteShape`, plus the ERD tools `createEntityTable`, `addColumn`, `updateColumn`, `removeColumn`, `connectRelationship` (anchors the arrow on the named PK and FK rows). New shapes take a **caller-assigned `id`** so later calls in the same turn can reference them; existing shapes are referenced by their real ids from the context.

**Doc tools:** the model writes Markdown, which BlockNote parses into blocks. `insertDocContent` (append, or after a block id; fills an empty doc), `updateDocBlock` (rewrites a block in place, keeping its id), `deleteDocBlocks`, `replaceDoc` (full rewrites only).

**Choosing the surface:** if the user names one ("in the doc", "just the diagram"), only that one changes. Otherwise the agent decides from the request (visual structure on the canvas, prose in the doc, both when needed) and can convert between them ("write up this diagram as a spec", "draw what the doc describes"). This cross-surface editing is what earns the "workspace" naming.

**Follow-up edits are not separate tools**: they reuse the same tools with the current state as context. (A self-critique pass was planned the same way, as a second "review for overlaps" prompt, but was cut on 2026-09-28.)

## Open / Next Steps (not yet decided)

- Chapter-by-chapter video outline / script — not yet created.
- Final title/thumbnail line — leaning toward "Agentic Workspace App" but not locked.
- Landing page copy still promises one feature that isn't built: canvas templates. The self-critique pass, comments/pins and doc callouts were cut on 2026-09-28 and removed from the copy; agent cursor wording was removed earlier (the hero's cursor visual was replaced by the walkthrough video).
