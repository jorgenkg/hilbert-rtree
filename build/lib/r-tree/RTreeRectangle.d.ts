import { Rectangle } from "./Rectangle.js";
import type { DataPoint } from "../@types/DataPoint.js";
export declare class RTreeRectangle<T = any> extends Rectangle {
    children: Array<RTreeRectangle>;
    parent?: RTreeRectangle;
    data?: T;
    constructor({ data, ...boundingBox }: DataPoint<T>);
    isLeafNode(): boolean;
    hasLeafNodes(): boolean;
    insertChildren(rectangles: Array<RTreeRectangle>): void;
    setParent(node: RTreeRectangle): void;
    unsetParent(): void;
    removeChild(child: RTreeRectangle): void;
    removeChildren(): void;
    getSubtreeData(): Array<any>;
}
//# sourceMappingURL=RTreeRectangle.d.ts.map