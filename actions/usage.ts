"use server";

import { auth } from "@clerk/nextjs/server";
import { getPromptUsage } from "@/lib/billing";

// Usage for the header: the selected org, or the personal account.
export async function getActivePromptUsage() {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return getPromptUsage(orgId ?? userId);
}
