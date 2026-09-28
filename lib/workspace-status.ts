import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";

// Board columns, in order. Shared by the kanban board and the recent workspace cards.
export const WORKSPACE_STATUSES: { status: WorkspaceStatus; title: string }[] = [
  { status: "PLANNING", title: "Planning" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "IN_REVIEW", title: "In review" },
  { status: "DONE", title: "Done" },
];

export function statusTitle(status: WorkspaceStatus) {
  return WORKSPACE_STATUSES.find((s) => s.status === status)?.title ?? status;
}

// Fields every workspace card needs, including what lastActivityAt reads.
export const workspaceCardSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  updatedAt: true,
  creator: { select: { name: true, imageUrl: true } },
  doc: { select: { updatedAt: true } },
  canvas: { select: { updatedAt: true } },
} as const;

// A workspace's own updatedAt only changes on rename or move, so real activity also counts
// edits to its doc and canvas.
export function lastActivityAt(workspace: {
  updatedAt: Date;
  doc: { updatedAt: Date } | null;
  canvas: { updatedAt: Date } | null;
}) {
  return new Date(
    Math.max(
      workspace.updatedAt.getTime(),
      workspace.doc?.updatedAt.getTime() ?? 0,
      workspace.canvas?.updatedAt.getTime() ?? 0
    )
  );
}
