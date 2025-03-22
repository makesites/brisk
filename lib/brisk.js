// dependencies...
var fs = require('fs'),
	path = require('path'),
	_ = require("underscore"),
	root = path.dirname(require.main.filename) +"/",
	Server = require('./server'),
	files = require('./files'),
	Router = require('./router'),
	utils = require('./utils');

// #20 - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;

var Site = function(){
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

Site.prototype.init = function( modules, options ){
	var self = this;
	// fallback to an empty object if no modules are passed
	modules || ( modules = {} );
	options || ( options = {} );
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined( modules.app )) return;
	// FIX: strictly define app root
	if( options.root ){
		root = options.root;
	}
	// load config
	this.config = this.loadConfig("brisk");
	this.config.root = root;

	// init
	this.router = new Router( this );
	this.server = new Server( this );
	// merge with existing site obj
	this.modules = modules;

	// setup sessions
	// create a session store (default to memory store)
	//this.sessions = this.modules.sessions || new express.session.MemoryStore( express );
	this.sessions = this.modules.sessions || false;

	// #45 sniff directory structure
	this._files = files.lookupDirs({ root: root });

	// load the support files
	this.models = files.loadDir("models", this);
	this.helpers = files.loadDir("helpers", this);

	// resolve all the callback requests
	this.loadClasses();

	//.. do something with the app
	this.server.setup();

	// execute async to respect the routes setup in helpers
	process.nextTick(function(){
		// create requests
		self.router.setupRoutes();
	});

}

// #45 - lookup a dir for brisk files...
/*
Site.prototype.files = function( dir, files ){
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
Site.prototype.files = function( dir, data ){
	return files.loadFiles( dir, data );
};

// #26 - type specific inheritance
Site.prototype.getController = function( name ){
	var Class = this.getClass("controllers/"+ name);
	return Class;
}

Site.prototype.getModel = function( name ){
	var Class = this.getClass("models/"+ name);
	return Class;
}

Site.prototype.getBaseController = function( name ){
	var Class = this.getClass("controllers/"+ name, { base : true });
	return Class;
}

Site.prototype.getBaseModel = function( name ){
	var Class = this.getClass("models/"+ name, { base : true });
	return Class;
}

// find the base class
Site.prototype.getClass = function( name, options ){
	// fallback
	options = options || {};
	// condition if we're limiting the search in the base folder
	var file = ( options.base ) ?  path.normalize( __dirname +'/../app/'+ name ) : this.router.findPath( name, this.files );

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
Site.prototype.getLib = function( name ){
	var Lib = require( name );
	return Lib;
}

Site.prototype.getHelper = function( name ){
	var Helper = require( path.join(__dirname, "../", "app/helpers/"+ name) );
	return Helper;
}


// load the configuration (merging default and local values)
Site.prototype.loadConfig = function( name ){
	var config = {};
	// initialize data in a config class constructor....
	if(!this._configData) this._configData = {};
	// FIX: in case we wanted to get, do that
	if( name in this._configData) return this._configData[ name ];
	//
	// get default config
	if( fs.existsSync( path.join(__dirname, "../", "config/"+ name +".js") ) ){
		var defaults = require( "../config/"+ name );
		config = _.extend(config, defaults);
	}
	// get local config
	if( fs.existsSync(root +"config/"+ name +".js") ){
		var local = require( root +"config/"+ name);
		config = _.extend(config, local);
	}
	// save the config data for later use
	this._configData[ name ] = config;

	return config;
}

// return configuration data
Site.prototype.getConfig = function( name ){
	if( name in this._configData) return this._configData[ name ];
	// otherwise load the config from disk
	return this.loadConfig( name );
}

// Utility functions

Site.prototype.loadClasses = function(){
	//
	// load models first
	for( i in this.models){
		var lib = this.models[i];
		if( typeof lib.resolve == "function" ){
			lib.resolve("models", i);
		}
	}
	// then helpers
	for( i in this.helpers){
		var lib = this.helpers[i];
		if( typeof lib.resolve == "function" ){
			lib.resolve("helpers", i);
		}
	}

	// standard loop
	/*
	for(i in site){
		var libs = site[i];
		for( j in libs){
			var lib = libs[j];
			if( typeof( lib.resolve == "function") ){
				lib.resolve(i, j);
			}
		}
	}
	*/
}

Site.prototype.findView = function( name ){
	return this._findFile( "app/views/"+ name );
}

Site.prototype.findLayout = function( name ){
	var file = name;
	// use path defined in config (if set)
	var dir = ( this.config.paths.layout && this.config.paths.layout !== true ) ? this.config.paths.layout : "layouts/";
	var layout = this._findFile( "app/"+ dir + file );
	// fallback to the default layout
	if( !layout && layout !== 'default' ){
		file = "default";
		layout = this._findFile( "app/"+ dir+ file );
	}
	// FIX: layouts only work  with relative paths?
	// if no layout fallback to the views folder...
	return ( layout ) ? "../"+ dir + file : name;
}

Site.prototype._findFile = function( name ){
	//
	var matches = [];
	var root = this.config.root;

	// use file list to lookup the appropriate file
	for( var i in this._files ){
		var file = this._files[i];
		//if( search.test( file ) ) {
		if( file.search(name) > -1 ){
			// remove the extension of the file
			matches.push( file.substr(0, file.lastIndexOf('.')) );
		}
	}
	//console.log( matches );
	// loop through matches
	// - first priority is the app folder
	var app = path.normalize( root + name );
	if( matches.indexOf( app ) > -1){
		return app;
	}
	//var module = new RegExp(root +"node_modules/(.+)/"+ name, "gi");
	for( var j in matches ){
		var match = matches[j];
		// expect the exact file name
		//if( module.test( match ) && filename == name ){
		// disabling check of root, when used add global scope as well
		//if( match.search( root +"node_modules" ) > -1 &&
		if( match.substr( match.lastIndexOf('/')+1 ) == name.substr( name.lastIndexOf('/')+1 ) ){
			return match;
			break;
		}
	}
	// - revert to the base folder
	var base = path.normalize( __dirname + '/../'+ name );
	if( matches.indexOf( base ) > -1){
		return base;
	}

	return false;
}


// Helpers

module.exports = (function(){

	var site = new Site();
	return site;

})();
