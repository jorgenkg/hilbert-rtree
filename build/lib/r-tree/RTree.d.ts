import { RTreeRectangle } from "./RTreeRectangle.js";
import type { BoundingBox } from "../@types/BoundingBox.js";
import type { DataPoint } from "../@types/DataPoint.js";
export declare class RTree {
    root?: RTreeRectangle;
    private maxChildrenPerNode;
    constructor({ maxChildrenPerNode }?: {
        maxChildrenPerNode?: number;
    });
    private recursiveSearchForOverlappingNodes;
    search(searchBoundary: BoundingBox): Array<any>;
    insert(dataPoint: DataPoint): void;
    /**
     * Group a list of rectangles by parents according to their coordinate position instead
     * of optimizing parent rectangle area.
     * @param rectangles  List of child nodes that shall be grouped to parent nodes.
     *                    Each parent will contain at most `maxChildrenPerNode` children.
     * @returns           Returns the `rectangles` grouped by parent nodes
     */
    private constructTreeLevelsRecursively;
    batchInsert(data: Array<DataPoint>): void;
    /** Move `leaf` if the node's parent contains more than `maxChildrenPerNode` children. */
    private balanceTreePath;
    printTree(node?: RTreeRectangle, level?: number): void;
}
//# sourceMappingURL=RTree.d.ts.map