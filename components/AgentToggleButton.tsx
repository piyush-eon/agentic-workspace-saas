"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentChatPanel } from "@/components/AgentChatPanel";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { useWorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";

// Owns the open/closed state for the agent chat panel — needs a client boundary since
// page.tsx is a server component, so this is the button plus the panel it toggles. The chat
// itself is created here (not inside AgentChatPanel) and kept mounted even while closed, so
// closing/reopening the panel doesn't wipe the conversation.
export function AgentToggleButton({ initialPrompt }: { initialPrompt?: string }) {
  const [isOpen, setIsOpen] = useState(!!initialPrompt);
  const { canvasEditor, docEditor } = useWorkspaceEditors();
  const chat = useWorkspaceAgentChat({ canvasEditor, docEditor });
  const router = useRouter();
  const pathname = usePathname();
  const promptSent = useRef(false);

  // A prompt from the dashboard is sent once both editors are ready, so the agent sees both
  // surfaces. It's then dropped from the URL so a refresh doesn't send it again.
  useEffect(() => {
    if (!initialPrompt || promptSent.current || !canvasEditor || !docEditor) return;
    promptSent.current = true;
    chat.sendMessage({ text: initialPrompt });
    router.replace(pathname, { scroll: false });
  }, [initialPrompt, canvasEditor, docEditor, chat, router, pathname]);

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? (
          <>
            <X className="size-4" />
            Close
          </>
        ) : (
          <>
            <Image src="/brand/mascot.png" alt="" width={16} height={16} className="size-4" />
            Ask Agent
          </>
        )}
      </Button>
      {isOpen && <AgentChatPanel chat={chat} isReady={!!canvasEditor || !!docEditor} />}
    </>
  );
}
