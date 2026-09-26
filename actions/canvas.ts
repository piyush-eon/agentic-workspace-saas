"use server";

import { canAccessWorkspace } from "@/lib/workspace-access";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

// Called from the client on a debounce — same reasoning as saveDocContent: no revalidatePath,
// the tldraw store is already the source of truth on the client for the active session.
export async function saveCanvasContent(workspaceId: string, content: Prisma.InputJsonValue) {
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  await prisma.canvas.update({
    where: { workspaceId },
    data: { content },
  });
}
