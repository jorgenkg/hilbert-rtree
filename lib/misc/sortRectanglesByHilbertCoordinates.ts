import { toHilbertCoordinates } from "../hilbert/HilbertCurves.js";
import type { RTreeRectangle } from "../r-tree/RTreeRectangle.js";

export function sortRectanglesByHilbertCoordinates(rectangles: Array<RTreeRectangle>): Array<RTreeRectangle> {
  // We shall create a square sized coordinate system with height = width. The
  // square must encapsulate all rectangles in the tree. To determine the required
  // size of the square, we must identify the max/min coordinates of the encapsulated
  // rectangles.
  const { maxCoordinate, minCoordinate } = rectangles
    .map(rectangle => [
      // X coordinate
      Math.ceil(rectangle.x + rectangle.width * 0.5),
      // Y coordinate
      Math.ceil(rectangle.y + rectangle.height * 0.5)
    ])
    .reduce(({ maxCoordinate: accumulatedMax, minCoordinate: accumulatedMin }, [x, y]) => {
      return {
        maxCoordinate: Math.max(accumulatedMax, Math.max(x, y)),
        minCoordinate: Math.min(accumulatedMin, Math.min(x, y))
      };
    }, { maxCoordinate: -Infinity, minCoordinate: Infinity });

  const weightedRectangles = rectangles
    .map(rectangle => ({
      rectangle,
      weight: toHilbertCoordinates(
        maxCoordinate - minCoordinate,
        Math.ceil(rectangle.x + rectangle.width * 0.5) - minCoordinate,
        Math.ceil(rectangle.y + rectangle.height * 0.5) - minCoordinate
      )
    }));

  weightedRectangles.sort((A, B) => A.weight - B.weight);

  return weightedRectangles.map(({ rectangle }) => rectangle);
}
