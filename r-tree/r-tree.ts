/// <reference path="../type-definitions/lodash.d.ts" />
interface DataEntry{
	x: number;
	y: number;

	width: number;
	height: number;

	data?: any;
}

class RTreeRectangle{
	public children:Array<RTreeRectangle> = [];
	public parent: RTreeRectangle;

	constructor(public x: number,
                public y: number,
                public width: number,
                public height: number,
                public data: any){
    }

    public static generateEmptyNode(): RTreeRectangle {
    	return new RTreeRectangle( Infinity, Infinity, 0, 0, null );
    }

    public overlaps( anotherRect: RTreeRectangle ): boolean{ 
        return this.x < anotherRect.x + anotherRect.width && this.x + this.width > anotherRect.x && this.y + this.height > anotherRect.y && anotherRect.y + anotherRect.height > this.y;
    }

    public contains( anotherRect: RTreeRectangle ): boolean{
    	return this.x <= anotherRect.x && this.x + this.width >= anotherRect.x + anotherRect.width && this.y <= anotherRect.y && this.y + this.height >= anotherRect.y + anotherRect.height;
    }

    public growRectangleToFit( anotherRect: RTreeRectangle ): void{
    	if( this.x === Infinity ){
    		this.height = anotherRect.height;
	    	this.width = anotherRect.width;
	    	this.x = anotherRect.x;
	    	this.y = anotherRect.y;
    	}
    	else{
    		this.height = Math.max( this.y + this.height, anotherRect.y + anotherRect.height ) - Math.min( this.y, anotherRect.y );
	    	this.width = Math.max( this.x + this.width, anotherRect.x + anotherRect.width ) - Math.min( this.x, anotherRect.x );
	    	this.x = Math.min( this.x, anotherRect.x );
	    	this.y = Math.min( this.y, anotherRect.y );
    	}
    }

    public areaIfGrownBy( anotherRect: RTreeRectangle ): number{
    	if( this.x === Infinity ){
    		return anotherRect.height * anotherRect.width;
    	}
    	else{
    		return (Math.max( this.y + this.height, anotherRect.y + anotherRect.height ) - Math.min( this.y, anotherRect.y )) * (Math.max( this.x + this.width, anotherRect.x + anotherRect.width ) - Math.min( this.x, anotherRect.x )) - this.getArea();
    	}
    }

    public getArea(): number{
    	return this.height * this.width;
    }

    public splitIntoSiblings(): Array<RTreeRectangle> {
    	var pivot    = Math.floor(this.children.length / 2);
    	var sibling1 = RTreeRectangle.generateEmptyNode();
    	var sibling2 = RTreeRectangle.generateEmptyNode();

    	var maxCoordinate = -Infinity;
		var minCoordinate = Infinity;
		var coordX: number, coordY: number;

		_.each(this.children, function( rect: RTreeRectangle ){
			coordX = Math.ceil( rect.x + rect.width*0.5 );
			coordY = Math.ceil( rect.y + rect.height*0.5 );
			maxCoordinate = Math.max( maxCoordinate, Math.max(coordX, coordY) );
			minCoordinate = Math.min( minCoordinate, Math.min(coordX, coordY) );
		});

		var sorted = _.sortBy( this.children, function( rect: RTreeRectangle){
			return HilbertCurves.toHilbertCoordinates( maxCoordinate-minCoordinate, Math.ceil(rect.x + rect.width*0.5)-minCoordinate, Math.ceil(rect.y + rect.height*0.5)-minCoordinate );
		});

    	_.each( sorted, function ( rect: RTreeRectangle, i: number ){
    		if( i <= pivot ){
    			sibling1.insertChildRectangle( rect );
    		}
    		else{
    			sibling2.insertChildRectangle( rect );	
    		}
    	});
    	

    	this.children.length = 0;
    	sorted.length = 0;

    	return [sibling1, sibling2];
    }

    public numberOfChildren(): number {
    	return this.children.length;
    }

	public isLeafNode(): boolean{
		return this.children.length === 0;
	}

	public hasLeafNodes(): boolean{
		return this.isLeafNode() || this.children[0].isLeafNode();
	}

	public insertChildRectangle( insertRect: RTreeRectangle ): void{
		insertRect.parent = this;
		this.children.push( insertRect );
		this.growRectangleToFit( insertRect );
	}


	public removeChildRectangle( removeRect: RTreeRectangle ): void{
		this.children.splice(  _.indexOf( this.children, removeRect ), 1 );
	}

	public getSubtreeData(): Array<RTreeRectangle>{
		if(this.children.length === 0){
			return [ this.data ];
		}

		return _.chain( this.children )
				.map( _.method("getSubtreeData") )
				.thru( fastFlattenArray )
				.value() as Array<RTreeRectangle>;
	}
}

class RTree{
	public root: RTreeRectangle = RTreeRectangle.generateEmptyNode();

	constructor( private maxNodes: number ){
	}

