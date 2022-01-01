import { RTree } from "../index.js";

const tree = new RTree();

const records = [
  {
    x: 0, y: 0, width: 10, height: 10, data: "This can be any data type"
  },
  { x: 30, y: 30, data: "Data may also be stored as a point rather than a rectangle" },
];

// Batch insert the data. The tree is packet using a Hilbert curve.
tree.batchInsert(records);

// The spatial R-Tree index is queried by using a bounding rectangle. The search
// returns data records that overlap with query rectangle.
const boundingRectangle = {
  x: 0, y: 0, width: 5, height: 5
};
const result = tree.search(boundingRectangle);

console.log(result); // -> prints: [ "This can be any data type" ]
