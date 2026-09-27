import Link from "next/link";
import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";
import { statusTitle } from "@/lib/workspace-status";
import { timeAgo } from "@/lib/utils";

type RecentWorkspace = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  lastActivity: Date;
};

export function RecentWorkspaces({ workspaces }: { workspaces: RecentWorkspace[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {workspaces.map((workspace) => (
        <Link
          key={workspace.id}
          href={`/workspace/${workspace.id}`}
          className="group flex h-36 flex-col rounded-xl border border-white/8 bg-white/2 p-4 transition-colors hover:border-primary/40 hover:bg-white/4"
        >
          <span className="line-clamp-1 text-sm font-medium">{workspace.name}</span>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {workspace.description || "No description"}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground/80">
            <span className="rounded-full border border-white/10 px-2 py-0.5">{statusTitle(workspace.status)}</span>
            <span>Edited {timeAgo(workspace.lastActivity)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
