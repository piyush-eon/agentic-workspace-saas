import { type Editor, type TLArrowBinding } from "tldraw";
import { getTableHeight, HEADER_HEIGHT, ROW_HEIGHT } from "@/components/EntityTable/EntityTableShape";
import type { EntityTableShape } from "@/components/EntityTable/EntityTableShape";

interface RowHit {
  table: EntityTableShape;
  rowIndex: number;
}

// Maps a binding's normalizedAnchor.y back to the row it's nearest to.
function getRowHit(binding: TLArrowBinding, editor: Editor): RowHit | null {
  const target = editor.getShape(binding.toId);
  if (!target || target.type !== "entity-table") return null;

  const table = target as EntityTableShape;
  const rowCount = table.props.rows.length;
  if (rowCount === 0) return null;

  const totalHeight = getTableHeight(rowCount);
  const rawY = binding.props.normalizedAnchor.y * totalHeight;
  const rowAreaY = Math.max(0, Math.min(rawY - HEADER_HEIGHT, rowCount * ROW_HEIGHT));
  const rowIndex = Math.min(rowCount - 1, Math.floor(rowAreaY / ROW_HEIGHT));
  return { table, rowIndex };
}

// Rounds a freshly-created arrow binding's normalizedAnchor to the vertical center of the
// nearest row on the entity-table it's attached to. tldraw's own ArrowBindingUtil re-projects
// this fraction whenever the target's geometry changes, so once snapped, the anchor stays
// pinned to that row even as the table gains/loses rows and resizes.
export function snapArrowBindingToRow(editor: Editor, binding: TLArrowBinding) {
  const hit = getRowHit(binding, editor);
  if (!hit) return;

  const totalHeight = getTableHeight(hit.table.props.rows.length);
  const snappedY = HEADER_HEIGHT + hit.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

  editor.updateBinding({
    id: binding.id,
    type: "arrow",
    props: {
      ...binding.props,
      normalizedAnchor: { x: binding.props.normalizedAnchor.x, y: snappedY / totalHeight },
      isPrecise: true,
    },
  });
}
