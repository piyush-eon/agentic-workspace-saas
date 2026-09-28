import { HTMLContainer, Rectangle2d, ShapeUtil, resizeBox, type TLResizeInfo } from "tldraw";
import { TABLE_WIDTH, entityTableProps, getTableHeight, type EntityTableShape } from "@/components/EntityTable/EntityTableShape";
import { EntityTableComponent } from "@/components/EntityTable/EntityTableComponent";

export class EntityTableShapeUtil extends ShapeUtil<EntityTableShape> {
  static override type = "entity-table" as const;
  static override props = entityTableProps;

  getDefaultProps(): EntityTableShape["props"] {
    return { w: TABLE_WIDTH, h: getTableHeight(0), tableName: "new_table", rows: [] };
  }

  getGeometry(shape: EntityTableShape) {
    return new Rectangle2d({ width: shape.props.w, height: getTableHeight(shape.props.rows.length), isFilled: true });
  }

  // Only width is resizable: height is clamped back to fit the rows (see getTableHeight).
  override canResize() {
    return true;
  }

  override onResize(shape: EntityTableShape, info: TLResizeInfo<EntityTableShape>) {
    const resized = resizeBox(shape, info, { minWidth: TABLE_WIDTH });
    return { ...resized, props: { ...resized.props, h: getTableHeight(shape.props.rows.length) } };
  }

  override canEdit() {
    return true;
  }

  // Lets arrows bind to the table; snapping them to a row happens in snapArrowToRow.ts.
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
