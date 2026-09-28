import { useEditor, createShapeId } from "tldraw";
import { TABLE_WIDTH, getTableHeight, newRow } from "@/components/EntityTable/EntityTableShape";

// One-click create (no click-to-place tool): drops a starter table at the viewport center.
export function AddEntityTableButton() {
  const editor = useEditor();

  const handleClick = () => {
    const center = editor.getViewportPageBounds().center;
    const id = createShapeId();
    editor.createShape({
      id,
      type: "entity-table",
      x: center.x - TABLE_WIDTH / 2,
      y: center.y - getTableHeight(2) / 2,
      props: {
        tableName: "new_table",
        rows: [newRow({ name: "id", dataType: "uuid", isPK: true }), newRow({ name: "created_at", dataType: "timestamptz" })],
      },
    });
    editor.select(id);
  };

  return (
    <button
      onClick={handleClick}
      title="Add table"
      className="flex size-12 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="2" width="14" height="14" rx="1.5" />
        <line x1="2" y1="6.5" x2="16" y2="6.5" />
        <line x1="9" y1="6.5" x2="9" y2="16" />
      </svg>
    </button>
  );
}
