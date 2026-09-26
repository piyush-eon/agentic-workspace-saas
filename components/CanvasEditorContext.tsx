"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Editor } from "tldraw";

// Shares the live tldraw editor instance between CanvasEditor (which owns it, deep in the doc/
// canvas ResizablePanelGroup) and AgentChatPanel (a sibling overlay outside that tree) — without
// this, the chat panel would have no way to call editor.createShape() etc. for tool execution.
const CanvasEditorContext = createContext<{
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
} | null>(null);

export function CanvasEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  return (
    <CanvasEditorContext.Provider value={{ editor, setEditor }}>{children}</CanvasEditorContext.Provider>
  );
}

export function useCanvasEditorContext() {
  const ctx = useContext(CanvasEditorContext);
  if (!ctx) throw new Error("useCanvasEditorContext must be used within a CanvasEditorProvider");
  return ctx;
}
