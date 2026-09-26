import { HTMLContainer, Rectangle2d, ShapeUtil, resizeBox, type TLResizeInfo } from "tldraw";
import {
  entityTableProps,
  getTableHeight,
  MIN_TABLE_WIDTH,
  DEFAULT_TABLE_WIDTH,
  type EntityTableShape,
} from "@/components/EntityTable/EntityTableShape";
import { EntityTableComponent } from "@/components/EntityTable/EntityTableComponent";

export class EntityTableShapeUtil extends ShapeUtil<EntityTableShape> {
  static override type = "entity-table" as const;
  static override props = entityTableProps;

  getDefaultProps(): EntityTableShape["props"] {
    return {
      w: DEFAULT_TABLE_WIDTH,
      h: getTableHeight(0),
      tableName: "new_table",
      rows: [],
    };
  }

  getGeometry(shape: EntityTableShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: getTableHeight(shape.props.rows.length),
      isFilled: true,
    });
  }

  // Only width is user-resizable — height always tracks row count (see getTableHeight), so any
  // resize is clamped back to the computed height rather than left independently draggable.
  override canResize() {
    return true;
  }

  override onResize(shape: EntityTableShape, info: TLResizeInfo<EntityTableShape>) {
    const resized = resizeBox(shape, info, { minWidth: MIN_TABLE_WIDTH });
    return { ...resized, props: { ...resized.props, h: getTableHeight(shape.props.rows.length) } };
  }

  override canEdit() {
    return true;
  }

  // Lets arrows bind to this shape (either as their start or end) so relationship lines can
  // attach to a table; row-level anchor snapping is handled separately in CanvasEditor.
  override canBind() {
    return true;
  }

  component(shape: EntityTableShape) {
    return (
      <HTMLContainer>
        <EntityTableComponent shape={shape} />
      </HTMLContainer>
    );
  }

  getIndicatorPath(shape: EntityTableShape) {
    const path = new Path2D();
    path.rect(0, 0, shape.props.w, getTableHeight(shape.props.rows.length));
    return path;
  }
}
