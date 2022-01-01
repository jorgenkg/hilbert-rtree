import type { BoundingBox } from "../@types/BoundingBox.js";
import type { Point } from "../@types/Point";


export class Rectangle implements BoundingBox {
  public x: number;
  public width: number;
  public y: number;
  public height: number;

  constructor(boundingBox: BoundingBox | Point) {
    this.x = boundingBox.x;
    this.y = boundingBox.y;
    this.width = "width" in boundingBox ? boundingBox.width : 0;
    this.height = "height" in boundingBox ? boundingBox.height : 0;
  }

  public overlaps(boundingBox: BoundingBox): boolean {
    return (this.x <= boundingBox.x + boundingBox.width && this.x + this.width >= boundingBox.x) &&
      this.y + this.height >= boundingBox.y && boundingBox.y + boundingBox.height >= this.y;
  }

  public containedBy(boundingBox: BoundingBox): boolean {
    return this.x >= boundingBox.x && this.x + this.width <= boundingBox.x + boundingBox.width && this.y >= boundingBox.y && this.y + this.height <= boundingBox.y + boundingBox.height;
  }

  public growRectangleToFit(boundingBox: BoundingBox): void {
    this.height = Math.max(this.y + this.height, boundingBox.y + boundingBox.height) - Math.min(this.y, boundingBox.y);
    this.width = Math.max(this.x + this.width, boundingBox.x + boundingBox.width) - Math.min(this.x, boundingBox.x);
    this.x = Math.min(this.x, boundingBox.x);
    this.y = Math.min(this.y, boundingBox.y);
  }

  public increaseInAreaIfGrownByRectangle(boundingBox: BoundingBox): number {
    const maxYCoordinate = Math.max(this.y + this.height, boundingBox.y + boundingBox.height);
    const minYCoordinate = Math.min(this.y, boundingBox.y);
    const maxXCoordinate = Math.max(this.x + this.width, boundingBox.x + boundingBox.width);
    const minXCoordinate = Math.min(this.x, boundingBox.x);
    const newArea = (maxYCoordinate - minYCoordinate) * (maxXCoordinate - minXCoordinate);
    return newArea - this.getArea();
  }

  public getArea(): number {
    return this.height * this.width;
  }

  public getCenter(): { centerX: number; centerY: number; } {
    return {
      centerX: this.x + (this.width / 2),
      centerY: this.y + (this.height / 2),
    };
  }
}
