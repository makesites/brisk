// dependencies...
var fs = require('fs'),
	path = require('path'),
	_ = require("underscore"),
	Server = require('./server'),
	Site = require('./site'),
	files = require('./files'),
	Router = require('./router'),
	utils = require('./utils');

// #20 - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;



var Brisk = function(){
	// setup containers
	this.helpers = {};
	// util method to list all models
	this.models = function(){

		var models = {};
		for( i in this.models ){
			models[i] = this.models[i].model;
		}
		return models;

	};
	// FIX: too early to load config
	//this.config = this.loadConfig("brisk");

	return this;

};

Brisk.prototype.init = function( modules, options ){
	var self = this;
	// fallback to an empty object if no modules are passed
	modules || ( modules = {} );
	options || ( options = {} );
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined( modules.app )) return;

	var site = new Site( options );

	this.config = site.config;
	// init
	this.router = site.router = new Router( site );
	this.server = site.server = new Server( site );
	// merge with existing site obj
	this.modules = site.modules = modules;

	// setup sessions
	// create a session store (default to memory store)
	//this.sessions = this.modules.sessions || new express.session.MemoryStore( express );
	site.sessions = site.modules.sessions || false;

	// #45 sniff directory structure
	this._files = site._files = files.lookupDirs({ root: site.config.root });

	// load the support files
	site.models = files.loadDir("models", site);
	this.models = site.models; //Object.create( this.models);
	site.helpers = files.loadDir("helpers", site);
	this.helpers = site.helpers; //Object.create( this.helpers );

	// resolve all the callback requests
	site.loadClasses();

	//.. do something with the app
	site.server.setup();

	// execute async to respect the routes setup in helpers
	process.nextTick(function(){
		// create requests
		site.router.setupRoutes();
	});

	return site;

}

// #45 - lookup a dir for brisk files...
/*
Brisk.prototype.files = function( dir, files ){
	files = files || [];
	var search = fs.readdirSync( dir );
	for( var i in search ){
		var file = search[i];
		// exclude certain files
		if( file == ".DS_Store" ) continue;
		var stat = fs.statSync( dir + file );
		if( stat.isDirectory() ){
			_.extend( files, this.files( dir + file +"/", files ) );
		} else {
			files.push( dir + file );
		}
	}
	// sort files to categories?
	//console.log("files", files );
	return files;
};
*/
Brisk.prototype.files = function( dir, data ){
	return files.loadFiles( dir, data );
};

// #26 - type specific inheritance
Brisk.prototype.getController = function( name ){
	var Class = this.getClass("controllers/"+ name);
	return Class;
}

Brisk.prototype.getModel = function( name ){
	var Class = this.getClass("models/"+ name);
	return Class;
}

Brisk.prototype.getBaseController = function( name ){
	var Class = this.getClass("controllers/"+ name, { base : true });
	return Class;
}

Brisk.prototype.getBaseModel = function( name ){
	var Class = this.getClass("models/"+ name, { base : true });
	return Class;
}

// find the base class
Brisk.prototype.getClass = function( name, options ){
	// fallback
	options = options || {};
	name = name || "helpers/class";
	// support legacy use of this method
	if( name == "main" ) name = "helpers/class";

	// condition if we're limiting the search in the base folder
	var file = ( options.base ) ?  path.normalize( __dirname +'/../app/'+ name ) : this.router.findPath( name, this._files ); // or: this.files( dir, data )

	if( file ){
		var Class = require( file );
		return Class;
	} else {
		// backwards comparibility with v0.0.x
		var Class = require('../app/controllers/'+name);
		return Class;
	}
}

// return one of the dependencies back to the app
Brisk.prototype.getLib = function( name ){
	var Lib = require( name );
	return Lib;
}

Brisk.prototype.getHelper = function( name ){
	var Helper = require( path.join(__dirname, "../", "app/helpers/"+ name) );
	return Helper;
}



// Helpers

module.exports = (function(){

	var brisk = new Brisk();
	return brisk;

})();
