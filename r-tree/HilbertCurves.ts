module HilbertCurves{
	export function toHilbertCoordinates( maxCoordinate: number, x: number, y: number ): number{
		var r = maxCoordinate;
		var mask = (1 << r) - 1;
		var hodd = 0;
		var heven = x ^ y;
		var notx = ~x & mask;
		var noty = ~y & mask;

		var tmp = notx ^y;

		var v0 = 0;
		var v1 = 0;
		for( var k=1; k < r; k++ ){
			v1 = ((v1 & heven) | ((v0 ^ noty) & tmp)) >> 1;
			v0 = ((v0 & (v1 ^ notx)) | (~v0 & (v1 ^ noty))) >> 1;
		}
		hodd = (~v0 & (v1 ^ x)) | (v0 & (v1 ^ noty));

		return hilbertInterleaveBits(hodd, heven);
	}

	function hilbertInterleaveBits( odd: number, even:number ): number{
		var val = 0;
		var max = Math.max(odd, even);
		var n = 0;
		while (max > 0) {
			n++;
		  	max >>= 1;
		}

		for (var i = 0; i < n; i++) {
			var mask = 1 << i;
			var a = (even & mask) > 0 ? (1 << (2*i)) : 0;
			var b = (odd & mask) > 0 ? (1 << (2*i+1)) : 0;
			val += a + b;
		}

		return val;
	}
}