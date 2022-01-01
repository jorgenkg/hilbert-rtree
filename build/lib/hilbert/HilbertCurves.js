"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHilbertCoordinates = void 0;
function toHilbertCoordinates(maxCoordinate, x, y) {
    const r = maxCoordinate;
    const mask = (1 << r) - 1;
    let hodd = 0;
    const heven = x ^ y;
    const notx = ~x & mask;
    const noty = ~y & mask;
    const tmp = notx ^ y;
    let v0 = 0;
    let v1 = 0;
    for (let k = 1; k < r; k++) {
        v1 = ((v1 & heven) | ((v0 ^ noty) & tmp)) >> 1;
        v0 = ((v0 & (v1 ^ notx)) | (~v0 & (v1 ^ noty))) >> 1;
    }
    hodd = (~v0 & (v1 ^ x)) | (v0 & (v1 ^ noty));
    return hilbertInterleaveBits(hodd, heven);
}
exports.toHilbertCoordinates = toHilbertCoordinates;
function hilbertInterleaveBits(odd, even) {
    let val = 0;
    let max = Math.max(odd, even);
    let n = 0;
    while (max > 0) {
        n++;
        max >>= 1;
    }
    for (let i = 0; i < n; i++) {
        const mask = 1 << i;
        const a = (even & mask) > 0 ? (1 << (2 * i)) : 0;
        const b = (odd & mask) > 0 ? (1 << (2 * i + 1)) : 0;
        val += a + b;
    }
    return val;
}
