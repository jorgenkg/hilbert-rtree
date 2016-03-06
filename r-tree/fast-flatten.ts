var fastFlattenArray = function( arr: Array<any> ): Array<any>{
  for (var i = 0; i < arr.length; ++i) {
    if (Array.isArray(arr[i])) {
      arr[i].splice(0, 0, i, 1);
      Array.prototype.splice.apply(arr, arr[i]);
      --i;
    }
  }

  return arr;
}