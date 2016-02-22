var HilbertCurves;
(function (HilbertCurves) {
    function toHilbertCoordinates(maxCoordinate, x, y) {
        var rx, ry, s, hilbertIndex = 0;
        for (s = Math.floor(maxCoordinate / 2); s > 0; s /= 2) {
            rx = (x & s) > 0;
            ry = (y & s) > 0;
            hilbertIndex += s * s * ((3 * rx) ^ ry);
            var rotated = rotate(s, x, y, rx, ry);
            x = rotated[0];
            y = rotated[1];
        }
        return hilbertIndex;
    }
    HilbertCurves.toHilbertCoordinates = toHilbertCoordinates;
    function fromHilbertCoordinates(maxCoordinate, hilbertIndex) {
        var x, y, rx, ry, s, t = hilbertIndex;
        x = y = 0;
        for (s = 1; s < maxCoordinate; s *= 2) {
            rx = 1 & (t / 2);
            ry = 1 & (t ^ rx);
            var rotated = rotate(s, x, y, rx, ry);
            x = rotated[0];
            y = rotated[1];
            x += s * rx;
            y += s * ry;
            t /= 4;
        }
        return [x, y];
    }
    HilbertCurves.fromHilbertCoordinates = fromHilbertCoordinates;
    function rotate(maxCoordinate, x, y, rx, ry) {
        var t;
        if (ry == 0) {
            if (rx == 1) {
                x = maxCoordinate - 1 - x;
                y = maxCoordinate - 1 - y;
            }
            //Swap x and y
            t = x;
            x = y;
            y = t;
        }
        return [x, y];
    }
})(HilbertCurves || (HilbertCurves = {}));
