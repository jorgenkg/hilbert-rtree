# Hilbert Packed R-Tree in Typescript

This is an implementation of a Hilbert Packed  R-Tree. R-Trees are a special data structure for indexing spatial data. To improve the performance of query operations on the data structure, the R-Tree may be packed using the space filling [Hilbert Curve](https://en.wikipedia.org/wiki/Hilbert_curve).

## Install

```
npm install hilbert-rtree
```

## Usage

```typescript
const options = { maxChildrenPerNode: 4 };
const tree = new RTree(
  options /** optional argument */
);

const structuredData = [
  {x: 0,  y: 0,  width: 10, height: 10, data: "This can be anything"      },
  {x: 10, y: 20, width: 15, height: 20, data: 123456                      },
  {x: 20, y: 20, width: 20, height: 25, data: {even: "this"}              },
  {x: 30, y: 30,                        data: "Or just a point with data" },
];

// Batch insert the data. The tree is packet using a Hilbert curve.
tree.batchInsert( structuredData );

// Alternatively, insert the nodes one at the time. The leaves will be inserted in the
// nodes that require the least expansion. After each insert, the tree is rebalanced on
// the leaf's branch.
for (const data of structuredData) {
  tree.insert( data );
}

// The spatial R-Tree index is queried by using a bounding rectangle. The search will 
// return data entries that overlap with query rectangle. 
const boundingRectangle = { x: 0,  y: 0, width: 5, height: 5 };
const results = tree.search( boundingRectangle ); // -> returns: [ "This can be anything" ]
```
