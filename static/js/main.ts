/// <reference path="../../type-definitions/knockout.d.ts" />
/// <reference path="../../type-definitions/jquery.d.ts" />

function recursiveDrawRectangles( canv: HTMLCanvasElement, rect: RTreeRectangle, level: number, color: any = undefined ): void {
	var ctx = canv.getContext("2d");

	if( rect.children.length == 0 ){
		ctx.strokeStyle= color || "#FF0000";
		ctx.setLineDash([3,3]);
		ctx.strokeRect( rect.x, canv.height-rect.y, rect.width, -rect.height);

		ctx.setLineDash([]);
		ctx.fillStyle= color || "#FF0000";
		ctx.font = "20px serif";
			ctx.fillText(rect.data != null ? rect.data : "query", rect.x + rect.width/2, canv.height-rect.y-rect.height/2);
	}
	else if( rect.children.length > 0 ) {
		ctx.strokeStyle="#000000";
		ctx.setLineDash([15,15]);
		ctx.strokeRect( rect.x, canv.height-rect.y, rect.width, -rect.height);
		
		ctx.setLineDash([]);
		ctx.font = "20px serif";
		ctx.fillStyle="#000000";
			ctx.fillText(level.toString(), rect.x + rect.width -20, canv.height-rect.y-rect.height+20);

		_.forEach( rect.children, function( r ) {
			recursiveDrawRectangles( canv, r, level + 1 );
		});
	}
}

function createTree( maxNodes: number, numberOfNodes: number, canvas: HTMLCanvasElement, batchCreate: boolean, renderConstruction: boolean ){
	var tree = new RTree( maxNodes );
	var maxX = (canvas.width - 100);
	var maxY = (canvas.height - 100);
	var minWidth = 20;
	var minHeight = 20;
	var maxWidth = minWidth + 10;
	var maxHeight = minHeight + 10;
	var nodes = _.map( _.range(numberOfNodes), function( i: number ){
		var data: any = {};
		data.x = Math.floor(Math.random() * (maxX-minWidth));
		data.y = Math.floor(Math.random() * (maxY-minHeight));

		data.width = Math.min(maxWidth, Math.floor(Math.random() * (maxX - data.x)) + minWidth);
		data.height = Math.min(maxHeight, Math.floor(Math.random() * (maxY - data.y	)) + minHeight);
		data.data = i;
		return data;
	});

	var ctx = canvas.getContext("2d");

	if( batchCreate ){
		tree.batchInsert( nodes );
	}
	else{
		if( renderConstruction ){
			for( var i: number = 0; i<nodes.length; i++){
				setTimeout(function(i: number){
					tree.insert( nodes[i] );
					ctx.clearRect(0,0,canvas.width,canvas.height);
					recursiveDrawRectangles( canvas, tree.root, 1 );
				}, 100*i, i );
			}
		}
		else {
			for( var i=0; i<nodes.length; i++){
				tree.insert( nodes[i] );
			}
		}
	}
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	recursiveDrawRectangles( canvas, tree.root, 1 );

	return tree;
}

function searchTree( tree: RTree, x: number, y: number, width: number, height: number, canvas: HTMLCanvasElement, viewModel: any ): Array<number>{
	var searchRect = {
		x: x,
		y: y,
		width: width,
		height: height
	};

	var ctx = canvas.getContext("2d");

	ctx.clearRect(0,0,canvas.width,canvas.height);
	recursiveDrawRectangles( canvas, tree.root, 1 );
	recursiveDrawRectangles( canvas, new RTreeRectangle(x,y,width,height,null), 1, "#0000ff" );

	var results: number[] = tree.search( searchRect );

	viewModel.searchResults.removeAll();
	_.forEach( results, function( id: number ){
		viewModel.searchResults.push( id );
	});

	return results;
}


$(document).ready(function(){
	var canvas = <HTMLCanvasElement> document.getElementById("canvas");

	var $overlay = $(canvas);
    $overlay.attr("width", $overlay.parent().outerWidth()-10);
    $overlay.attr("height", $overlay.parent().outerHeight()-10);

	var tree: RTree = null;

	var myViewModel = {
	    searchResults: ko.observableArray(),
	    batchConstruct: ko.observable( true ),
	    intermediateRender: ko.observable( false ),

	    createNewTree: function(){
	    	var maxNodes: number = 4, numberOfNodes: number = 20;
	    	tree = createTree( maxNodes, numberOfNodes, canvas, myViewModel.batchConstruct(), myViewModel.intermediateRender() );
	    },
	    queryTree: function(){
	    	searchTree( tree, canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2, canvas, myViewModel );
	    }
	};
	ko.applyBindings(myViewModel);

	myViewModel.createNewTree();
});