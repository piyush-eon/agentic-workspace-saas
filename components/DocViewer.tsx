"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";
import { outpostDarkTheme } from "@/lib/blocknote-theme";

// Read-only doc from its saved JSON copy — used by the public shared link.
export function DocViewer({ content }: { content: Block[] | null }) {
  const editor = useCreateBlockNote({ initialContent: content?.length ? content : undefined });
  return <BlockNoteView editor={editor} editable={false} theme={outpostDarkTheme} />;
}
