import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@/lib/generated/prisma/client";

// The workspaces a page should list: the active org's, or the user's personal ones when no org
// is selected in the switcher. Shared by the dashboard and the board page.
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
