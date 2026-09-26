"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { SupabaseYjsProvider } from "@/lib/supabase-yjs-provider";
import { fromBase64 } from "@/lib/base64";

// Creates the shared Yjs doc for a workspace and connects it to Realtime. Returns null until
// the provider is ready, so the editor only mounts once it has the saved + peers' latest state.
export function useCollaborativeDoc(workspaceId: string, initialState: string | null) {
  const [collab, setCollab] = useState<{ doc: Y.Doc; provider: SupabaseYjsProvider } | null>(null);
  // Only the first saved state matters — later server refreshes (e.g. after a rename) must not
  // reconnect the editor.
  const [savedState] = useState(initialState);

  useEffect(() => {
    const doc = new Y.Doc();
    if (savedState) Y.applyUpdate(doc, fromBase64(savedState));
    const provider = new SupabaseYjsProvider(doc, workspaceId, () => setCollab({ doc, provider }));

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [workspaceId, savedState]);

  return collab;
}
