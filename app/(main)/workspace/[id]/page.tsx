import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2 } from "lucide-react";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { Button } from "@/components/ui/button";
import { EditableWorkspaceName } from "@/components/EditableWorkspaceName";
import { DocEditor } from "@/components/DocEditorLoader";
import { CanvasEditor } from "@/components/CanvasEditor";
import { AgentToggleButton } from "@/components/AgentToggleButton";
import { CanvasEditorProvider } from "@/components/CanvasEditorContext";
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
  const view = parseViewMode((await searchParams).view);

  // 404 rather than 403 so outsiders can't tell whether a workspace id exists.
  if (!(await canAccessWorkspace(id))) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      name: true,
      doc: { select: { content: true, yjsState: true } },
      canvas: { select: { content: true } },
    },
  });
  if (!workspace) notFound();

  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";

  return (
    // CanvasEditorProvider wraps header + panels so AgentToggleButton's panel can read the live
    // tldraw editor instance CanvasEditor publishes into context on mount — they're siblings,
    // not parent/child, so context is the bridge.
    <CanvasEditorProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        {/* Real header row (not a floating overlay) — matches Eraser's layout: logo/name left,
            Document/Both/Canvas segmented control centered. Logo doubles as the back-to-dashboard link. */}
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="size-4" />
              Share
            </Button>
            <AgentToggleButton />
          </div>
        </header>

        {/* key forces a fresh panel group when the visible set changes, so react-resizable-panels
            doesn't try to reconcile a stale layout (e.g. 2 panels -> 1) against old panel ids */}
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
    </CanvasEditorProvider>
  );
}
