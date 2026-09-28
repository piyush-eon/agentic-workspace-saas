import { WorkspaceCard, type WorkspaceCardData } from "@/components/WorkspaceCard";

export function RecentWorkspaces({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} showStatus />
      ))}
    </div>
  );
}
