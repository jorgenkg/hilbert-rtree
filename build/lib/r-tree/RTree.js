"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTree = void 0;
const assert = require("assert");
const RTreeRectangle_js_1 = require("./RTreeRectangle.js");
const sortRectanglesByHilbertCoordinates_js_1 = require("../misc/sortRectanglesByHilbertCoordinates.js");
const splitIntoTwo_js_1 = require("../misc/splitIntoTwo.js");
class RTree {
    /**
     * @param options Options to adjust how the RTree shall be generated.
     */
    constructor({ maxChildrenPerNode = 4 } = {}) {
        this.maxChildrenPerNode = maxChildrenPerNode;
    }
    recursiveSearchForOverlappingNodes(searchBoundingBox, node) {
        if (node.containedBy(searchBoundingBox)) {
            // If the query rectangles encapsulates this node, any data points stored within the node
            // rectangle should be returned by the search.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return node.getSubtreeData();
        }
        else if (node.isLeafNode() && node.overlaps(searchBoundingBox)) {
            // If the query overlaps a leaf node, the leaf data shall be returned.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return node.getSubtreeData();
        }
        else {
            // Recursively search the rectangles intersected by the search query rectangle.
            return node.children
                .filter(n => n.overlaps(searchBoundingBox))
                .map(n => this.recursiveSearchForOverlappingNodes(searchBoundingBox, n))
                .reduce((acc, curr) => acc.concat(curr), []);
        }
    }
    /** Find data records that overlap with the bounding box.
     * @returns List of `Record["data"]` from overlapped Records. */
    search(searchBoundary) {
        assert(this.rootNode, "Expect tree to be created");
        assert(searchBoundary.x >= 0, "Expect X coordinate to be >= 0");
        assert(searchBoundary.y >= 0, "Expect Y coordinate to be >= 0");
        assert(searchBoundary.height >= 0, "Expect `height` to be >= 0");
        assert(searchBoundary.width >= 0, "Expect `width` to be >= 0");
        const searchRect = new RTreeRectangle_js_1.RTreeRectangle(searchBoundary);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this
            .recursiveSearchForOverlappingNodes(searchRect, this.rootNode)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            .map(node => node.data);
    }
    /** Insert a single record to the RTree and re-balance the tree if it violates `maxChildrenPerNode`.  */
    insert(record) {
        assert(record.x >= 0, "Expect X coordinate to be >= 0");
        assert(record.y >= 0, "Expect Y coordinate to be >= 0");
        "height" in record && assert(record.height >= 0, "Expect `height` to be >= 0 if defined");
        "width" in record && assert(record.width >= 0, "Expect `width` to be >= 0 if defined");
        // Rectangle representation of the data point to insert into the RTree
        const insertRect = new RTreeRectangle_js_1.RTreeRectangle(record);
        // Since the rootNode is not defined, this is the first node in the tree.
        if (!this.rootNode) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { data, ...boundingBox } = record;
            this.rootNode = new RTreeRectangle_js_1.RTreeRectangle(boundingBox);
        }
        // Walk the existing RTree from the rootNode to leaf nodes.
        const observedNodes = [this.rootNode];
        // If the currently observed node doesn't have leaf nodes, expand this (parent) node to
        // include the new node's geometry
        while (observedNodes.length) {
            const [currentNode] = observedNodes.splice(0, 1);
            // If the node isn't a leaf parent, iterate into the node's children
            if (currentNode.hasLeafNodes()) {
                // Insert the new rectangle in the identified leaf node
                currentNode.insertChildren([insertRect]);
            }
            else {
                // Grow the node's bounding rectangle
                currentNode.growRectangleToFit(insertRect);
                // Decide the subsequent node to expand. The node is decided by choosing the
                // bounding box that experience the least increase in area if chosen.
                observedNodes.push(currentNode.children
                    .map(node => ({ node, area: node.increaseInAreaIfGrownByRectangle(insertRect) }))
                    // Find node that results in the smallest rectangle
                    .reduce((accumulated, current) => current.area < accumulated.area ? current : accumulated)
                    .node);
            }
        }
        // Execute the balance routine
        this.balanceTreePath(insertRect);
    }
    /**
     * Group a list of rectangles by parents according to their coordinate position instead
     * of optimizing parent rectangle area.
     * @param rectangles  List of child nodes that shall be grouped to parent nodes.
     *                    Each parent will contain at most `maxChildrenPerNode` children.
     * @returns           Returns the `rectangles` grouped by parent nodes
     */
    constructTreeLevelsRecursively(rectangles) {
        // Create a copy of `rectangles` to modify without causing side-effects
        const rectCopy = [].concat(rectangles);
        const parentCount = Math.ceil(rectangles.length / this.maxChildrenPerNode);
        const parents = new Array(parentCount).fill(0)
            .map(() => {
            const children = rectCopy.splice(0, this.maxChildrenPerNode);
            const parent = new RTreeRectangle_js_1.RTreeRectangle({
                width: children[0].width,
                height: children[0].height,
                x: children[0].x,
                y: children[0].y,
            });
            parent.insertChildren(children);
            return parent;
        });
        // Continue to group the nodes recursively until the set of parents only
        // contain a single node, which then becomes the tree rootNode.
        if (parents.length > 1) {
            return this.constructTreeLevelsRecursively(parents);
        }
        else {
            return parents;
        }
    }
    /** Create a new R-Tree by inserting multiple records at once. This method uses a Hilbert curve
     * to pack the tree.
     *
     * This method may only be applied when creating a new R-Tree. Subsequent additions to the tree must use `insert()`.*/
    batchInsert(
    /** List of data records to insert in a R-tree structure. */
    records) {
        assert(this.rootNode === undefined, "Expect tree to be empty before batch inserting nodes");
        for (const record of records) {
            assert(record.x >= 0, "Expect X coordinate to be >= 0");
            assert(record.y >= 0, "Expect Y coordinate to be >= 0");
            "height" in record && assert(record.height >= 0, "Expect `height` to be >= 0 if defined");
            "width" in record && assert(record.width >= 0, "Expect `width` to be >= 0 if defined");
        }
        const rectangles = records
            .map(record => new RTreeRectangle_js_1.RTreeRectangle(record));
        [this.rootNode] = this.constructTreeLevelsRecursively((0, sortRectanglesByHilbertCoordinates_js_1.sortRectanglesByHilbertCoordinates)(rectangles));
    }
    /** Move `leaf` if the node's parent contains more than `maxChildrenPerNode` children. */
    balanceTreePath(leaf) {
        assert(leaf.isLeafNode(), "Expect the provided node to be a leaf node");
        const observedNodes = [leaf.parent];
        // Traverse the ancestor path if the leaf node if the next parent node has too many children.
        while (observedNodes.length) {
            // Remove FIFO node from observed nodes
            const [currentNode] = observedNodes.splice(0, 1);
            if (currentNode.children.length > this.maxChildrenPerNode) {
                // If the current node is an internal tree node, split the node into two siblings with equal number of children
                if (currentNode.parent) {
                    const parent = currentNode.parent;
                    parent
                        .insertChildren((0, splitIntoTwo_js_1.splitIntoTwo)(currentNode.children));
                    parent.removeChild(currentNode);
                    // If this node's parent has too many children, add it to the list of observed nodes
                    if (parent.children.length > this.maxChildrenPerNode) {
                        observedNodes.push(parent);
                    }
                }
                else {
                    // Split the children of the rootNode node (implies adding another tree level), and add these newly
                    // generated children to the rootNode node again.
                    const existingChildren = [].concat(currentNode.children);
                    currentNode.removeChildren();
                    // Add a new tree level consisting of a partitioned set of children
                    currentNode
                        .insertChildren((0, splitIntoTwo_js_1.splitIntoTwo)(existingChildren));
                }
            }
        }
    }
}
exports.RTree = RTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUlRyZWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvci10cmVlL1JUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFpQztBQUNqQywyREFBcUQ7QUFDckQseUdBQW1HO0FBQ25HLDZEQUF1RDtBQUt2RCxNQUFhLEtBQUs7SUFJaEI7O09BRUc7SUFDSCxZQUFZLEVBQUUsa0JBQWtCLEdBQUcsQ0FBQyxLQUdoQyxFQUFFO1FBQ0osSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0lBQy9DLENBQUM7SUFFTyxrQ0FBa0MsQ0FBQyxpQkFBOEIsRUFBRSxJQUFvQjtRQUM3RixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUN2Qyx5RkFBeUY7WUFDekYsOENBQThDO1lBQzlDLCtEQUErRDtZQUMvRCxPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUM5QjthQUNJLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUM5RCxzRUFBc0U7WUFDdEUsK0RBQStEO1lBQy9ELE9BQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQzlCO2FBQ0k7WUFDSCwrRUFBK0U7WUFDL0UsT0FBTyxJQUFJLENBQUMsUUFBUTtpQkFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2lCQUMxQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FD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QUE2RjtRQUM3RixPQUFPLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDM0IsdUNBQXVDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQXFCLENBQUM7WUFFckUsSUFBRyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3hELCtHQUErRztnQkFDL0csSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO29CQUN0QixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO29CQUVsQyxNQUFNO3lCQUNILGNBQWMsQ0FDYixJQUFBLDhCQUFZLEVBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUNuQyxDQUFDO29CQUVKLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRWhDLG9GQUFvRjtvQkFDcEYsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7d0JBQ3BELGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQzVCO2lCQUNGO3FCQUNJO29CQUNILG1HQUFtRztvQkFDbkcsaURBQWlEO29CQUNqRCxNQUFNLGdCQUFnQixHQUFJLEVBQXFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFFN0YsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUU3QixtRUFBbUU7b0JBQ25FLFdBQVc7eUJBQ1IsY0FBYyxDQUNiLElBQUEsOEJBQVksRUFBQyxnQkFBZ0IsQ0FBQyxDQUMvQixDQUFDO2lCQUNMO2FBQ0Y7U0FFRjtJQUNILENBQUM7Q0FDRjtBQS9NRCxzQkErTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgUlRyZWVSZWN0YW5nbGUgfSBmcm9tIFwiLi9SVHJlZVJlY3RhbmdsZS5qc1wiO1xuaW1wb3J0IHsgc29ydFJlY3RhbmdsZXNCeUhpbGJlcnRDb29yZGluYXRlcyB9IGZyb20gXCIuLi9taXNjL3NvcnRSZWN0YW5nbGVzQnlIaWxiZXJ0Q29vcmRpbmF0ZXMuanNcIjtcbmltcG9ydCB7IHNwbGl0SW50b1R3byB9IGZyb20gXCIuLi9taXNjL3NwbGl0SW50b1R3by5qc1wiO1xuaW1wb3J0IHR5cGUgeyBCb3VuZGluZ0JveCB9IGZyb20gXCIuLi9AdHlwZXMvQm91bmRpbmdCb3guanNcIjtcbmltcG9ydCB0eXBlIHsgUmVjb3JkIH0gZnJvbSBcIi4uL0B0eXBlcy9SZWNvcmQuanNcIjtcblxuXG5leHBvcnQgY2xhc3MgUlRyZWUge1xuICBwcml2YXRlIHJvb3ROb2RlPzogUlRyZWVSZWN0YW5nbGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWF4Q2hpbGRyZW5QZXJOb2RlOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdG8gYWRqdXN0IGhvdyB0aGUgUlRyZWUgc2hhbGwgYmUgZ2VuZXJhdGVkLlxuICAgKi9cbiAgY29uc3RydWN0b3IoeyBtYXhDaGlsZHJlblBlck5vZGUgPSA0IH06IHtcbiAgICAvKiogVGhlIHRyZWUgd2lsbCBzcGxpdCB1cCBub2RlcyB3aXRoIG1vcmUgdGhhbiBgbWF4Q2hpbGRyZW5QZXJOb2RlYCBudW1iZXIgb2YgY2hpbGRyZW4uICAqL1xuICAgIG1heENoaWxkcmVuUGVyTm9kZT86IG51bWJlclxuICB9ID0ge30pIHtcbiAgICB0aGlzLm1heENoaWxkcmVuUGVyTm9kZSA9IG1heENoaWxkcmVuUGVyTm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgcmVjdXJzaXZlU2VhcmNoRm9yT3ZlcmxhcHBpbmdOb2RlcyhzZWFyY2hCb3VuZGluZ0JveDogQm91bmRpbmdCb3gsIG5vZGU6IFJUcmVlUmVjdGFuZ2xlKTogQXJyYXk8UmVjb3JkPiB7XG4gICAgaWYgKG5vZGUuY29udGFpbmVkQnkoc2VhcmNoQm91bmRpbmdCb3gpKSB7XG4gICAgICAvLyBJZiB0aGUgcXVlcnkgcmVjdGFuZ2xlcyBlbmNhcHN1bGF0ZXMgdGhpcyBub2RlLCBhbnkgZGF0YSBwb2ludHMgc3RvcmVkIHdpdGhpbiB0aGUgbm9kZVxuICAgICAgLy8gcmVjdGFuZ2xlIHNob3VsZCBiZSByZXR1cm5lZCBieSB0aGUgc2VhcmNoLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtcmV0dXJuXG4gICAgICByZXR1cm4gbm9kZS5nZXRTdWJ0cmVlRGF0YSgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChub2RlLmlzTGVhZk5vZGUoKSAmJiBub2RlLm92ZXJsYXBzKHNlYXJjaEJvdW5kaW5nQm94KSkge1xuICAgICAgLy8gSWYgdGhlIHF1ZXJ5IG92ZXJsYXBzIGEgbGVhZiBub2RlLCB0aGUgbGVhZiBkYXRhIHNoYWxsIGJlIHJldHVybmVkLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtcmV0dXJuXG4gICAgICByZXR1cm4gbm9kZS5nZXRTdWJ0cmVlRGF0YSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlYXJjaCB0aGUgcmVjdGFuZ2xlcyBpbnRlcnNlY3RlZCBieSB0aGUgc2VhcmNoIHF1ZXJ5IHJlY3RhbmdsZS5cbiAgICAgIHJldHVybiBub2RlLmNoaWxkcmVuXG4gICAgICAgIC5maWx0ZXIobiA9PiBuLm92ZXJsYXBzKHNlYXJjaEJvdW5kaW5nQm94KSlcbiAgICAgICAgLm1hcChuID0+IHRoaXMucmVjdXJzaXZlU2VhcmNoRm9yT3ZlcmxhcHBpbmdOb2RlcyhzZWFyY2hCb3VuZGluZ0JveCwgbikpXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBGaW5kIGRhdGEgcmVjb3JkcyB0aGF0IG92ZXJsYXAgd2l0aCB0aGUgYm91bmRpbmcgYm94LlxuICAgKiBAcmV0dXJucyBMaXN0IG9mIGBSZWNvcmRbXCJkYXRhXCJdYCBmcm9tIG92ZXJsYXBwZWQgUmVjb3Jkcy4gKi9cbiAgcHVibGljIHNlYXJjaChzZWFyY2hCb3VuZGFyeTogQm91bmRpbmdCb3gpIHtcbiAgICBhc3NlcnQodGhpcy5yb290Tm9kZSwgXCJFeHBlY3QgdHJlZSB0byBiZSBjcmVhdGVkXCIpO1xuICAgIGFzc2VydChzZWFyY2hCb3VuZGFyeS54ID49IDAsIFwiRXhwZWN0IFggY29vcmRpbmF0ZSB0byBiZSA+PSAwXCIpO1xuICAgIGFzc2VydChzZWFyY2hCb3VuZGFyeS55ID49IDAsIFwiRXhwZWN0IFkgY29vcmRpbmF0ZSB0byBiZSA+PSAwXCIpO1xuICAgIGFzc2VydChzZWFyY2hCb3VuZGFyeS5oZWlnaHQgPj0gMCwgXCJFeHBlY3QgYGhlaWdodGAgdG8gYmUgPj0gMFwiKTtcbiAgICBhc3NlcnQoc2VhcmNoQm91bmRhcnkud2lkdGggPj0gMCwgXCJFeHBlY3QgYHdpZHRoYCB0byBiZSA+PSAwXCIpO1xuXG4gICAgY29uc3Qgc2VhcmNoUmVjdCA9IG5ldyBSVHJlZVJlY3RhbmdsZShzZWFyY2hCb3VuZGFyeSk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtcmV0dXJuXG4gICAgcmV0dXJuIHRoaXNcbiAgICAgIC5yZWN1cnNpdmVTZWFyY2hGb3JPdmVybGFwcGluZ05vZGVzKHNlYXJjaFJlY3QsIHRoaXMucm9vdE5vZGUpXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVuc2FmZS1yZXR1cm5cbiAgICAgIC5tYXAobm9kZSA9PiBub2RlLmRhdGEpO1xuICB9XG5cbiAgLyoqIEluc2VydCBhIHNpbmdsZSByZWNvcmQgdG8gdGhlIFJUcmVlIGFuZCByZS1iYWxhbmNlIHRoZSB0cmVlIGlmIGl0IHZpb2xhdGVzIGBtYXhDaGlsZHJlblBlck5vZGVgLiAgKi9cbiAgcHVibGljIGluc2VydChyZWNvcmQ6IFJlY29yZCk6IHZvaWQge1xuICAgIGFzc2VydChyZWNvcmQueCA+PSAwLCBcIkV4cGVjdCBYIGNvb3JkaW5hdGUgdG8gYmUgPj0gMFwiKTtcbiAgICBhc3NlcnQocmVjb3JkLnkgPj0gMCwgXCJFeHBlY3QgWSBjb29yZGluYXRlIHRvIGJlID49IDBcIik7XG4gICAgXCJoZWlnaHRcIiBpbiByZWNvcmQgJiYgYXNzZXJ0KHJlY29yZC5oZWlnaHQgPj0gMCwgXCJFeHBlY3QgYGhlaWdodGAgdG8gYmUgPj0gMCBpZiBkZWZpbmVkXCIpO1xuICAgIFwid2lkdGhcIiBpbiByZWNvcmQgJiYgYXNzZXJ0KHJlY29yZC53aWR0aCA+PSAwLCBcIkV4cGVjdCBgd2lkdGhgIHRvIGJlID49IDAgaWYgZGVmaW5lZFwiKTtcblxuICAgIC8vIFJlY3RhbmdsZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGF0YSBwb2ludCB0byBpbnNlcnQgaW50byB0aGUgUlRyZWVcbiAgICBjb25zdCBpbnNlcnRSZWN0ID0gbmV3IFJUcmVlUmVjdGFuZ2xlKHJlY29yZCk7XG5cbiAgICAvLyBTaW5jZSB0aGUgcm9vdE5vZGUgaXMgbm90IGRlZmluZWQsIHRoaXMgaXMgdGhlIGZpcnN0IG5vZGUgaW4gdGhlIHRyZWUuXG4gICAgaWYoIXRoaXMucm9vdE5vZGUpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFzc2lnbm1lbnRcbiAgICAgIGNvbnN0IHsgZGF0YSwgLi4uYm91bmRpbmdCb3ggfSA9IHJlY29yZDtcbiAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgUlRyZWVSZWN0YW5nbGUoYm91bmRpbmdCb3gpO1xuICAgIH1cblxuICAgIC8vIFdhbGsgdGhlIGV4aXN0aW5nIFJUcmVlIGZyb20gdGhlIHJvb3ROb2RlIHRvIGxlYWYgbm9kZXMuXG4gICAgY29uc3Qgb2JzZXJ2ZWROb2RlcyA9IFt0aGlzLnJvb3ROb2RlXTtcblxuICAgIC8vIElmIHRoZSBjdXJyZW50bHkgb2JzZXJ2ZWQgbm9kZSBkb2Vzbid0IGhhdmUgbGVhZiBub2RlcywgZXhwYW5kIHRoaXMgKHBhcmVudCkgbm9kZSB0b1xuICAgIC8vIGluY2x1ZGUgdGhlIG5ldyBub2RlJ3MgZ2VvbWV0cnlcbiAgICB3aGlsZSAob2JzZXJ2ZWROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IFtjdXJyZW50Tm9kZV0gPSBvYnNlcnZlZE5vZGVzLnNwbGljZSgwLCAxKSBhcyBbUlRyZWVSZWN0YW5nbGVdO1xuXG4gICAgICAvLyBJZiB0aGUgbm9kZSBpc24ndCBhIGxlYWYgcGFyZW50LCBpdGVyYXRlIGludG8gdGhlIG5vZGUncyBjaGlsZHJlblxuICAgICAgaWYgKGN1cnJlbnROb2RlLmhhc0xlYWZOb2RlcygpKSB7XG4gICAgICAgIC8vIEluc2VydCB0aGUgbmV3IHJlY3RhbmdsZSBpbiB0aGUgaWRlbnRpZmllZCBsZWFmIG5vZGVcbiAgICAgICAgY3VycmVudE5vZGUuaW5zZXJ0Q2hpbGRyZW4oW2luc2VydFJlY3RdKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBHcm93IHRoZSBub2RlJ3MgYm91bmRpbmcgcmVjdGFuZ2xlXG4gICAgICAgIGN1cnJlbnROb2RlLmdyb3dSZWN0YW5nbGVUb0ZpdChpbnNlcnRSZWN0KTtcblxuICAgICAgICAvLyBEZWNpZGUgdGhlIHN1YnNlcXVlbnQgbm9kZSB0byBleHBhbmQuIFRoZSBub2RlIGlzIGRlY2lkZWQgYnkgY2hvb3NpbmcgdGhlXG4gICAgICAgIC8vIGJvdW5kaW5nIGJveCB0aGF0IGV4cGVyaWVuY2UgdGhlIGxlYXN0IGluY3JlYXNlIGluIGFyZWEgaWYgY2hvc2VuLlxuICAgICAgICBvYnNlcnZlZE5vZGVzLnB1c2goXG4gICAgICAgICAgY3VycmVudE5vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgIC5tYXAobm9kZSA9PiAoeyBub2RlLCBhcmVhOiBub2RlLmluY3JlYXNlSW5BcmVhSWZHcm93bkJ5UmVjdGFuZ2xlKGluc2VydFJlY3QpIH0pKVxuICAgICAgICAgICAgLy8gRmluZCBub2RlIHRoYXQgcmVzdWx0cyBpbiB0aGUgc21hbGxlc3QgcmVjdGFuZ2xlXG4gICAgICAgICAgICAucmVkdWNlKChhY2N1bXVsYXRlZCwgY3VycmVudCkgPT4gY3VycmVudC5hcmVhIDwgYWNjdW11bGF0ZWQuYXJlYSA/IGN1cnJlbnQgOiBhY2N1bXVsYXRlZClcbiAgICAgICAgICAgIC5ub2RlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSB0aGUgYmFsYW5jZSByb3V0aW5lXG4gICAgdGhpcy5iYWxhbmNlVHJlZVBhdGgoaW5zZXJ0UmVjdCk7XG4gIH1cblxuICAvKipcbiAgICogR3JvdXAgYSBsaXN0IG9mIHJlY3RhbmdsZXMgYnkgcGFyZW50cyBhY2NvcmRpbmcgdG8gdGhlaXIgY29vcmRpbmF0ZSBwb3NpdGlvbiBpbnN0ZWFkXG4gICAqIG9mIG9wdGltaXppbmcgcGFyZW50IHJlY3RhbmdsZSBhcmVhLlxuICAgKiBAcGFyYW0gcmVjdGFuZ2xlcyAgTGlzdCBvZiBjaGlsZCBub2RlcyB0aGF0IHNoYWxsIGJlIGdyb3VwZWQgdG8gcGFyZW50IG5vZGVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgRWFjaCBwYXJlbnQgd2lsbCBjb250YWluIGF0IG1vc3QgYG1heENoaWxkcmVuUGVyTm9kZWAgY2hpbGRyZW4uXG4gICAqIEByZXR1cm5zICAgICAgICAgICBSZXR1cm5zIHRoZSBgcmVjdGFuZ2xlc2AgZ3JvdXBlZCBieSBwYXJlbnQgbm9kZXNcbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0VHJlZUxldmVsc1JlY3Vyc2l2ZWx5KHJlY3RhbmdsZXM6IEFycmF5PFJUcmVlUmVjdGFuZ2xlPik6IEFycmF5PFJUcmVlUmVjdGFuZ2xlPiB7XG4gICAgLy8gQ3JlYXRlIGEgY29weSBvZiBgcmVjdGFuZ2xlc2AgdG8gbW9kaWZ5IHdpdGhvdXQgY2F1c2luZyBzaWRlLWVmZmVjdHNcbiAgICBjb25zdCByZWN0Q29weSA9IChbXSBhcyB0eXBlb2YgcmVjdGFuZ2xlcykuY29uY2F0KHJlY3RhbmdsZXMpO1xuICAgIGNvbnN0IHBhcmVudENvdW50ID0gTWF0aC5jZWlsKHJlY3RhbmdsZXMubGVuZ3RoIC8gdGhpcy5tYXhDaGlsZHJlblBlck5vZGUpO1xuXG4gICAgY29uc3QgcGFyZW50cyA9IG5ldyBBcnJheShwYXJlbnRDb3VudCkuZmlsbCgwKVxuICAgICAgLm1hcCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gcmVjdENvcHkuc3BsaWNlKDAsIHRoaXMubWF4Q2hpbGRyZW5QZXJOb2RlKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gbmV3IFJUcmVlUmVjdGFuZ2xlKHtcbiAgICAgICAgICB3aWR0aDogY2hpbGRyZW5bMF0ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBjaGlsZHJlblswXS5oZWlnaHQsXG4gICAgICAgICAgeDogY2hpbGRyZW5bMF0ueCxcbiAgICAgICAgICB5OiBjaGlsZHJlblswXS55LFxuICAgICAgICB9KTtcbiAgICAgICAgcGFyZW50Lmluc2VydENoaWxkcmVuKGNoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICAgIH0pO1xuXG4gICAgLy8gQ29udGludWUgdG8gZ3JvdXAgdGhlIG5vZGVzIHJlY3Vyc2l2ZWx5IHVudGlsIHRoZSBzZXQgb2YgcGFyZW50cyBvbmx5XG4gICAgLy8gY29udGFpbiBhIHNpbmdsZSBub2RlLCB3aGljaCB0aGVuIGJlY29tZXMgdGhlIHRyZWUgcm9vdE5vZGUuXG4gICAgaWYgKHBhcmVudHMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0VHJlZUxldmVsc1JlY3Vyc2l2ZWx5KHBhcmVudHMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJlbnRzO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgUi1UcmVlIGJ5IGluc2VydGluZyBtdWx0aXBsZSByZWNvcmRzIGF0IG9uY2UuIFRoaXMgbWV0aG9kIHVzZXMgYSBIaWxiZXJ0IGN1cnZlXG4gICAqIHRvIHBhY2sgdGhlIHRyZWUuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIG1heSBvbmx5IGJlIGFwcGxpZWQgd2hlbiBjcmVhdGluZyBhIG5ldyBSLVRyZWUuIFN1YnNlcXVlbnQgYWRkaXRpb25zIHRvIHRoZSB0cmVlIG11c3QgdXNlIGBpbnNlcnQoKWAuKi9cbiAgcHVibGljIGJhdGNoSW5zZXJ0KFxuICAgIC8qKiBMaXN0IG9mIGRhdGEgcmVjb3JkcyB0byBpbnNlcnQgaW4gYSBSLXRyZWUgc3RydWN0dXJlLiAqL1xuICAgIHJlY29yZHM6IEFycmF5PFJlY29yZD5cbiAgKSB7XG4gICAgYXNzZXJ0KHRoaXMucm9vdE5vZGUgPT09IHVuZGVmaW5lZCwgXCJFeHBlY3QgdHJlZSB0byBiZSBlbXB0eSBiZWZvcmUgYmF0Y2ggaW5zZXJ0aW5nIG5vZGVzXCIpO1xuXG4gICAgZm9yKGNvbnN0IHJlY29yZCBvZiByZWNvcmRzKSB7XG4gICAgICBhc3NlcnQocmVjb3JkLnggPj0gMCwgXCJFeHBlY3QgWCBjb29yZGluYXRlIHRvIGJlID49IDBcIik7XG4gICAgICBhc3NlcnQocmVjb3JkLnkgPj0gMCwgXCJFeHBlY3QgWSBjb29yZGluYXRlIHRvIGJlID49IDBcIik7XG4gICAgICBcImhlaWdodFwiIGluIHJlY29yZCAmJiBhc3NlcnQocmVjb3JkLmhlaWdodCA+PSAwLCBcIkV4cGVjdCBgaGVpZ2h0YCB0byBiZSA+PSAwIGlmIGRlZmluZWRcIik7XG4gICAgICBcIndpZHRoXCIgaW4gcmVjb3JkICYmIGFzc2VydChyZWNvcmQud2lkdGggPj0gMCwgXCJFeHBlY3QgYHdpZHRoYCB0byBiZSA+PSAwIGlmIGRlZmluZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdGFuZ2xlcyA9IHJlY29yZHNcbiAgICAgIC5tYXAocmVjb3JkID0+IG5ldyBSVHJlZVJlY3RhbmdsZShyZWNvcmQpKTtcblxuICAgIFt0aGlzLnJvb3ROb2RlXSA9IHRoaXMuY29uc3RydWN0VHJlZUxldmVsc1JlY3Vyc2l2ZWx5KFxuICAgICAgc29ydFJlY3RhbmdsZXNCeUhpbGJlcnRDb29yZGluYXRlcyhyZWN0YW5nbGVzKVxuICAgICk7XG4gIH1cblxuICAvKiogTW92ZSBgbGVhZmAgaWYgdGhlIG5vZGUncyBwYXJlbnQgY29udGFpbnMgbW9yZSB0aGFuIGBtYXhDaGlsZHJlblBlck5vZGVgIGNoaWxkcmVuLiAqL1xuICBwcml2YXRlIGJhbGFuY2VUcmVlUGF0aChsZWFmOiBSVHJlZVJlY3RhbmdsZSk6IHZvaWQge1xuICAgIGFzc2VydChsZWFmLmlzTGVhZk5vZGUoKSwgXCJFeHBlY3QgdGhlIHByb3ZpZGVkIG5vZGUgdG8gYmUgYSBsZWFmIG5vZGVcIik7XG5cbiAgICBjb25zdCBvYnNlcnZlZE5vZGVzID0gW2xlYWYucGFyZW50XTtcblxuICAgIC8vIFRyYXZlcnNlIHRoZSBhbmNlc3RvciBwYXRoIGlmIHRoZSBsZWFmIG5vZGUgaWYgdGhlIG5leHQgcGFyZW50IG5vZGUgaGFzIHRvbyBtYW55IGNoaWxkcmVuLlxuICAgIHdoaWxlIChvYnNlcnZlZE5vZGVzLmxlbmd0aCkge1xuICAgICAgLy8gUmVtb3ZlIEZJRk8gbm9kZSBmcm9tIG9ic2VydmVkIG5vZGVzXG4gICAgICBjb25zdCBbY3VycmVudE5vZGVdID0gb2JzZXJ2ZWROb2Rlcy5zcGxpY2UoMCwgMSkgYXMgW1JUcmVlUmVjdGFuZ2xlXTtcblxuICAgICAgaWYoY3VycmVudE5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gdGhpcy5tYXhDaGlsZHJlblBlck5vZGUpIHtcbiAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbm9kZSBpcyBhbiBpbnRlcm5hbCB0cmVlIG5vZGUsIHNwbGl0IHRoZSBub2RlIGludG8gdHdvIHNpYmxpbmdzIHdpdGggZXF1YWwgbnVtYmVyIG9mIGNoaWxkcmVuXG4gICAgICAgIGlmIChjdXJyZW50Tm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnQgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG5cbiAgICAgICAgICBwYXJlbnRcbiAgICAgICAgICAgIC5pbnNlcnRDaGlsZHJlbihcbiAgICAgICAgICAgICAgc3BsaXRJbnRvVHdvKGN1cnJlbnROb2RlLmNoaWxkcmVuKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XG5cbiAgICAgICAgICAvLyBJZiB0aGlzIG5vZGUncyBwYXJlbnQgaGFzIHRvbyBtYW55IGNoaWxkcmVuLCBhZGQgaXQgdG8gdGhlIGxpc3Qgb2Ygb2JzZXJ2ZWQgbm9kZXNcbiAgICAgICAgICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMubWF4Q2hpbGRyZW5QZXJOb2RlKSB7XG4gICAgICAgICAgICBvYnNlcnZlZE5vZGVzLnB1c2gocGFyZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gU3BsaXQgdGhlIGNoaWxkcmVuIG9mIHRoZSByb290Tm9kZSBub2RlIChpbXBsaWVzIGFkZGluZyBhbm90aGVyIHRyZWUgbGV2ZWwpLCBhbmQgYWRkIHRoZXNlIG5ld2x5XG4gICAgICAgICAgLy8gZ2VuZXJhdGVkIGNoaWxkcmVuIHRvIHRoZSByb290Tm9kZSBub2RlIGFnYWluLlxuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ2hpbGRyZW4gPSAoW10gYXMgdHlwZW9mIGN1cnJlbnROb2RlW1wiY2hpbGRyZW5cIl0pLmNvbmNhdChjdXJyZW50Tm9kZS5jaGlsZHJlbik7XG5cbiAgICAgICAgICBjdXJyZW50Tm9kZS5yZW1vdmVDaGlsZHJlbigpO1xuXG4gICAgICAgICAgLy8gQWRkIGEgbmV3IHRyZWUgbGV2ZWwgY29uc2lzdGluZyBvZiBhIHBhcnRpdGlvbmVkIHNldCBvZiBjaGlsZHJlblxuICAgICAgICAgIGN1cnJlbnROb2RlXG4gICAgICAgICAgICAuaW5zZXJ0Q2hpbGRyZW4oXG4gICAgICAgICAgICAgIHNwbGl0SW50b1R3byhleGlzdGluZ0NoaWxkcmVuKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICB9XG59XG4iXX0=