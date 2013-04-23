// Data Controller - outputs data in json form for the client 

// base class
var Parent = require('brisk').getBaseController("main");

var controller = Parent.extend({
	
	init: function(req, res){
		// ...
		res.end();
	}, 
	
	render : function( res ){ 
		var json = JSON.stringify( ( res.data || {} ) ); 
		// validate the data before output... 
		return res.send( json ); 
	}

});

// helpers

module.exports = controller;
