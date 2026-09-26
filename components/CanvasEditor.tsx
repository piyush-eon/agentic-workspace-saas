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
import { useCanvasEditorContext } from "@/components/CanvasEditorContext";
import { colorForUser } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1000;

const shapeUtils = [EntityTableShapeUtil];

// Hides tldraw's default style panel (color/fill/dash/size), page menu, and main menu for a
// cleaner, Eraser-style UI — none of these matter for the live-agent-drawing demo this surface
// is built around, and a single-page canvas doesn't need a page switcher. Toolbar switches to
// a vertical rail (left side) instead of the default horizontal bottom-center bar, with an
// extra button appended for creating ERD entity tables.
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
  const { setEditor } = useCanvasEditorContext();
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
    setEditor(editor);
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

    // Snap freshly-created arrow bindings against entity tables to the nearest row's vertical
    // center — see snapArrowToRow.ts for why no custom BindingUtil is needed for this.
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
  };

  return (
    <div className="h-full [&_.tlui-main-toolbar--vertical]:top-4!">
      {/* tldraw's default vertical-toolbar top offset (90px) reserves space for the page menu +
          "back to content" button, both of which we hide — pull it up to match. !important is
          needed here since tldraw.css loads after globals.css in the bundle (imported inside
          this component, not the root layout), so it otherwise wins on equal specificity. */}
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
