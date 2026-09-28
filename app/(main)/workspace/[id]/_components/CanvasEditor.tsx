"use client";

import { useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Tldraw,
  atom,
  computed,
  createTLCurrentUser,
  createUserId,
  getUserPreferences,
  UserRecordType,
  DefaultToolbar,
  DefaultToolbarContent,
  type Editor,
  type TLEditorSnapshot,
  type TLComponents,
} from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import { saveCanvasContent } from "@/actions/canvas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { EntityTableShapeUtil } from "@/components/EntityTable/EntityTableShapeUtil";
import { AddEntityTableButton } from "@/components/EntityTable/AddEntityTableButton";
import { snapArrowBindingToRow } from "@/components/EntityTable/snapArrowToRow";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { colorForUser } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1000;

const shapeUtils = [EntityTableShapeUtil];

// A cleaner, single-page canvas: no style panel, page menu or main menu, and a vertical toolbar
// on the left with our Add table button.
const components: TLComponents = {
  StylePanel: null,
  PageMenu: null,
  MainMenu: null,
  Toolbar: () => (
    <DefaultToolbar orientation="vertical">
      <AddEntityTableButton />
      <DefaultToolbarContent />
    </DefaultToolbar>
  ),
};

export function CanvasEditor({
  workspaceId,
  initialSnapshot,
}: {
  workspaceId: string;
  initialSnapshot: TLEditorSnapshot | null;
}) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setCanvasEditor } = useWorkspaceEditors();
  const { user } = useUser();

  // Gives other collaborators this user's real name/avatar on their cursor instead of "New User".
  // Memoized on primitives because useSync reconnects whenever the users object changes.
  const userId = user?.id;
  const userName = user?.fullName ?? user?.username ?? "Anonymous";
  const userImageUrl = user?.imageUrl ?? "";
  const users = useMemo(() => {
    if (!userId) return undefined;
    return {
      currentUser: atom(
        "currentUser",
        UserRecordType.create({
          id: createUserId(userId),
          name: userName,
          color: colorForUser(userId),
          imageUrl: userImageUrl,
        })
      ),
    };
  }, [userId, userName, userImageUrl]);

  // The editor's own identity (people menu, your own cursor) is separate from what gets synced —
  // pin its name/color to Clerk too, keeping every other preference from tldraw's local storage.
  const currentUser = useMemo(() => {
    if (!userId) return undefined;
    return createTLCurrentUser({
      userPreferences: computed("clerkUserPreferences", () => ({
        ...getUserPreferences(),
        id: userId,
        name: userName,
        color: colorForUser(userId),
      })),
    });
  }, [userId, userName]);

  // Uses tldraw's hosted demo sync server — fine for this tutorial, but rooms are public and
  // data gets wiped (Postgres autosave below re-seeds empty rooms). For production, deploy your
  // own server (tldraw's Cloudflare template) and swap this for useSync({ uri: "<your-server>" }).
  const store = useSyncDemo({ roomId: `outpost-${workspaceId}`, shapeUtils, users });

  const handleMount = (editor: Editor) => {
    setCanvasEditor(editor);
    // Seed from Postgres only when the room is empty, so a joining user doesn't overwrite
    // what others have already drawn.
    if (initialSnapshot && editor.getCurrentPageShapeIds().size === 0) {
      editor.loadSnapshot(initialSnapshot);
    }

    editor.store.listen(
      () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
          // getSnapshot() carries non-plain internals (schema is a class instance, not JSON) that
          // occasionally fail to cross the Server Action boundary as "opaque temporary reference"
          // errors — round-tripping through JSON strips those and leaves genuinely plain data.
          const plainSnapshot = JSON.parse(
            JSON.stringify(editor.getSnapshot())
          ) as Prisma.InputJsonValue;
          saveCanvasContent(workspaceId, plainSnapshot);
        }, SAVE_DEBOUNCE_MS);
      },
      { source: "user", scope: "document" }
    );

    // Arrows drawn onto an ERD table snap to the nearest row (see snapArrowToRow.ts).
    editor.store.listen(
      (entry) => {
        for (const record of Object.values(entry.changes.added)) {
          if (record.typeName === "binding" && record.type === "arrow") {
            snapArrowBindingToRow(editor, record);
          }
        }
      },
      { source: "user", scope: "all" }
    );

    // Clear it on unmount (e.g. switching to the Document view) so nothing keeps a disposed editor.
    return () => setCanvasEditor(null);
  };

  return (
    // isolate keeps tldraw's high z-index layers inside the canvas, so dialogs render above them.
    // The toolbar moves up into the space left by the hidden page menu (! beats tldraw.css).
    <div className="isolate h-full [&_.tlui-main-toolbar--vertical]:top-4!">
      <Tldraw
        store={store}
        user={currentUser}
        onMount={handleMount}
        components={components}
        colorScheme="dark"
        shapeUtils={shapeUtils}
        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
      />
    </div>
  );
}
