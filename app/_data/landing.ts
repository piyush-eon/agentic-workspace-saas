import { LayoutGrid, FileText, KanbanSquare } from "lucide-react";
import { CanvasMock, DocsMock, BoardMock } from "../_components/SurfaceVisuals";

// Static copy for the landing page, kept out of the markup so it's easy to edit.

export const AUDIENCES = ["Product teams", "Founders", "Solo builders", "Design agencies", "Consultants"];

// Rows alternate image side so the section doesn't read as a flat repeating grid.
export const SURFACES = [
  {
    icon: LayoutGrid,
    title: "Canvas",
    description:
      "An infinite whiteboard where the agent drafts flowcharts, architecture diagrams, and journeys shape by shape, instead of hiding it all behind a black-box generate button.",
    bullets: [
      "Templates for flowcharts, ERDs, architecture, and org charts",
      "Follow-up edits: ask for changes and it edits shapes in place",
      "ERD tables with typed columns and key badges",
    ],
    visual: CanvasMock,
  },
  {
    icon: FileText,
    title: "Docs",
    description:
      "Turn any diagram into a written spec. The agent drafts, rewrites, and summarizes in a block-based editor, pulling structure straight from what's on the canvas.",
    bullets: [
      "Block-based editor: headings, lists, checklists, tables, code",
      '"Write this diagram up as a spec" pulls structure automatically',
      "Rewrite or summarize any section on command",
    ],
    visual: DocsMock,
  },
  {
    icon: KanbanSquare,
    title: "Team board",
    description:
      "Every workspace in your organization lives on one shared board. Drag it from planning to done, and jump in with teammates, with live cursors on the canvas and in the doc.",
    bullets: [
      "One kanban board for every workspace in your org",
      "Live cursors and edits on the canvas and in docs",
      "Anyone in your org can join any workspace instantly",
    ],
    visual: BoardMock,
  },
];

export const STEPS = [
  {
    title: "Describe what you need",
    body: "Just say “Map out our onboarding flow.” Plain language, no diagramming syntax to learn. Or just talk: voice input works too.",
  },
  {
    title: "Watch the agent draw",
    body: "Shapes appear one by one as the agent works, the same way a teammate would draw over a call.",
  },
  {
    title: "Keep iterating together",
    body: "Ask for changes, pull it into a doc, or bring in your team. Same agent, same context.",
  },
];
