import { useState } from "react";
import { useEditor, useIsEditing } from "tldraw";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  getTableHeight,
  newRow,
  type EntityRow,
  type EntityTableShape,
} from "@/components/EntityTable/EntityTableShape";

export function EntityTableComponent({ shape }: { shape: EntityTableShape }) {
  const editor = useEditor();
  // Editing state is a tldraw signal; useIsEditing subscribes to it so this re-renders on change.
  const isEditing = useIsEditing(shape.id);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const { rows, tableName, w } = shape.props;
  // Computed from the rows, not props.h, which only updates on resize and can be stale.
  const height = getTableHeight(rows.length);

  const updateShape = (props: Partial<EntityTableShape["props"]>) =>
    editor.updateShape({ id: shape.id, type: "entity-table", props });
  const setRows = (next: EntityRow[]) => updateShape({ rows: next, h: getTableHeight(next.length) });
  const updateRow = (rowId: string, patch: Partial<EntityRow>) =>
    setRows(rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  const addRow = () => {
    const row = newRow();
    setRows([...rows, row]);
    // Start editing the new row right away.
    setEditingRowId(row.id);
  };

  return (
    // No overflow-hidden here, so "+ Add row" can render below the table; the inner div clips instead.
    <div
      // pointer-events always on: the arrow tool needs to hit-test the table to bind to it.
      style={{ width: w, height, pointerEvents: "auto" }}
      className="relative text-left shadow-lg"
      // Only swallow events while editing, so the shape can still be selected and dragged.
      onPointerDown={(e) => isEditing && e.stopPropagation()}
    >
      <div className="h-full overflow-hidden rounded-md border border-white/15 bg-card">
        <div
          style={{ height: HEADER_HEIGHT }}
          className="flex items-center bg-primary/15 px-2.5 text-sm font-semibold text-foreground"
        >
          {isEditing ? (
            <input
              value={tableName}
              onChange={(e) => updateShape({ tableName: e.target.value })}
              className="w-full bg-transparent outline-none"
              autoFocus
            />
          ) : (
            tableName
          )}
        </div>

        {rows.map((row) => {
          const isEditingRow = isEditing && editingRowId === row.id;
          const doneOnEnter = (e: React.KeyboardEvent) => e.key === "Enter" && setEditingRowId(null);
          return (
            <div
              key={row.id}
              style={{ height: ROW_HEIGHT }}
              className="flex items-center gap-1.5 border-t border-white/8 px-2.5 text-xs"
              onDoubleClick={() => isEditing && setEditingRowId(row.id)}
            >
              <KeyBadge label="PK" on={row.isPK} editing={isEditingRow} onToggle={() => updateRow(row.id, { isPK: !row.isPK })} />
              <KeyBadge label="FK" on={row.isFK} editing={isEditingRow} onToggle={() => updateRow(row.id, { isFK: !row.isFK })} />

              {isEditingRow ? (
                <>
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    onKeyDown={doneOnEnter}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    placeholder="column_name"
                    autoFocus
                  />
                  <input
                    value={row.dataType}
                    onChange={(e) => updateRow(row.id, { dataType: e.target.value })}
                    onKeyDown={doneOnEnter}
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
                    onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                    title="Remove row"
                    className="text-muted-foreground hover:text-destructive"
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
          );
        })}
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

// PK/FK tag: shown only when set, and a toggle button while its row is being edited.
function KeyBadge({ label, on, editing, onToggle }: { label: "PK" | "FK"; on: boolean; editing: boolean; onToggle: () => void }) {
  const color = label === "PK" ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground";
  if (!editing) return on ? <span className={`rounded px-1 text-[10px] font-medium ${color}`}>{label}</span> : null;
  return (
    <button
      onClick={onToggle}
      title={label === "PK" ? "Toggle primary key" : "Toggle foreign key"}
      className={`rounded px-1 text-[10px] font-medium ${on ? color : "text-muted-foreground/40 hover:text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}
