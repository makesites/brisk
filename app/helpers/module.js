var brisk = require("brisk"),
	path = require('path'),
	Parent = require("./class");

var helper = Parent.extend({

	dir: __dirname,

	init: function(){
	},

	// return files for module
	files : function() {
		// load configuration
		var dir = path.join( this.dir, "../app/");
		return brisk.files( dir );
	},

	self: function() {
		//return this.express;
	}

});


module.exports = helper;
