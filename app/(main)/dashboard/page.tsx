import { redirect } from "next/navigation";
import Link from "next/link";
import { KanbanSquare, Plus } from "lucide-react";
import { compareDesc } from "date-fns";
import { checkUser } from "@/actions/check-user";
import { prisma } from "@/lib/prisma";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { withLastActivity, workspaceCardSelect } from "@/lib/workspace-status";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { RecentWorkspaces } from "./_components/RecentWorkspaces";
import { DashboardPrompt } from "./_components/DashboardPrompt";

const RECENT_COUNT = 4;

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect("/sign-in");

  const { orgName, where } = await getWorkspaceScope(user.id);
  const workspaces = await prisma.workspace.findMany({ where, select: workspaceCardSelect });
  const recent = workspaces
    .map(withLastActivity)
    .sort((a, b) => compareDesc(a.lastActivity, b.lastActivity))
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
