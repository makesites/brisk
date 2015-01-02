var Main = require('../helpers/class'),
	crypto = require('crypto');

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
	"delete": function( data, callback ) {

	},

	// return complete data of an array
	each: function(data, callback){

		// if no key is defined, assume it's the id
		for( var i in data ){
			if(typeof data[i] == "string") data[i] = { id : data[i] };
		}
		var query = { $or: data };

		// execute query
		this.find(query, callback);

	},

	// Helpers
	createCID: function(){
		var now = (new Date()).getTime();
		var random = Math.floor(Math.random() * 1000000000);
		var seed = parseInt( now + random ).toString(36).toLowerCase();
		var id = crypto.createHash('md5').update( seed ).digest("hex");
		return id;
	},

	// delete certain properties from models
	filterData: function(data, properties){
		// fallbacks
		data = data || {};
		properties = properties || [];
		//
		for( var i in properties){
			delete data[ properties[i] ];
		}
		return data;
	},

	// hide id and use cid for public queries
	normalID: function( data ){
		// fallbacks
		data = data || {};
		//
		if( data.cid ){
			data.id = data.cid;
			delete data.cid;
		}
		return data;
	}

});

module.exports = model;