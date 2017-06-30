var extend = require('extend');

function transformMap(arr, cb) {
	var resultantArray = extend(true, [], arr);

	for(var i = 0; i < resultantArray.length; i++) {
		var el = resultantArray[i];
		
		var result = cb(el, i, resultantArray);
		
		var defaults = {
			value: el,
			insertElements: [],
			appendElements: []
		};
		
		// You can pass in a bare value or as the `value` property of an object
		result = typeof result === 'object' ? result : { value: result };
		// Massage the result into shape
		result = extend({}, defaults, result);
		

		// Transform the current value
		resultantArray[i] = result.value ? result.value : result;
		
		// Insert after the current element
		var insertElements = [].concat(result.insertElements);
		if(insertElements.length > 0) {
			Array.prototype.splice.apply(resultantArray, [i+1, 0].concat(insertElements));
		}

		// Add the elements onto the end
		var appendElements = [].concat(result.appendElements);
		if(appendElements.length > 0) {
			resultantArray = resultantArray.concat(appendElements);
		}
	}

	return resultantArray;
}


module.exports = transformMap;