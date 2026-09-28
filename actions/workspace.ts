"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/actions/check-user";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { prisma } from "@/lib/prisma";
import { WorkspaceStatus } from "@/lib/generated/prisma/enums";
import { getEntitlements, workspaceOwnerId } from "@/lib/billing";
import { FREE_WORKSPACE_LIMIT, type LimitError } from "@/lib/plan-limits";

// Workspaces are listed on both the dashboard (recent) and the board page.
function revalidateWorkspaceLists() {
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
}

// A workspace is always exactly one Doc + one Canvas, so both are created in the same
// transaction as the Workspace row — never left dangling without a pair. Plan limits are
// returned rather than thrown, since Next hides thrown messages from the client in production.
export async function createWorkspace(
  name: string,
  description?: string
): Promise<{ workspace: { id: string } } | { limit: LimitError }> {
  const user = await checkUser();
  if (!user) throw new Error("Not signed in");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workspace name is required");

  // Belongs to whichever org is active; no active org means a personal workspace.
  const { orgId } = await auth();
  const scope = orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId: user.id };

  const { unlimitedWorkspaces } = await getEntitlements(orgId ?? user.clerkId);
  if (!unlimitedWorkspaces && (await prisma.workspace.count({ where: scope })) >= FREE_WORKSPACE_LIMIT) {
    return { limit: "workspaces" };
  }

  // New workspaces land at the top of the Planning column.
  const top = await prisma.workspace.findFirst({
    where: { status: "PLANNING", ...scope },
    orderBy: { position: "asc" },
    select: { position: true },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: trimmedName,
      description: description?.trim() || null,
      creatorId: user.id,
      clerkOrgId: orgId ?? null,
      position: top ? top.position - 1 : 0,
      doc: { create: {} },
      canvas: { create: {} },
    },
  });

  revalidateWorkspaceLists();
  return { workspace: { id: workspace.id } };
}

// Leaving description undefined keeps it as-is (the header's inline rename only sends a name).
export async function updateWorkspace(workspaceId: string, name: string, description?: string) {
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workspace name is required");

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: trimmedName,
      ...(description !== undefined && { description: description.trim() || null }),
    },
  });

  revalidateWorkspaceLists();
  revalidatePath(`/workspace/${workspaceId}`);
  return workspace;
}

// Any org member can open and edit a workspace, but only its creator or an org admin can delete it.
export async function deleteWorkspace(workspaceId: string) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { clerkOrgId: true, creator: { select: { clerkId: true } } },
  });
  const isCreator = workspace.creator.clerkId === userId;
  // orgRole describes the active org only, so it counts only for a workspace in that org.
  const isOrgAdmin = orgRole === "org:admin" && workspace.clerkOrgId === orgId;
  if (!isCreator && !isOrgAdmin) {
    throw new Error("Only the creator or an org admin can delete this workspace");
  }

  // Doc and canvas cascade-delete with the workspace; its agent prompts stay, so usage can't reset.
  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidateWorkspaceLists();
}

// Called after a board drag — the client has already moved the card, so no revalidatePath.
export async function moveWorkspace(workspaceId: string, status: WorkspaceStatus, position: number) {
  if (!Object.values(WorkspaceStatus).includes(status) || !Number.isFinite(position)) {
    throw new Error("Invalid move");
  }
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { status, position },
  });
}

// Turning sharing on creates a fresh token, so re-enabling never revives an old link.
// Resetting is the same as turning it on again: the previous link stops working.
export async function setWorkspaceSharing(
  workspaceId: string,
  enabled: boolean
): Promise<{ shareToken: string | null } | { limit: LimitError }> {
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  if (enabled) {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { clerkOrgId: true, creator: { select: { clerkId: true } } },
    });
    if (!(await getEntitlements(workspaceOwnerId(workspace))).publicSharing) return { limit: "sharing" };
  }

  const { shareToken } = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { shareToken: enabled ? randomBytes(24).toString("base64url") : null },
    select: { shareToken: true },
  });

  revalidatePath(`/workspace/${workspaceId}`);
  return { shareToken };
}
