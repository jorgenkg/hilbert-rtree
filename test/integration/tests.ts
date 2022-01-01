import * as test from "tape";
import { RTree } from "../../index.js";

test("It should be possible to create an RTree by inserting nodes successively", async t => {
  const tree = new RTree({ maxChildrenPerNode: 2 });

  tree.insert({
    x: 0,
    y: 0,
    data: "Contained point"
  });

  tree.insert({
    x: 1,
    y: 1,
    width: 1,
    height: 1,
    data: "Contained area"
  });

  tree.insert({
    x: 2,
    y: 2,
    width: 1,
    height: 1,
    data: "Overlapped area"
  });

  t.deepEquals(tree.search({
    x: 0,
    y: 0,
    width: 2,
    height: 2
  }), [ "Contained point", "Contained area", "Overlapped area" ], "Expect query to return overlapped data entries");
});

test("It should be possible to create an RTree by batch inserting nodes", async t => {
  const tree = new RTree({ maxChildrenPerNode: 2 });

  tree.batchInsert([{
    x: 0,
    y: 0,
    data: "Contained point"
  }, {
    x: 1,
    y: 1,
    width: 1,
    height: 1,
    data: "Contained area"
  }, {
    x: 2,
    y: 2,
    width: 1,
    height: 1,
    data: "Overlapped area"
  }]);

  t.deepEquals(tree.search({
    x: 0,
    y: 0,
    width: 2,
    height: 2
  }), [ "Contained point", "Contained area", "Overlapped area" ], "Expect query to return overlapped data entries");
});

