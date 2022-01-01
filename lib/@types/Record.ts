import { Point } from "./Point";
import type { BoundingBox } from "./BoundingBox.js";

export type Record<T = any> = Readonly<(BoundingBox | Point) & {
  /** Data to be stored in the R-Tree */
  data?: T;
}>;
