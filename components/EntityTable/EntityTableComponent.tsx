import { useState } from "react";
import { useEditor, useIsEditing } from "tldraw";
import { HEADER_HEIGHT, ROW_HEIGHT, getTableHeight, type EntityRow, type EntityTableShape } from "@/components/EntityTable/EntityTableShape";

export function EntityTableComponent({ shape }: { shape: EntityTableShape }) {
  const editor = useEditor();
  // tldraw's editing state is a signal, not a plain value — reading getEditingShapeId()
  // directly in the render body never triggers a re-render when it changes. useIsEditing
  // subscribes properly, so the component actually updates when edit mode toggles.
  const isEditing = useIsEditing(shape.id);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  // Never trust shape.props.h for rendering — it's a stored value that only updates via
  // onResize, so it goes stale the instant a row is added/removed without a resize happening.
  // Always recompute from the current row count, same as getGeometry() does.
  const height = getTableHeight(shape.props.rows.length);

  const updateShape = (patch: Partial<EntityTableShape["props"]>) => {
    editor.updateShape({ id: shape.id, type: "entity-table", props: patch });
  };

  const updateRow = (rowId: string, patch: Partial<EntityRow>) => {
    updateShape({
      rows: shape.props.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    });
  };

  const addRow = () => {
    const newRow: EntityRow = {
      // crypto.randomUUID(), not Date.now() — rapid clicks can land in the same millisecond and
      // produce duplicate ids, which makes updateRow's `.map()` match (and edit) every row
      // sharing that id at once.
      id: crypto.randomUUID(),
      name: "",
      dataType: "text",
      isPK: false,
      isFK: false,
    };
    const rows = [...shape.props.rows, newRow];
    updateShape({ rows, h: getTableHeight(rows.length) });
    // Drop straight into editing the new row instead of leaving a static "column" placeholder
    // the user has to notice and double-click on their own.
    setEditingRowId(newRow.id);
  };

  const removeRow = (rowId: string) => {
    const rows = shape.props.rows.filter((r) => r.id !== rowId);
    updateShape({ rows, h: getTableHeight(rows.length) });
  };

  return (
    // Not overflow-hidden on the outer element: `height` only covers the header+rows, so the
    // "+ Add row" button below needs to render outside that box instead of being clipped by it.
    // The rounded-corner clipping for the table itself moves to the inner div.
    <div
      // pointer-events must stay "auto" unconditionally — tldraw's arrow tool relies on pointer
      // hit-testing to detect hover-over-shape while dragging a connector, so gating this on
      // isEditing (as before) made the whole table invisible to the arrow tool outside of edit
      // mode, which is exactly when you'd normally be drawing relationship lines.
      style={{ width: shape.props.w, height, pointerEvents: "auto" }}
      className="relative text-left shadow-lg"
      // Only swallow the event (stop it reaching tldraw's canvas-level drag/select handlers)
      // while editing — otherwise selecting/dragging the shape itself still needs to work.
      onPointerDown={(e) => isEditing && e.stopPropagation()}
    >
      <div className="h-full overflow-hidden rounded-md border border-white/15 bg-card">
        <div
          style={{ height: HEADER_HEIGHT }}
          className="flex items-center bg-primary/15 px-2.5 text-sm font-semibold text-foreground"
        >
          {isEditing ? (
            <input
              value={shape.props.tableName}
              onChange={(e) => updateShape({ tableName: e.target.value })}
              className="w-full bg-transparent outline-none"
              autoFocus
            />
          ) : (
            shape.props.tableName
          )}
        </div>

        {shape.props.rows.map((row) => (
          <div
            key={row.id}
            style={{ height: ROW_HEIGHT }}
            className="flex items-center gap-1.5 border-t border-white/8 px-2.5 text-xs"
            onDoubleClick={() => isEditing && setEditingRowId(row.id)}
          >
            {!(isEditing && editingRowId === row.id) && row.isPK && (
              <span className="rounded bg-primary/20 px-1 text-[10px] font-medium text-primary">PK</span>
            )}
            {!(isEditing && editingRowId === row.id) && row.isFK && (
              <span className="rounded bg-accent px-1 text-[10px] font-medium text-accent-foreground">FK</span>
            )}

            {isEditing && editingRowId === row.id ? (
              <>
                <button
                  onClick={() => updateRow(row.id, { isPK: !row.isPK })}
                  title="Toggle primary key"
                  className={`rounded px-1 text-[10px] font-medium ${
                    row.isPK ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
                >
                  PK
                </button>
                <button
                  onClick={() => updateRow(row.id, { isFK: !row.isFK })}
                  title="Toggle foreign key"
                  className={`rounded px-1 text-[10px] font-medium ${
                    row.isFK ? "bg-accent text-accent-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
                >
                  FK
                </button>
                <input
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && setEditingRowId(null)}
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  placeholder="column_name"
                  autoFocus
                />
                <input
                  value={row.dataType}
                  onChange={(e) => updateRow(row.id, { dataType: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && setEditingRowId(null)}
                  className="w-24 shrink-0 bg-transparent text-right text-muted-foreground outline-none"
                  placeholder="type"
                />
                <button
                  onClick={() => setEditingRowId(null)}
                  title="Done editing row"
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✓
                </button>
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remove row"
                >
                  ×
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 truncate ${row.name ? "" : "italic text-muted-foreground/60"}`}>
                  {row.name || "unnamed column"}
                </span>
                <span className="text-muted-foreground">{row.dataType}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button
          onClick={addRow}
          className="absolute inset-x-0 top-full mt-1 rounded-md border border-white/15 bg-card py-1 text-xs text-muted-foreground shadow-lg hover:bg-white/5 hover:text-foreground"
        >
          + Add row
        </button>
      )}
    </div>
  );
}
