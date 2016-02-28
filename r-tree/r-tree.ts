/// <reference path="../type-definitions/lodash.d.ts" />
/// <reference path="HilbertCurves.ts" />

interface DataEntry{
	x: number;
	y: number;

	width: number;
	height: number;

	data?: any;
}

class RTreeRectangle{
	public children:Array<RTreeRectangle> = [];

	constructor(public x: number,
                public y: number,
                public width: number,
                public height: number,
                public data: any){
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
	    	this.x = Math.min( this.x, anotherRect.x );
	    	this.y = Math.min( this.y, anotherRect.y );
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
    		return (Math.max( this.y + this.height, anotherRect.y + anotherRect.height ) - Math.min( this.y, anotherRect.y )) * (Math.max( this.x + this.width, anotherRect.x + anotherRect.width ) - Math.min( this.x, anotherRect.x ));
    	}
    }

    public getArea(): number{
    	return this.height * this.width;
    }

    public splitIntoSiblings(): Array<RTreeRectangle> {
    	var sibling1 = new RTreeRectangle( Infinity, Infinity, 0, 0, null );
    	var sibling2 = new RTreeRectangle( Infinity, Infinity, 0, 0, null );

    	var maxCoordinate = _.chain( this.children )
							.map(function( rect: RTreeRectangle ){
								return Math.max( rect.x + rect.width*0.5, rect.y + rect.height*0.5 );
							})
							.thru( _.max )
							.value();
		
		var sorted = _.sortBy( this.children, function( rect: RTreeRectangle){
			return HilbertCurves.toHilbertCoordinates( maxCoordinate, rect.x + rect.width*0.5, rect.y + rect.height*0.5 );
		});

		var center  = Math.floor(this.children.length / 2);

    	this.children.length = 0;

    	var i = 0;
    	while( sorted.length > 0 ){
    		i += 1;
    		var child: RTreeRectangle = sorted.pop();
    		if( i <= center ){
    			sibling1.insertChildRectangle( child );
    		}
    		else{
    			sibling2.insertChildRectangle( child );	
    		}
    	}

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
		this.children.push( insertRect );
		this.growRectangleToFit( insertRect );
	}

	public getSubtreeData(): Array<RTreeRectangle>{
		if(this.children.length === 0){
			return [ this.data ];
		}

		return _.chain( this.children )
				.map(function( child: RTreeRectangle ){
					return child.getSubtreeData();
				})
				.flatten()
				.value() as Array<RTreeRectangle>;
	}
}

class RTree{
	public root: RTreeRectangle = new RTreeRectangle( Infinity, Infinity, 0, 0, null );

	constructor( private maxNodes: number, private maxDepth: number ){
	}

	private _recursiveSeach( searchRect: RTreeRectangle, node: RTreeRectangle ): Array<RTreeRectangle>{
		if( searchRect.contains( node ) || (node.isLeafNode() && searchRect.overlaps( node ))){
			return node.getSubtreeData();
		}
		else if( !node.isLeafNode() ){
        	return _.chain( node.children )
					.filter(function( child: RTreeRectangle ){
						return searchRect.overlaps( child );
					})
					.map(( iterateNode: RTreeRectangle ) => {
						return this._recursiveSeach( searchRect, iterateNode );
					})
					.flatten()
					.value() as Array<RTreeRectangle>;
		}
		else {
			console.log( "* never entered" );
			return [];
		}
	}

	public search( searchBoundary: DataEntry ): Array<any>{
		var searchRect = new RTreeRectangle( searchBoundary.x, searchBoundary.y, searchBoundary.width, searchBoundary.height, null );
		return this._recursiveSeach( searchRect, this.root );
	}

	public insert( dataPoint: DataEntry ): void{
		var insertRect = new RTreeRectangle( dataPoint.x, dataPoint.y, dataPoint.width, dataPoint.height, dataPoint.data );

		var currentNode: RTreeRectangle = this.root;
		var path: Array<RTreeRectangle> = [ currentNode ];

		var level = 1;
		while( !currentNode.hasLeafNodes() && level < this.maxDepth ){
			level += 1;
			currentNode.growRectangleToFit( insertRect );

			var validSubNodes = _.filter( currentNode.children, function(node: RTreeRectangle): boolean {
				return node.overlaps( insertRect );
			});

			if( validSubNodes.length > 0 ){
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

		currentNode.insertChildRectangle( insertRect );
		this.balanceTreePath( path );
	}

	private _recursiveTreeLayer( listOfRectangles: Array<RTreeRectangle>, level = 1 ): Array<RTreeRectangle> {
		var numberOfParents =  Math.ceil(listOfRectangles.length / this.maxNodes);
		var nodeLevel: Array<RTreeRectangle> = [];
		
		for( var i=0; i<numberOfParents; i++){
			var parent = new RTreeRectangle(Infinity, Infinity, 0, 0, null);
			
			for( var y=0; y<this.maxNodes; y++){
				if( listOfRectangles.length > 0 ){
					parent.insertChildRectangle( listOfRectangles.pop() );
				} else {
					break;
				}
			}

			nodeLevel.push( parent );
		}

		nodeLevel.reverse();

		if( level == this.maxDepth - 1 ){
			// We have reached the max depth. The only option is to let the root node keep all these as child nodes
			var rootNode = new RTreeRectangle( Infinity, Infinity, 0, 0, null );
			_.forEach( nodeLevel, function( insertRect: RTreeRectangle ){
				rootNode.insertChildRectangle( insertRect );
			});

			return [ rootNode ];
		}
		else if( numberOfParents > 1 ){
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

		var maxCoordinate = _.chain( listOfRectangles )
							.map(function( rect: RTreeRectangle ){
								return Math.max( rect.x + rect.width*0.5, rect.y + rect.height*0.5 );
							})
							.thru( _.max )
							.value();
		
		var sorted = _.sortBy( listOfRectangles, function( rect: RTreeRectangle){
			return HilbertCurves.toHilbertCoordinates( maxCoordinate, rect.x + rect.width*0.5, rect.y + rect.height*0.5 );
		});

		listOfRectangles.length = 0;

		this.root = this._recursiveTreeLayer( sorted )[0];
	}

	private balanceTreePath( pathOfRectangles: Array<RTreeRectangle> ) {
		while( pathOfRectangles.length > 0 ){
			var currentNode = pathOfRectangles.pop();
			if( currentNode.numberOfChildren() <= this.maxNodes ){
				return; // the tree is valid
			}
			else if( currentNode != this.root ){
				var parentNode: RTreeRectangle = pathOfRectangles[ pathOfRectangles.length - 1 ];
				var replacementSiblings: Array<RTreeRectangle> = currentNode.splitIntoSiblings( );

				parentNode.children.splice(  _.indexOf( parentNode.children, currentNode ), 1 );

				_.forEach( replacementSiblings, ( insertRect: RTreeRectangle ) => {
					parentNode.insertChildRectangle( insertRect );
				});

			} 
			else if ( currentNode == this.root ){
				var replacementSiblings: Array<RTreeRectangle> = currentNode.splitIntoSiblings( );
				
				_.forEach( replacementSiblings, ( insertRect: RTreeRectangle ) => {
					currentNode.insertChildRectangle( insertRect );
				});
			}
		}
	}
}