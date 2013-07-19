var Main = require("../helpers/class");

var model = Main.extend({
	init: function( site ){
		// db
		this.db = site.modules.db;

	},

	schema : function(){
		return {}
	},

	get: function( key ) {

		return (typeof this.data[key] != "undefined") ? this.data[key] : null;

	},
	set: function( data ) {

		for( var i in data ){
			// only update the model with set values
			if(typeof this.data[i] != "undefined"){
				this.data[i] = data[i]; // clean up the data first?
			}
		}

	},
	create: function( data, callback ) {

	},
	read: function( data, callback, options ) {

	},
	update: function( data, callback ) {

	},
	delete: function( data, callback ) {

	}

});

module.exports = model;