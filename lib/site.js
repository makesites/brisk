// dependencies...
var fs = require('fs'),
	path = require('path'),
	_ = require("underscore"),
	Server = require('./server'),
	files = require('./files'),
	Router = require('./router'),
	utils = require('./utils');

var Site = function( options ){
	// fallbacks
	options || ( options = {} );

	// FIX: strictly define app root
	this.root = ( options.root ) ? options.root : path.dirname(require.main.filename) +"/";

	// load config
	this.config = this.loadConfig("brisk");
	this.config.root = this.root;

};


// load the configuration (merging default and local values)
Site.prototype.loadConfig = function( name ){
	var config = {};
	var root = this.root;
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

Site.prototype.loadClasses = function( site ){
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


module.exports = Site;
