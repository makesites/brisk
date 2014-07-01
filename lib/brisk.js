// dependencies...
var express = require('express'),
	fs = require('fs'),
	path = require('path'),
	_ = require("underscore"),
	root = path.join(__dirname, "../../../");

// #20 - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;

var Site = function(){
		this.helpers = {};
		// util method to list all models
		this.models = function(){

			var models = {};
			for( i in this.models ){
				models[i] = this.models[i].model;
			}
			return models;

		};
		this.config = this.loadConfig("brisk");
};

Site.prototype.init = function( modules ){
	// fallback to an empty object if no modules are passed
	modules || ( modules = {} );
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined( modules.app )) return;

	// merge with existing site obj
	this.modules = modules;

	// setup sessions
	// create a session store (default to memory store)
	this.sessions = this.modules.sessions || new express.session.MemoryStore( express );

	// #45 sniff directory structure
	this._files = lookupDirs();

	// load the support files
	loadDir("helpers");
	loadDir("models");

	// resolve all the callback requests
	loadClasses();

	//.. do something with the app
	setupApp();

	// execute async to respect the routes setup in helpers
	process.nextTick(function(){
		// create requests
		setupRoutes();
	});

}

// #45 - lookup a dir for brisk files...
Site.prototype.files = function( dir, files ){
	files = files || [];
	var search = fs.readdirSync( dir );
	for( var i in search ){
		var stat = fs.statSync( dir + search[i] )
		if( stat.isDirectory() ){
			//files = files.concat( this.files( dir + search[i] +"/", files ) );
			_.extend( files, this.files( dir + search[i] +"/", files ) );
		} else {
			files.push( dir + search[i] );
		}
	}
	// sort files to categories?
	//console.log("files", files );
	return files;
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
	var file = ( options.base ) ?  path.normalize( __dirname +'/../app/'+ name ) : findPath( name );

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
	return config;
}

// Utility functions
function loadDir( name ){

	var files = [];
	var dir = [];
	//
	dir['default'] = path.normalize( __dirname+'/../app/'+ name +'/' );
	dir['app'] = path.normalize(  root+'app/'+ name +'/' );

	// get list
	try {
		files['default'] = fs.readdirSync( dir['default'] );
	} catch( e ) {
		//
		if( DEV ) console.log( e );
		files['default'] = false;
	}

	try {
		files['app'] = fs.readdirSync( dir['app'] );
	} catch( e ) {
		//
		if( DEV ) console.log( e );
		files['app'] = false;
	}
	// load default files
	for(i in files['default']){
		//
		var file = files['default'][i];
		var lib = isLib( file );

		// don't process if not a js file
		if( !lib ) continue;
		// load only if there's no app overrideoverride
		if( !_.indexOf( files['app'], file ) ){
			site[name][lib] = include( dir['default'] + file);
		}
	}

	// load app files
	for(i in files['app']){
		//
		var file = files['app'][i];
		var lib = isLib( file );

		// don't process if not a js file
		if( !lib ) continue;
		site[name][lib] = include( dir['app'] + file);
	}

}

