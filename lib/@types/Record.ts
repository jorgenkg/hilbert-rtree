import type { BoundingBox } from "./BoundingBox.js";
import type { Point } from "./Point";

export type Record<T = any> = Readonly<(BoundingBox | Point) & {
  /** Data to be stored in the R-Tree */
  data?: T;
}>;
