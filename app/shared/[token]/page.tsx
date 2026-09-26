import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DocViewer } from "@/components/DocEditorLoader";
import { CanvasViewer } from "@/components/CanvasViewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Shared links are private-by-obscurity, so keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Public, no sign-in: anyone with the token sees a read-only copy of the doc and canvas.
export default async function SharedPage({ params }: PageProps<"/shared/[token]">) {
  const { token } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      doc: { select: { content: true } },
      canvas: { select: { content: true } },
    },
  });
  if (!workspace) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/6 bg-background px-4">
        <Link href="/" className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80">
          <Image src="/brand/mascot-dark.png" alt="Outpost" width={24} height={24} className="size-6" />
        </Link>
        <span className="text-sm font-medium">{workspace.name}</span>
        <Badge variant="outline" className="border-white/15 text-xs font-normal text-muted-foreground">
          View only
        </Badge>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full overflow-y-auto pt-6">
            <DocViewer content={workspace.doc?.content as Block[] | null} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} minSize={20}>
          <CanvasViewer snapshot={workspace.canvas?.content as TLEditorSnapshot | null} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
