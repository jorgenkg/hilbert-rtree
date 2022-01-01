# Hilbert Packed R-Tree in Typescript

This is an implementation of a Hilbert Packed  R-Tree without any external dependencies. R-Trees are a special data structure for indexing spatial data. To improve the performance of query operations on the data structure, the R-Tree may be packed using the space filling [Hilbert Curve](https://en.wikipedia.org/wiki/Hilbert_curve).

## Requirements

This library may be used in browser environments and does not depend on NodeJS libraries.

Without polyfilling, the implementation depends on features available in node `>= 8`.

## Installation

```bash
npm i -S hilbert-rtree
```

## Usage

```typescript
const options = { maxChildrenPerNode: 4 };
const tree = new RTree(
  options /** optional argument */
);

const records = [
  {
    x: 0, y: 0, width: 10, height: 10, data: "This can be any data type"
  },
  { x: 30, y: 30, data: "Data may also be stored as a point rather than a rectangle" },
];

// Batch insert records. The tree is packet using a Hilbert curve.
tree.batchInsert(records);

// The spatial R-Tree is queried by using a bounding box. The search
// returns data records that overlap with query rectangle.
const boundingRectangle = {
  x: 0, y: 0, width: 5, height: 5
};
const result = tree.search(boundingRectangle);

console.log(result); // -> prints: [ "This can be any data type" ]
```

## API

#### [Documentation is available here](https://jorgenkg.github.io/hilbert-rtree/index.html)

