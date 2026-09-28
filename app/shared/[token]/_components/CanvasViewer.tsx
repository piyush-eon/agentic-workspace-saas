"use client";

import { Tldraw, type Editor, type TLEditorSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { EntityTableShapeUtil } from "@/components/EntityTable/EntityTableShapeUtil";

const shapeUtils = [EntityTableShapeUtil];

// Read-only canvas from the last saved snapshot in Postgres — used by the public shared link,
// so it never joins the live sync room.
export function CanvasViewer({ snapshot }: { snapshot: TLEditorSnapshot | null }) {
  const handleMount = (editor: Editor) => {
    editor.updateInstanceState({ isReadonly: true });
    editor.zoomToFit();
  };

  // isolate keeps tldraw's high z-index layers inside the canvas (see CanvasEditor).
  return (
    <div className="isolate h-full">
      <Tldraw
        snapshot={snapshot ?? undefined}
        shapeUtils={shapeUtils}
        onMount={handleMount}
        colorScheme="dark"
        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
      />
    </div>
  );
}
