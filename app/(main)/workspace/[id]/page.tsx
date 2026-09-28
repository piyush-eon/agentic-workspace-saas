import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { Button } from "@/components/ui/button";
import { EditableWorkspaceName } from "./_components/EditableWorkspaceName";
import { DocEditor } from "@/components/DocEditorLoader";
import { CanvasEditor } from "./_components/CanvasEditor";
import { AgentToggleButton } from "./_components/AgentToggleButton";
import { ShareDialog } from "./_components/ShareDialog";
import { getEntitlements, workspaceOwnerId, workspaceOwnerSelect } from "@/lib/billing";
import { PlanButton } from "@/components/PlanButton";
import { WorkspaceEditorsProvider } from "@/components/WorkspaceEditorsContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type ViewMode = "doc" | "canvas" | "both";

function parseViewMode(value: string | string[] | undefined): ViewMode {
  return value === "doc" || value === "canvas" ? value : "both";
}

export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/workspace/[id]">) {
  const { id } = await params;
  const { view: viewParam, prompt } = await searchParams;
  const view = parseViewMode(viewParam);

  // 404 rather than 403 so outsiders can't tell whether a workspace id exists.
  if (!(await canAccessWorkspace(id))) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      name: true,
      shareToken: true,
      ...workspaceOwnerSelect,
      doc: { select: { content: true, yjsState: true } },
      canvas: { select: { content: true } },
    },
  });
  if (!workspace) notFound();
  const entitlements = await getEntitlements(workspaceOwnerId(workspace));

  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";

  return (
    // Lets header UI (agent panel, Share dialog) reach the live doc and canvas editors.
    <WorkspaceEditorsProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        {/* Logo (back to dashboard) and name left, view switcher centered, actions right. */}
        <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
          <div className="flex flex-1 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/mascot-dark.png"
                alt="Back to dashboard"
                width={24}
                height={24}
                className="size-6"
              />
            </Link>
            <EditableWorkspaceName workspaceId={id} initialName={workspace.name} />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
            {(["doc", "both", "canvas"] as const).map((mode) => (
              <Button
                key={mode}
                asChild
                variant={view === mode ? "secondary" : "ghost"}
                size="sm"
                className="capitalize"
              >
                <Link href={mode === "both" ? `/workspace/${id}` : `/workspace/${id}?view=${mode}`}>
                  {mode === "doc" ? "Document" : mode}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <PlanButton upgradeOnlyWhenOut />
            <ShareDialog
              workspaceId={id}
              workspaceName={workspace.name}
              initialShareToken={workspace.shareToken}
              canShare={entitlements.publicSharing}
              canExportPdf={entitlements.pdfExport}
            />
            <AgentToggleButton workspaceId={id} initialPrompt={typeof prompt === "string" ? prompt : undefined} />
          </div>
        </header>

        {/* key gives each view a fresh panel group, so an old layout isn't applied to new panels */}
        <ResizablePanelGroup key={view} orientation="horizontal" className="flex-1">
          {showDoc && (
            <ResizablePanel defaultSize={35} minSize={20}>
              <DocEditor
                key={id}
                workspaceId={id}
                initialContent={workspace.doc?.content as Block[] | null}
                initialState={
                  workspace.doc?.yjsState ? Buffer.from(workspace.doc.yjsState).toString("base64") : null
                }
              />
            </ResizablePanel>
          )}
          {showDoc && showCanvas && <ResizableHandle withHandle />}
          {showCanvas && (
            <ResizablePanel defaultSize={75} minSize={20}>
              <CanvasEditor
                workspaceId={id}
                initialSnapshot={workspace.canvas?.content as TLEditorSnapshot | null}
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </WorkspaceEditorsProvider>
  );
}
