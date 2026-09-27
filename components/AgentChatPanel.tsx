"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Send, Square, Wand2 } from "lucide-react";
import { isToolUIPart, isDynamicToolUIPart } from "ai";
import type { WorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/MicButton";

const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 640;

export function AgentChatPanel({ chat, isReady }: { chat: WorkspaceAgentChat; isReady: boolean }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [input, setInput] = useState("");
  const isDragging = useRef(false);
  const { messages, sendMessage, stop, status } = chat;

  // Drag-to-resize on the panel's left edge — independent of the doc/canvas ResizablePanelGroup,
  // since this panel floats on top rather than participating in that split.
  const handleDragStart = (e: React.PointerEvent) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const next = window.innerWidth - e.clientX;
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
  };

  const handleDragEnd = () => {
    isDragging.current = false;
  };

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = () => {
    const trimmed = input.trim();
    // Enter must not send mid-response either: a second request running alongside the first
    // makes the SDK re-add the in-progress assistant message, duplicating its id.
    if (!trimmed || !isReady || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div
      style={{ width }}
      className="fixed top-14 bottom-0 right-0 z-30 flex flex-col border-l border-white/10 bg-card shadow-2xl"
    >
      {/* Drag handle */}
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className="absolute inset-y-0 left-0 w-1 cursor-col-resize hover:bg-primary/40"
      />

      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/6 px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/mascot-dark.png"
            alt=""
            width={18}
            height={18}
            className="size-[18px]"
          />
          <span className="text-sm font-medium">Outpost Agent</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask the agent to draw a diagram, write or edit the doc, or both. Say
            &ldquo;in the doc&rdquo; or &ldquo;on the canvas&rdquo; to keep it to one side.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] space-y-1.5 rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-white/5 text-foreground"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "reasoning") {
                  const isStreaming = part.state === "streaming";
                  return (
                    <div key={i}>
                      <div className="mb-1 flex items-center gap-1.5">
                        <Wand2
                          className={`h-3 w-3 shrink-0 text-blue-400/60 ${isStreaming ? "animate-pulse" : ""}`}
                        />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-blue-400/50">
                          {part.text ? "Agent reasoning" : "Thinking..."}
                        </span>
                      </div>
                      {part.text && (
                        <p className="text-[12px] leading-relaxed text-white/35">
                          {part.text}
                          {isStreaming && (
                            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse align-middle bg-blue-400/60" />
                          )}
                        </p>
                      )}
                    </div>
                  );
                }
                if (part.type === "text")
                  return <span key={i}>{part.text}</span>;
                if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                  const toolName = isDynamicToolUIPart(part)
                    ? part.toolName
                    : part.type.replace(/^tool-/, "");
                  return (
                    <div
                      key={i}
                      className="rounded-md bg-black/20 px-2 py-1 text-xs text-muted-foreground"
                    >
                      {part.state === "output-available" ? "✓" : "…"} {toolName}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))
        )}
        {isBusy && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex gap-0.5">
              <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-1 animate-bounce rounded-full bg-muted-foreground" />
            </span>
            Thinking...
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-end gap-2 border-t border-white/6 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the agent..."
          rows={1}
          disabled={!isReady}
          className="max-h-32 flex-1 resize-none rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-50"
        />
        <MicButton value={input} onChange={setInput} disabled={!isReady} />
        {isBusy ? (
          <Button size="icon" variant="secondary" onClick={stop}>
            <Square className="size-3.5" />
          </Button>
        ) : (
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || !isReady}>
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
