import { RTreeRectangle } from "../r-tree/RTreeRectangle.js";
import { sortRectanglesByHilbertCoordinates } from "./sortRectanglesByHilbertCoordinates.js";


export function splitIntoTwo(rectangles: Array<RTreeRectangle>): RTreeRectangle[] {
  if (rectangles.length <= 1) {
    return rectangles;
  }

  const pivot = Math.floor(rectangles.length / 2);
  const sortedRectangles = sortRectanglesByHilbertCoordinates(rectangles);

  // console.log({ sortedRectangles, rectangles });
  const firstChildPartition = sortedRectangles.splice(0, pivot);
  const secondChildPartition = sortedRectangles;

  const sibling1Child = firstChildPartition[0];

  const sibling1 = new RTreeRectangle({
    x: sibling1Child.x,
    y: sibling1Child.y,
    height: sibling1Child.height,
    width: sibling1Child.width
  });

  sibling1.insertChildren(firstChildPartition);


  const sibling2Child = secondChildPartition[0];

  const sibling2 = new RTreeRectangle({
    x: sibling2Child.x,
    y: sibling2Child.y,
    height: sibling2Child.height,
    width: sibling2Child.width
  });

  sibling2.insertChildren(secondChildPartition);

  return [sibling1, sibling2];
}
