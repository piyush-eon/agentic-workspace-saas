import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@/lib/generated/prisma/client";

// The active org's workspaces, or the user's personal ones when no org is selected.
export function scopeWhere(orgId: string | null | undefined, userId: string): Prisma.WorkspaceWhereInput {
  return orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId: userId };
}

// What the dashboard and the board list, plus the name to show above it.
export async function getWorkspaceScope(userId: string) {
  const { orgId } = await auth();
  const orgName = orgId
    ? (await (await clerkClient()).organizations.getOrganization({ organizationId: orgId })).name
    : "Personal";
  return { orgName, where: scopeWhere(orgId, userId) };
}
