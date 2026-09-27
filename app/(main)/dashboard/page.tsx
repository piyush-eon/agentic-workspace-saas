import Link from "next/link";
import { KanbanSquare, Plus } from "lucide-react";
import { checkUser } from "@/actions/check-user";
import { prisma } from "@/lib/prisma";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { RecentWorkspaces } from "@/components/RecentWorkspaces";
import { DashboardPrompt } from "@/components/DashboardPrompt";

const RECENT_COUNT = 4;

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) {
    return <div className="p-8">Sign in to see your workspaces.</div>;
  }

  const { orgName, where } = await getWorkspaceScope(user.id);
  const workspaces = await prisma.workspace.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updatedAt: true,
      doc: { select: { updatedAt: true } },
      canvas: { select: { updatedAt: true } },
    },
  });

  // A workspace's own updatedAt only changes on rename/move, so recency also counts doc and
  // canvas edits.
  const recent = workspaces
    .map((w) => ({
      ...w,
      lastActivity: new Date(
        Math.max(
          w.updatedAt.getTime(),
          w.doc?.updatedAt.getTime() ?? 0,
          w.canvas?.updatedAt.getTime() ?? 0
        )
      ),
    }))
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, RECENT_COUNT);

  return (
    <div className="p-8">
      <DashboardPrompt />

      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{orgName}</p>
            <h2 className="text-lg font-semibold">Recent workspaces</h2>
          </div>
          <div className="flex items-center gap-2">
            {workspaces.length > 0 && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <Link href="/workspaces">
                  <KanbanSquare className="size-4" />
                  View board ({workspaces.length})
                </Link>
              </Button>
            )}
            <WorkspaceDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  New workspace
                </Button>
              }
            />
          </div>
        </div>

        {workspaces.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
            No workspaces yet. Describe what you want to plan above to start
            one.
          </p>
        ) : (
          <RecentWorkspaces workspaces={recent} />
        )}
      </section>
    </div>
  );
}
