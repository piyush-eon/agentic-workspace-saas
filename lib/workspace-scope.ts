import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@/lib/generated/prisma/client";

// The workspaces a page should list: the active org's, or the user's personal ones when no org
// is selected in the switcher. Shared by the dashboard and the board page, along with the card
// data below.
export async function getWorkspaceScope(userId: string) {
  const { orgId } = await auth();
  const orgName = orgId
    ? (await (await clerkClient()).organizations.getOrganization({ organizationId: orgId })).name
    : "Personal";
  const where: Prisma.WorkspaceWhereInput = orgId
    ? { clerkOrgId: orgId }
    : { clerkOrgId: null, creatorId: userId };
  return { orgName, where };
}

// What a workspace card needs, loaded the same way on the dashboard and the board.
export const workspaceCardSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  position: true,
  updatedAt: true,
  creator: { select: { name: true, imageUrl: true } },
  doc: { select: { updatedAt: true } },
  canvas: { select: { updatedAt: true } },
} satisfies Prisma.WorkspaceSelect;

type WorkspaceCardRow = Prisma.WorkspaceGetPayload<{ select: typeof workspaceCardSelect }>;

// A workspace's own updatedAt only changes on rename/move, so activity also counts doc and canvas edits.
export function toWorkspaceCard({ updatedAt, doc, canvas, ...workspace }: WorkspaceCardRow) {
  const lastActivity = new Date(
    Math.max(updatedAt.getTime(), doc?.updatedAt.getTime() ?? 0, canvas?.updatedAt.getTime() ?? 0)
  );
  return { ...workspace, lastActivity };
}
