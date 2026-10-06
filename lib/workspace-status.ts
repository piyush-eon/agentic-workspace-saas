import { max } from "date-fns";
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

// Fields every workspace card needs, including what withLastActivity reads.
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

type Dated = { updatedAt: Date } | null;

// A workspace's own updatedAt only changes on rename or move, so real activity also counts
// edits to its doc and canvas.
export function withLastActivity<T extends { updatedAt: Date; doc: Dated; canvas: Dated }>(workspace: T) {
  const lastActivity = max([workspace.updatedAt, workspace.doc?.updatedAt ?? 0, workspace.canvas?.updatedAt ?? 0]);
  return { ...workspace, lastActivity };
}
