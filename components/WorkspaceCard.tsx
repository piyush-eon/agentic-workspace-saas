import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";
import { statusTitle } from "@/lib/workspace-status";
import { timeAgo } from "@/lib/utils";

export type WorkspaceCardData = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  lastActivity: Date;
  creator: { name: string | null; imageUrl: string | null };
};

// One card for the board and the dashboard's recent list: title, description, and a Jira-style
// footer (last edit on the left, the creator's avatar on the right). `actions` renders over the
// top-right corner, `showStatus` adds the column name (the board already shows it as the column).
export function WorkspaceCard({
  workspace,
  showStatus = false,
  highlighted = false,
  actions,
}: {
  workspace: WorkspaceCardData;
  showStatus?: boolean;
  highlighted?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative flex h-36 flex-col gap-1 rounded-md bg-muted p-3.5 shadow-sm shadow-black/40 ring-1 transition-colors hover:bg-secondary ${
        highlighted ? "shadow-lg ring-primary/60" : "ring-white/6"
      }`}
    >
      {/* after:inset-0 stretches the link over the whole card, so `actions` can sit on top
          without being nested inside the link. */}
      <Link
        href={`/workspace/${workspace.id}`}
        draggable={false}
        className="line-clamp-2 pr-7 text-sm leading-snug font-medium after:absolute after:inset-0"
      >
        {workspace.name}
      </Link>
      {workspace.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{workspace.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        {/* Relative time can differ by a minute between the server and browser render. */}
        <span className="flex min-w-0 items-center gap-1.5" suppressHydrationWarning>
          <LayoutGrid className="size-3.5 shrink-0 text-primary" />
          <span className="truncate" suppressHydrationWarning>
            {showStatus && `${statusTitle(workspace.status)} · `}
            {timeAgo(workspace.lastActivity)}
          </span>
        </span>
        <CreatorAvatar creator={workspace.creator} />
      </div>

      {actions}
    </div>
  );
}

function CreatorAvatar({ creator }: { creator: WorkspaceCardData["creator"] }) {
  const name = creator.name ?? "Unknown";
  return creator.imageUrl ? (
    <Image src={creator.imageUrl} alt={name} title={name} width={20} height={20} className="size-5 shrink-0 rounded-full" />
  ) : (
    <span
      title={name}
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
