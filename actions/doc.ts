"use server";

import * as Y from "yjs";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

// Called from the client on a debounce — no revalidatePath, since the editor already holds
// the latest content locally and a refetch would just overwrite in-flight local edits.
export async function saveDocContent(
  workspaceId: string,
  yjsState: string,
  content: Prisma.InputJsonValue
) {
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  const incoming = Buffer.from(yjsState, "base64");

  // Merge into the stored state instead of overwriting it, with the row locked, so two
  // collaborators saving at the same moment can't drop each other's edits.
  await prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ yjsState: Uint8Array | null }[]>`
      SELECT "yjsState" FROM "Doc" WHERE "workspaceId" = ${workspaceId} FOR UPDATE`;
    const merged = row?.yjsState ? Y.mergeUpdates([row.yjsState, incoming]) : incoming;

    await tx.doc.update({
      where: { workspaceId },
      data: { yjsState: Uint8Array.from(merged), content },
    });
  });
}
