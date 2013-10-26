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

	get: function( dir ) {
		var module = path.join( this.dir, '../app/', dir );
		return require( module );
	},

	getController: function( controller ) {
		return this.get("controllers/"+ controller );
	},

	getHelper: function( helper ) {
		return this.get("helpers/"+ helper );
	},

	getModel: function( model ) {
		return this.get("models/"+ model );
	},

	getView: function( view ) {
		return this.get("views/"+ view );
	},

	self: function() {
		//return this.express;
	}

});


module.exports = helper;
