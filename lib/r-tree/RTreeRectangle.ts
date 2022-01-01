import { Rectangle } from "./Rectangle.js";
import type { Record } from "../@types/Record.js";

export class RTreeRectangle<T = any> extends Rectangle {
  // eslint-disable-next-line no-use-before-define
  public children: Array<RTreeRectangle> = [];
  // eslint-disable-next-line no-use-before-define
  public parent?: RTreeRectangle;

  public record?: Record<T>;

  constructor(record: Record<T>) {
    super(record);
    this.record = record;
  }

  public isLeafNode(): boolean {
    return this.children.length === 0;
  }

  public hasLeafNodes(): boolean {
    return this.isLeafNode() || this.children.some(node => node.isLeafNode());
  }

  public insertChildren(rectangles: Array<RTreeRectangle>): void {
    for (const rectangle of rectangles) {
      this.growRectangleToFit(rectangle);
      rectangle.setParent(this);
      this.children.push(rectangle);
    }
  }

  public setParent(node: RTreeRectangle) {
    this.parent = node;
  }

  public unsetParent() {
    this.parent = undefined;
  }

  public removeChild(child: RTreeRectangle): void {
    child.unsetParent();
    this.children.splice(this.children.indexOf(child), 1);
  }

  public removeChildren(): void {
    for(const child of this.children) {
      child.parent = undefined;
    }
    this.children.length = 0;
  }

  public getSubtreeData(): Array<Record> {
    return [
      ...(this.record?.data ? [this.record] : []),
      ...(this.children.length === 0 ? [] :
        this.children
          .map(node => node.getSubtreeData())
          .reduce((acc, curr) => acc.concat(curr), [])
      )
    ];
  }
}
