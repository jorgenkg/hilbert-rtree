"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../index.js");
const tree = new index_js_1.RTree();
const records = [
    {
        x: 0, y: 0, width: 10, height: 10, data: "This can be any data type"
    },
    { x: 30, y: 30, data: "Data may also be stored as a point rather than a rectangle" },
];
// Batch insert the data. The tree is packet using a Hilbert curve.
tree.batchInsert(records);
// The spatial R-Tree index is queried by using a bounding rectangle. The search
// returns data records that overlap with query rectangle.
const boundingRectangle = {
    x: 0, y: 0, width: 5, height: 5
};
const result = tree.search(boundingRectangle);
console.log(result); // -> prints: [ "This can be any data type" ]
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9leGFtcGxlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMENBQW9DO0FBRXBDLE1BQU0sSUFBSSxHQUFHLElBQUksZ0JBQUssRUFBRSxDQUFDO0FBRXpCLE1BQU0sT0FBTyxHQUFHO0lBQ2Q7UUFDRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSwyQkFBMkI7S0FDckU7SUFDRCxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsNERBQTRELEVBQUU7Q0FDckYsQ0FBQztBQUVGLG1FQUFtRTtBQUNuRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTFCLGdGQUFnRjtBQUNoRiwwREFBMEQ7QUFDMUQsTUFBTSxpQkFBaUIsR0FBRztJQUN4QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQztDQUNoQyxDQUFDO0FBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRTlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyw2Q0FBNkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSVHJlZSB9IGZyb20gXCIuLi9pbmRleC5qc1wiO1xuXG5jb25zdCB0cmVlID0gbmV3IFJUcmVlKCk7XG5cbmNvbnN0IHJlY29yZHMgPSBbXG4gIHtcbiAgICB4OiAwLCB5OiAwLCB3aWR0aDogMTAsIGhlaWdodDogMTAsIGRhdGE6IFwiVGhpcyBjYW4gYmUgYW55IGRhdGEgdHlwZVwiXG4gIH0sXG4gIHsgeDogMzAsIHk6IDMwLCBkYXRhOiBcIkRhdGEgbWF5IGFsc28gYmUgc3RvcmVkIGFzIGEgcG9pbnQgcmF0aGVyIHRoYW4gYSByZWN0YW5nbGVcIiB9LFxuXTtcblxuLy8gQmF0Y2ggaW5zZXJ0IHRoZSBkYXRhLiBUaGUgdHJlZSBpcyBwYWNrZXQgdXNpbmcgYSBIaWxiZXJ0IGN1cnZlLlxudHJlZS5iYXRjaEluc2VydChyZWNvcmRzKTtcblxuLy8gVGhlIHNwYXRpYWwgUi1UcmVlIGluZGV4IGlzIHF1ZXJpZWQgYnkgdXNpbmcgYSBib3VuZGluZyByZWN0YW5nbGUuIFRoZSBzZWFyY2hcbi8vIHJldHVybnMgZGF0YSByZWNvcmRzIHRoYXQgb3ZlcmxhcCB3aXRoIHF1ZXJ5IHJlY3RhbmdsZS5cbmNvbnN0IGJvdW5kaW5nUmVjdGFuZ2xlID0ge1xuICB4OiAwLCB5OiAwLCB3aWR0aDogNSwgaGVpZ2h0OiA1XG59O1xuY29uc3QgcmVzdWx0ID0gdHJlZS5zZWFyY2goYm91bmRpbmdSZWN0YW5nbGUpO1xuXG5jb25zb2xlLmxvZyhyZXN1bHQpOyAvLyAtPiBwcmludHM6IFsgXCJUaGlzIGNhbiBiZSBhbnkgZGF0YSB0eXBlXCIgXVxuIl19