	private _recursiveSeach( searchRect: RTreeRectangle, node: RTreeRectangle ): Array<RTreeRectangle>{
		if( searchRect.contains( node ) || node.isLeafNode() ){
			// If the query rectangles encapsulates this node, any data points stored within the node
			// rectangle should be returned by the search. This is also true if the node is a leaf. (We
			// tested that the query overlapped before we called the function on this child)
			return node.getSubtreeData();
		}
		else {
			// Recursively search the rectangles intersected by the search query rectangle.
        	return _.chain( node.children )
					.filter( _.method("overlaps", searchRect ))
					.map(( iterateNode: RTreeRectangle ) => {
						return this._recursiveSeach( searchRect, iterateNode );
					})
					.flatten()
					.value() as Array<RTreeRectangle>;
		}
	}

	public search( searchBoundary: DataEntry ): Array<any>{
		var searchRect = new RTreeRectangle( searchBoundary.x, searchBoundary.y, searchBoundary.width, searchBoundary.height, null );
		return this._recursiveSeach( searchRect, this.root );
	}

	public insert( dataPoint: DataEntry ): void{
		var insertRect = new RTreeRectangle( dataPoint.x, dataPoint.y, dataPoint.width, dataPoint.height, dataPoint.data );

		var currentNode: RTreeRectangle = this.root;

		while( !currentNode.hasLeafNodes() ){
			// Grow the current node's bounding rectangle
			currentNode.growRectangleToFit( insertRect );

			// Decide the subsequent node to "travel" to
			currentNode = <RTreeRectangle> _.minBy(currentNode.children, _.method("areaIfGrownBy", insertRect ));
		}

		// We have discovered the correct node to insert this leaf
		currentNode.insertChildRectangle( insertRect );

		// Execute the balance routine
		this.balanceTreePath( insertRect );
	}

	private _recursiveTreeLayer( listOfRectangles: Array<RTreeRectangle>, level = 1 ): Array<RTreeRectangle> {
		var numberOfParents =  Math.ceil(listOfRectangles.length / this.maxNodes);
		var nodeLevel: Array<RTreeRectangle> = [];
		var childCount = 0;
		var parent: RTreeRectangle;

		for( var i=0; i<numberOfParents; i++){
			parent = RTreeRectangle.generateEmptyNode();
			childCount = Math.min( this.maxNodes, listOfRectangles.length );
			
			for( var y=0; y< childCount; y++){
				parent.insertChildRectangle( listOfRectangles.pop() );
			}

			nodeLevel.push( parent );
		}
		

		if( numberOfParents > 1 ){
			// We have not yet reached the construction of a root node
			return this._recursiveTreeLayer( nodeLevel, level + 1 );
		}
		else{
			// The root node has been initialized
			return nodeLevel;
		}
	}

	public batchInsert( listOfData: Array<DataEntry> ){
		var listOfRectangles = _.map( listOfData, function( dataPoint ){
			return new RTreeRectangle( dataPoint.x, dataPoint.y, dataPoint.width, dataPoint.height, dataPoint.data );
		});

		var maxCoordinate = -Infinity;
		var minCoordinate = Infinity;
		var coordX: number, coordY: number;

		_.each(listOfRectangles, function( rect: RTreeRectangle ){
			coordX = Math.ceil( rect.x + rect.width*0.5 );
			coordY = Math.ceil( rect.y + rect.height*0.5 );
			maxCoordinate = Math.max( maxCoordinate, Math.max(coordX, coordY) );
			minCoordinate = Math.min( minCoordinate, Math.min(coordX, coordY) );
		});

		var sorted = _.sortBy( listOfRectangles, function( rect: RTreeRectangle){
			return HilbertCurves.toHilbertCoordinates( maxCoordinate-minCoordinate, Math.ceil(rect.x + rect.width*0.5)-minCoordinate, Math.ceil(rect.y + rect.height*0.5)-minCoordinate );
		});

		listOfRectangles.length = 0;

		this.root = this._recursiveTreeLayer( sorted )[0];
	}


	private balanceTreePath( leafRectangle: RTreeRectangle ): void {
		var currentNode = leafRectangle;

		while( !_.isUndefined(currentNode.parent) && currentNode.parent.numberOfChildren() > this.maxNodes){
			// Enter the loop if the current node's parent has too many children.

			var currentNode = currentNode.parent;

			if( currentNode != this.root ){
				currentNode.parent.removeChildRectangle( currentNode );

				_.forEach( currentNode.splitIntoSiblings(), function( insertRect: RTreeRectangle ) {
					currentNode.parent.insertChildRectangle( insertRect );
				});
			} 
			else if ( currentNode == this.root ){
				// Split the children of the root node (implies adding another tree level), and add these newly
				// generated children to the root node again.
				_.forEach( currentNode.splitIntoSiblings(), function( insertRect: RTreeRectangle ) {
					currentNode.insertChildRectangle( insertRect );
				});
			}
		}
	}
}