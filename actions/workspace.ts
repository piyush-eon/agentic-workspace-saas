"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/actions/check-user";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { prisma } from "@/lib/prisma";
import { WorkspaceStatus } from "@/lib/generated/prisma/enums";

// A workspace is always exactly one Doc + one Canvas, so both are created in the same
// transaction as the Workspace row — never left dangling without a pair.
export async function createWorkspace(name: string, description?: string) {
  const user = await checkUser();
  if (!user) throw new Error("Not signed in");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workspace name is required");

  // Belongs to whichever org is active; no active org means a personal workspace.
  const { orgId } = await auth();

  // New workspaces land at the top of the Planning column.
  const top = await prisma.workspace.findFirst({
    where: {
      status: "PLANNING",
      ...(orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId: user.id }),
    },
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

  revalidatePath("/dashboard");
  return workspace;
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

  revalidatePath("/dashboard");
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

  // Doc, canvas and agent logs cascade-delete with the workspace.
  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
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
