/// <reference path="../../type-definitions/knockout.d.ts" />
/// <reference path="../../type-definitions/jquery.d.ts" />
function recursiveDrawRectangles(canv, rect, level, color) {
    if (color === void 0) { color = undefined; }
    var ctx = canv.getContext("2d");
    if (rect.children.length == 0) {
        ctx.strokeStyle = color || "#FF0000";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(rect.x, canv.height - rect.y, rect.width, -rect.height);
        ctx.setLineDash([]);
        ctx.fillStyle = color || "#FF0000";
        ctx.font = "20px serif";
        ctx.fillText(rect.data != null ? rect.data : "query", rect.x + rect.width / 2, canv.height - rect.y - rect.height / 2);
    }
    else if (rect.children.length > 0) {
        ctx.strokeStyle = "#000000";
        ctx.setLineDash([15, 15]);
        ctx.strokeRect(rect.x, canv.height - rect.y, rect.width, -rect.height);
        ctx.setLineDash([]);
        ctx.font = "20px serif";
        ctx.fillStyle = "#000000";
        ctx.fillText(level.toString(), rect.x + rect.width - 20, canv.height - rect.y - rect.height + 20);
        _.forEach(rect.children, function (r) {
            recursiveDrawRectangles(canv, r, level + 1);
        });
    }
}
function createTree(maxNodes, maxDepth, numberOfNodes, canvas, batchCreate, renderConstruction) {
    var tree = new RTree(maxNodes, maxDepth);
    var maxX = (canvas.width - 100);
    var maxY = (canvas.height - 100);
    var minWidth = 50;
    var minHeight = 50;
    var maxWidth = minWidth + 10;
    var maxHeight = minHeight + 10;
    var nodes = _.map(_.range(numberOfNodes), function (i) {
        var data = {};
        data.x = Math.floor(Math.random() * (maxX - minWidth));
        data.y = Math.floor(Math.random() * (maxY - minHeight));
        data.width = Math.min(maxWidth, Math.floor(Math.random() * (maxX - data.x)) + minWidth);
        data.height = Math.min(maxHeight, Math.floor(Math.random() * (maxY - data.y)) + minHeight);
        data.data = i;
        return data;
    });
    var ctx = canvas.getContext("2d");
    if (batchCreate) {
        tree.batchInsert(nodes);
    }
    else {
        if (renderConstruction) {
            for (var i = 0; i < nodes.length; i++) {
                setTimeout(function (i) {
                    tree.insert(nodes[i]);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    recursiveDrawRectangles(canvas, tree.root, 1);
                }, 300 * i, i);
            }
        }
        else {
            for (var i = 0; i < nodes.length; i++) {
                tree.insert(nodes[i]);
            }
        }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    recursiveDrawRectangles(canvas, tree.root, 1);
    return tree;
}
function searchTree(tree, x, y, width, height, canvas, viewModel) {
    var searchRect = {
        x: x,
        y: y,
        width: width,
        height: height
    };
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    recursiveDrawRectangles(canvas, tree.root, 1);
    recursiveDrawRectangles(canvas, new RTreeRectangle(x, y, width, height, null), 1, "#0000ff");
    var results = tree.search(searchRect);
    viewModel.searchResults.removeAll();
    _.forEach(results, function (id) {
        viewModel.searchResults.push(id);
    });
    return results;
}
$(document).ready(function () {
    var canvas = document.getElementById("canvas");
    var $overlay = $(canvas);
    $overlay.attr("width", $overlay.parent().outerWidth() - 10);
    $overlay.attr("height", $overlay.parent().outerHeight() - 10);
    var tree = null;
    var myViewModel = {
        searchResults: ko.observableArray(),
        batchConstruct: ko.observable(true),
        intermediateRender: ko.observable(false),
        createNewTree: function () {
            var maxNodes = 2, maxDepth = 5, numberOfNodes = 10;
            tree = createTree(maxNodes, maxDepth, numberOfNodes, canvas, myViewModel.batchConstruct(), myViewModel.intermediateRender());
        },
        queryTree: function () {
            searchTree(tree, canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2, canvas, myViewModel);
        }
    };
    ko.applyBindings(myViewModel);
    myViewModel.createNewTree();
});
