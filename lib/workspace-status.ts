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
