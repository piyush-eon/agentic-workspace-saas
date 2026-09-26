import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Org workspaces are open to every member of that org; personal (org-less) ones only to their creator.
export async function canAccessWorkspace(workspaceId: string) {
  const { userId, orgId } = await auth();
  if (!userId) return false;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { clerkOrgId: true, creator: { select: { clerkId: true } } },
  });
  if (!workspace) return false;

  if (!workspace.clerkOrgId) return workspace.creator.clerkId === userId;
  if (workspace.clerkOrgId === orgId) return true;

  // The session only knows the active org, so check full membership for links into another org.
  const clerk = await clerkClient();
  const { data: memberships } = await clerk.users.getOrganizationMembershipList({ userId, limit: 100 });
  return memberships.some((m) => m.organization.id === workspace.clerkOrgId);
}
