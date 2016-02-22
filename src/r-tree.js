/// <reference path="../libs/lodash.d.ts" />
/// <reference path="HilbertCurves.ts" />
var RTreeRectangle = (function () {
    function RTreeRectangle(x, y, width, height, data) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.data = data;
        this.children = [];
    }
    RTreeRectangle.prototype.overlaps = function (anotherRect) {
        return this.x < anotherRect.x + anotherRect.width && this.x + this.width > anotherRect.x && this.y + this.height > anotherRect.y && anotherRect.y + anotherRect.height > this.y;
    };
    RTreeRectangle.prototype.contains = function (anotherRect) {
        return this.x <= anotherRect.x && this.x + this.width >= anotherRect.x + anotherRect.width && this.y <= anotherRect.y && this.y + this.height >= anotherRect.y + anotherRect.height;
    };
    RTreeRectangle.prototype.growRectangleToFit = function (anotherRect) {
        if (this.x === Infinity) {
            this.height = anotherRect.height;
            this.width = anotherRect.width;
            this.x = Math.min(this.x, anotherRect.x);
            this.y = Math.min(this.y, anotherRect.y);
        }
        else {
            this.height = Math.max(this.y + this.height, anotherRect.y + anotherRect.height) - Math.min(this.y, anotherRect.y);
            this.width = Math.max(this.x + this.width, anotherRect.x + anotherRect.width) - Math.min(this.x, anotherRect.x);
            this.x = Math.min(this.x, anotherRect.x);
            this.y = Math.min(this.y, anotherRect.y);
        }
    };
    RTreeRectangle.prototype.areaIfGrownBy = function (anotherRect) {
        if (this.x === Infinity) {
            return anotherRect.height * anotherRect.width;
        }
        else {
            return ((Math.max(this.y + this.height, anotherRect.y + anotherRect.height) - Math.min(this.y, anotherRect.y)) * (Math.max(this.x + this.width, anotherRect.x + anotherRect.width) - Math.min(this.x, anotherRect.x)) - this.getArea()) / this.getArea();
        }
    };
    RTreeRectangle.prototype.getArea = function () {
        return this.height * this.width;
    };
    RTreeRectangle.prototype.splitIntoSiblings = function () {
        console.log("* splitting:", this);
        var sibling1 = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
        var sibling2 = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
        var maxCoordinate = _.chain(this.children)
            .map(function (rect) {
            return Math.max(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        })
            .thru(_.max)
            .value();
        var sorted = _.sortBy(this.children, function (rect) {
            return HilbertCurves.toHilbertCoordinates(maxCoordinate, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        });
        var center = Math.floor(this.children.length / 2);
        this.children.length = 0;
        var i = 0;
        while (sorted.length > 0) {
            i += 1;
            var child = sorted.pop();
            if (i <= center) {
                sibling1.insertChildRectangle(child);
            }
            else {
                sibling2.insertChildRectangle(child);
            }
        }
        return [sibling1, sibling2];
    };
    RTreeRectangle.prototype.numberOfChildren = function () {
        return this.children.length;
    };
    RTreeRectangle.prototype.isLeafNode = function () {
        return this.children.length === 0;
    };
    RTreeRectangle.prototype.hasLeafNodes = function () {
        return this.isLeafNode() || this.children[0].isLeafNode();
    };
    RTreeRectangle.prototype.insertChildRectangle = function (insertRect) {
        this.children.push(insertRect);
        this.growRectangleToFit(insertRect);
    };
    return RTreeRectangle;
})();
var RTree = (function () {
    function RTree(maxNodes, maxDepth) {
        this.maxNodes = maxNodes;
        this.maxDepth = maxDepth;
        this.root = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
    }
    RTree.prototype._recursiveSeach = function (searchRect, node) {
        var _this = this;
        if (!node.isLeafNode()) {
            var containedNode = _.find(node.children, function (node) {
                return node.contains(searchRect);
            });
            if (_.isUndefined(containedNode)) {
                return _.chain(node.children)
                    .filter(function (child) {
                    return searchRect.overlaps(child);
                })
                    .map(function (iterateNode) {
                    return _this._recursiveSeach(searchRect, iterateNode);
                })
                    .flatten()
                    .value();
            }
            else {
                return this._recursiveSeach(searchRect, containedNode);
            }
        }
        else if (searchRect.overlaps(node)) {
            return [node];
        }
        else {
            return [];
        }
    };
    RTree.prototype.search = function (searchBoundary) {
        var searchRect = new RTreeRectangle(searchBoundary.x, searchBoundary.y, searchBoundary.width, searchBoundary.height, null);
        return _.map(this._recursiveSeach(searchRect, this.root), function (resultRect) {
            return resultRect.data;
        });
    };
    RTree.prototype.insert = function (dataPoint) {
        var insertRect = new RTreeRectangle(dataPoint.x, dataPoint.y, dataPoint.width, dataPoint.height, dataPoint.data);
        var currentNode = this.root;
        var path = [currentNode];
        var level = 1;
        while (!currentNode.hasLeafNodes() && level < this.maxDepth) {
            level += 1;
            currentNode.growRectangleToFit(insertRect);
            var validSubNodes = _.filter(currentNode.children, function (node) {
                return node.overlaps(insertRect);
            });
            if (validSubNodes.length > 0) {
                currentNode = validSubNodes.length > 1 ? _.minBy(validSubNodes, function (node) {
                    return node.areaIfGrownBy(insertRect);
                }) : validSubNodes[0];
                path.push(currentNode);
            }
            else {
                currentNode = _.minBy(currentNode.children, function (node) {
                    return node.areaIfGrownBy(insertRect);
                });
                path.push(currentNode);
            }
        }
        currentNode.insertChildRectangle(insertRect);
        this.balanceTreePath(path);
    };
    RTree.prototype._recursiveTreeLayer = function (listOfRectangles, level) {
        if (level === void 0) { level = 1; }
        var numberOfParents = Math.ceil(listOfRectangles.length / this.maxNodes);
        var nodeLevel = [];
        for (var i = 0; i < numberOfParents; i++) {
            var parent = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
            for (var y = 0; y < this.maxNodes; y++) {
                if (listOfRectangles.length > 0) {
                    parent.insertChildRectangle(listOfRectangles.splice(0, 1)[0]);
                }
                else {
                    break;
                }
            }
            nodeLevel.push(parent);
        }
        if (level == this.maxDepth - 1) {
            // We have reached the max depth. The only option is to let the root node keep all these as child nodes
            var rootNode = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
            _.forEach(nodeLevel, function (insertRect) {
                rootNode.insertChildRectangle(insertRect);
            });
            return [rootNode];
        }
        else if (numberOfParents > 1) {
            // We have not yet reached the construction of a root node
            return this._recursiveTreeLayer(nodeLevel, level + 1);
        }
        else {
            // The root node has been initialized
            return nodeLevel;
        }
    };
    RTree.prototype.batchInsert = function (listOfData) {
        var listOfRectangles = _.map(listOfData, function (dataPoint) {
            return new RTreeRectangle(dataPoint.x, dataPoint.y, dataPoint.width, dataPoint.height, dataPoint.data);
        });
        var maxCoordinate = _.chain(listOfRectangles)
            .map(function (rect) {
            return Math.max(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        })
            .thru(_.max)
            .value();
        var sorted = _.sortBy(listOfRectangles, function (rect) {
            return HilbertCurves.toHilbertCoordinates(maxCoordinate, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        });
        listOfRectangles.length = 0;
        this.root = this._recursiveTreeLayer(sorted)[0];
    };
    RTree.prototype.balanceTreePath = function (pathOfRectangles) {
        while (pathOfRectangles.length > 0) {
            var currentNode = pathOfRectangles.pop();
            if (currentNode.numberOfChildren() <= this.maxNodes) {
                return; // the tree is valid
            }
            else if (currentNode != this.root) {
                var parentNode = pathOfRectangles[pathOfRectangles.length - 1];
                var replacementSiblings = currentNode.splitIntoSiblings();
                parentNode.children.splice(_.indexOf(parentNode.children, currentNode), 1);
                _.forEach(replacementSiblings, function (insertRect) {
                    parentNode.insertChildRectangle(insertRect);
                });
            }
            else if (currentNode == this.root) {
                var replacementSiblings = currentNode.splitIntoSiblings();
                _.forEach(replacementSiblings, function (insertRect) {
                    currentNode.insertChildRectangle(insertRect);
                });
            }
        }
    };
    return RTree;
})();
