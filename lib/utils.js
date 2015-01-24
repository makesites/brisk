

var utils = {
	// check if a string is an id
	isKey: function( key ){
		// we're looking for numbers and strings scrambled.
		var last_char, changes = 0;
		for( var i in key ){
			var type = ( isNaN( key[i] ) ) ? 'string' : 'number';
			if( last_char !== type ){
				last_char = type;
				changes++;
			}
			// exit as soon as possible
			if( changes > 3 ) break;
		}
		return (changes > 3);
	}
};

module.exports = utils;