import type { Point } from "./Point";

export interface BoundingBox extends Point {
  /** Must be >= 0. */
  width: number;
  /** Must be >= 0. */
  height: number;
}
