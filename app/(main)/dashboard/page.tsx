import { LayoutGrid, Plus } from "lucide-react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkUser } from "@/actions/check-user";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { WorkspaceBoard } from "@/components/WorkspaceBoard";

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) {
    return <div className="p-8">Sign in to see your workspaces.</div>;
  }

  // Scoped to the active org from the switcher; no active org means personal workspaces only.
  const { orgId } = await auth();
  const orgName = orgId
    ? (await (await clerkClient()).organizations.getOrganization({ organizationId: orgId })).name
    : "Personal";

  const workspaces = await prisma.workspace.findMany({
    where: orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId: user.id },
    select: { id: true, name: true, description: true, status: true, position: true },
    orderBy: { position: "asc" },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{orgName}</p>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
        </div>
        <WorkspaceDialog
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              New workspace
            </Button>
          }
        />
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-24 text-center text-muted-foreground">
          <LayoutGrid className="size-8 opacity-50" />
          <p>No workspaces yet. Create one to get started.</p>
        </div>
      ) : (
        <WorkspaceBoard workspaces={workspaces} />
      )}
    </div>
  );
}
