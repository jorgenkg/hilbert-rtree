import type { BoundingBox, Point } from "../@types/BoundingBox.js";
export declare class Rectangle implements BoundingBox {
    x: number;
    width: number;
    y: number;
    height: number;
    constructor(boundingBox: BoundingBox | Point);
    overlaps(boundingBox: BoundingBox): boolean;
    containedBy(boundingBox: BoundingBox): boolean;
    growRectangleToFit(boundingBox: BoundingBox): void;
    increaseInAreaIfGrownByRectangle(boundingBox: BoundingBox): number;
    getArea(): number;
}
//# sourceMappingURL=Rectangle.d.ts.map