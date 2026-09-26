"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Looks up the local User row by clerkId, creating it on first sight.
// Local DB is the source of truth for app-side plan/usage state; Clerk owns the actual subscription.
export async function checkUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) return existing;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
      imageUrl: clerkUser.imageUrl,
    },
  });
}