function loadClasses(){
	//
	// load models first
	for( i in site.models){
		var lib = site.models[i];
		if( typeof lib.resolve == "function" ){
			lib.resolve("models", i);
		}
	}
	// then helpers
	for( i in site.helpers){
		var lib = site.helpers[i];
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

function lookupDirs(){
	// load package info
	var dirs = [];
	var package = require( root +'package.json');
	// find modules
	for(var module in package.dependencies){
		if( module.search(/brisk\-/) === 0 ){
			var files = require( module ).files() || [];
			//_.extend( dirs, files );
			dirs = dirs.concat( files );
			//modules.push( module );
		}
	}
	var local = path.join(__dirname, "../");
	// lookup this dir
	dirs = dirs.concat( site.files( local +"app/" ) );
	// look up app dir
	dirs = dirs.concat( site.files( root +"app/" ) );
	//console.log( dirs );
	return dirs;

}

function setupApp(){
	var app = site.modules.app;

	// load config file
	// #21 - checking if express config exists
	//var file = path.normalize( site.config.root +"config/express ) +".js";
	var file = root +"config/express.js";
	if( !fs.existsSync(file) ) return;

	var config = require( root +"config/express")( site );
	var state = ( DEV ) ? "development" : "production";

	for(env in config){
		if( env == "default" || env == state){
			var middleware = parseAppConfig( config[env] );
			middleware();
		}
		// else do nothing?
	}

}

function parseAppConfig( env ){

	var app = site.modules.app;
	var helpers = site.helpers.express;
	var libs = {
		app : app,
		connect : require("connect")

	}

	return function(){

		for( action in env ){
			var options = env[action];
			// engine is one level deep...
			if( action == "engine" ){
				var engine = helpers.engine || function(){};
				app[action](options, engine);
				continue;
			}
			for( name in options ){
				if( action == "set"){
					app[action](name, options[name]);
				} else {
					// check if we are calling another obj
					if( name.indexOf(".") > 0 ){

						var Class = name.substring(0, name.indexOf("."));
						var method = name.substring(name.indexOf(".")+1);

						//if( Class == "app" ){
						if( libs.hasOwnProperty(Class) ){
							var obj = libs[Class];
						} else {
							var obj = site.helpers[Class].self();
						}

					// the only middle ware in the express namespace is 'static'
					} else if( name == "static" ) {
						var method = name;
						var obj = express;
					} else {
						// fallback to the express obj
						var method = name;
						var obj = helpers;
					}

					var params = options[name];
					var middleware;

					if( params === true ){
						// call app action with the defined object method (using the right namespace)
						middleware = obj[method].call(obj);
						app[action].call(app, middleware);
					} else if( params === false ){
						// call app action with the defined object variable
						middleware = obj[method];
						app[action].call(app, middleware);
					} else if( typeof params === "function" ){
						middleware = fn.call(obj, opt);
						app[action].call(app, params);
					} else if( params instanceof Array && typeof params[0] === "function" ){
						// _new_ unified method to load middleware...
						var fn = params[0];
						var opt = params[1] || {};
						middleware = fn.call(obj, opt);
						app[action].call(app, middleware);
					} else {
						// convert params to array if necessary
						params = ( params instanceof Array ) ? params : [ params ];
						// call app action with the defined object method (using the right namespace) and include the parameters
						middleware = obj[method].apply(obj, params);
						app[action].call(app, middleware );
					}

					// FIX: keep a reference to the cookieParser ( do you really need this? )
					if(method == "cookieParser") app.cookieParser = middleware;

				}

			}

		}

	}
}

function setupRoutes(){
	var app = site.modules.app;

	// Main route
	app.all('/', function(req, res){

		req.params.controller = "main";
		req.params.method = "index";

		processRequest(req, res);

	});

	app.all('/:controller', function(req, res){
		// method fallsback to index
		req.params.method = "index";

		processRequest(req, res);

	});

	app.all('/:controller/:method', function(req, res){
		// nothing to process - continue...
		processRequest(req, res);

	});

	app.all('/:controller/:method/*', function(req, res){

		// convention: the first item with no key is the remaining path
		var path = req.params[0];
		var params = parseParams( path );
		req.query = _.extend(req.query, params );

		processRequest(req, res);

	});

	/* 404 redirect fallback */
	app.get('*', function(req, res) {
		res.send('404 - no such page');
	});

}

function findController( name ){

	try{
		var controller = findPath('controllers/'+name);
		var Class = require( controller );
	} catch( e ){
		//
		if( DEV ) console.log("Controller not found: ", e );
		return false;
	}

	return new Class();
}

function hasMethod( controller, method ){
	// #39 skip all methods that start with underscore
	if( method.search(/_/) == 0 ) return false;
	return ( typeof controller[method] == "function") ? controller[method] : false;
}

// seek through all the available paths
function findPath( dir ){
	// better way for lookup?
	// all files are in the app subfolder?
	//var search = new RegExp("/app/"+ dir, "gi");
	var matches = [];
	// use file list to lookup the appropriate file
	for( var i in site._files ){
		var file = site._files[i];
		//if( search.test( file ) ) matches.push( file );
		if( file.search("/app/"+ dir) > -1 ) matches.push( file );
	}
	//console.log( matches );
	// loop through matches
	// - first priority is the app folder
	var app = path.normalize( root +"app/"+ dir ) +".js";
	if( matches.indexOf( app ) > -1){
		return app;
	}
	var module = new RegExp(root +"node_modules/(.+)/app/"+ dir +".js", "gi");
	for( var j in matches ){
		var match = matches[j];
		if( module.test( match ) ){
			return match;
			break;
		}
	}
	// - revert to the base folder
	var base = path.normalize( __dirname + '/../app/'+ dir ) +".js";
	if( matches.indexOf( base ) > -1){
		return base;
	}
	/*
	// first lookup the app folder
	var file = path.normalize( root +"app/"+ dir ) +".js";

	if( fs.existsSync(file) ){
		return file;
	} else {
		// revert to the base folder
		var file = path.normalize( __dirname + '/../app/'+ dir ) +".js";
		if( fs.existsSync(file) ){
			return file;
		}
	}
	*/
	/*fs.stat(file, function(error, stats){
		if (error) throw error;
		//sys.puts('file:‘ + p1 + 'isFile = ' + stats.isFile());
		console.log( stats.isFile() );

	});*/
	// if nothing works... return false
	return false;
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
	// use file list to lookup the appropriate file
	for( var i in site._files ){
		var file = site._files[i];
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
		if( match.search( root +"node_modules" ) > -1 && match.substr( match.lastIndexOf('/')+1 ) == name.substr( name.lastIndexOf('/')+1 ) ){
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

function parseParams( str ){

	var query = {},
	params = str.split('/');

	// #34 - if one item, assume it's a key
	if( params.length == 1) return { _key : params[0] };

	for(i in params){
		i = parseInt(i);
		/// (re)set variables
		var key = false,
			value = false;
		// loop through two items at a time...
		if (i%2 !== 0) continue;

		if (i%2 == 0){
			key = params[i];
		}
		if( typeof params[i+1] != "undefined" ){
			value = params[i+1];
		}

		if( key && value ){
			query[key] = value;
		} else if( key ){
			// the first non-value key becomes the "type" of data we're requesting
			query._type = key;
		} else {
			// having covered key pairs and single keys, is this even used?
			query[i] = key;
		}

	}

	return query;

}

function processRequest( req, res ){

	// add config options and modules
	req.site = site;

	var controller = findController( req.params.controller );

	if(!controller){
		// the controller name becomes the method...
		req.params.method = req.params.controller;
		req.params.controller = "main";
		//
		controller = findController( req.params.controller );

	}

	var method = hasMethod(controller, req.params.method);

	if(!method){
		// #34 move the method name to the query
		req.query = _.extend(req.query, { _key : req.params.method });
		// revert to the index (always available...)
		req.params.method = "index";
		//
		method = hasMethod(controller, req.params.method);

	}
	method.apply(controller, [req, res]);
}

// Helpers
// - check if a filename is a js file - return the name if it is
function isLib( file ){
	return (file.substr(-3) == ".js") ? file.substring(0, file.lastIndexOf('.') ) : false;
}

function include( file ) {

	var Class = require( file );

	var promise = new Promise(Class);

	promise.add(function(type, name){
		var Class = this;

		site[type][name] = new Class( site );

	});

	return promise;

}


function Promise (obj) {
	var args = null;
	var callbacks = [];
	var resolved = false;

	this.add = function(callback) {
		if (resolved) {
			callback.apply(obj, args);
		} else {
			callbacks.push(callback);
		}
	},

	this.resolve = function() {
		if (!resolved) {
			args = arguments;
			resolved = true;

			var callback;
			while (callback = callbacks.shift()) {
				callback.apply(obj, arguments);
			}

			callbacks = null;
		}
	}
};

var site = new Site();

module.exports = site;