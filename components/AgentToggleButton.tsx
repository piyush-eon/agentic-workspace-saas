"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentChatPanel } from "@/components/AgentChatPanel";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { useCanvasAgentChat } from "@/hooks/use-canvas-agent-chat";

// Owns the open/closed state for the agent chat panel — needs a client boundary since
// page.tsx is a server component, so this is the button plus the panel it toggles. The chat
// itself is created here (not inside AgentChatPanel) and kept mounted even while closed, so
// closing/reopening the panel doesn't wipe the conversation.
export function AgentToggleButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { canvasEditor: editor } = useWorkspaceEditors();
  const chat = useCanvasAgentChat(editor);

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
      {isOpen && <AgentChatPanel chat={chat} editor={editor} onClose={() => setIsOpen(false)} />}
    </>
  );
}
