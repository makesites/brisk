// Data Controller - outputs data in json form for the client

// base class
var Parent = require('brisk').getBaseController("data");

var controller = Parent.extend({

	init: function(req, res){
		// ...
	},

	index: function(req, res){
		res.data = {};
		// get user (with fallback)
		for( var i in req.user ){
			// filter data
			// - will never need the password on the client
			if( i == "password" ) continue;
			res.data[i] = req.user[i];
		}
		// authentication flag
		res.data.auth = this.isAuthenticated(req, res);
		//
		this.render(req, res);
	}

});

// helpers


module.exports = controller;
