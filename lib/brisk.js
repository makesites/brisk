// dependencies...
var express = require('express'), 
	fs = require('fs'), 
	path = require('path'), 
	_ = require("underscore");

var Site = function(){
		this.helpers = {};
		this.models = function(){
			
			var models = {};
			for( i in this.models ){
				models[i] = this.models[i].model;
			}
			return models;
			
		};
		this.config = require('../config/default');
};


Site.prototype.init = function( modules ){
	// fallback to an empty object if no modules are passed 
	modules || ( modules = {} );
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined( modules.app )) return;
	
	// merge with existing site obj
	this.modules = modules;
	
	// merge default config with given options
	loadConfig();
	
	// load the support files
	loadDir("helpers");
	loadDir("models");
	
	// resolve all the callback requests
	loadClasses();
	
	//.. do something with the app
	setupApp();
	
	// create requests
	setupRoutes();
	
}

// find the base class in brisk
Site.prototype.getClass = function( name ){
	var Class = require('../controllers/'+name);
	return Class;
}


// Utility functions
function loadConfig(){
	var root = site.modules.app.locals.root;
	var local = require( root +"/config/brisk");
	
	if( !_.isUndefined( local ) )
		site.config = _.extend(site.config, local);
	
}


function loadDir( name ){
	
	var root = site.modules.app.locals.root;
							
	var files = [];
	var dir = [];
	//
	dir['default'] = path.normalize( __dirname+'/../'+ name +'/' );
	dir['app'] = path.normalize(  root+'/app/'+ name +'/' );
	// get list
	try {
		files['default'] = fs.readdirSync( dir['default'] );
	} catch ( e ) {
		// output console log?
		files['default'] = false;
	}
	
	try {
		files['app'] = fs.readdirSync( dir['app'] );
	} catch ( e ) {
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
		if( typeof( lib.resolve == "function") ){
			lib.resolve("models", i);
		}
	}
	// then helpers
	for( i in site.helpers){
		var lib = site.helpers[i];
		if( typeof( lib.resolve == "function") ){
			lib.resolve("helpers", i);
		}
	}
	
	// stadard loop
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

function setupApp(){
	var app = site.modules.app;
	// load config file
	var config = require( app.locals.root +"/config/express")(app);
	
	for(env in config){
		if( env == "default" ){ 
			app.configure( parseAppConfig( config[env] ) );
		} else {
			app.configure(env, parseAppConfig( config[env] ) );
		}
			
	}
}

function parseAppConfig( env ){
	
	var app = site.modules.app;
	
	return function(){
		
				for( action in env ){
					var options = env[action];
					for( name in options ){
						if( action == "engine" || action == "set"){ 
							app[action](name, options[name]); 
						} else {
							// check if we are calling another obj
							if( name.indexOf(".") > 0 ){
								
								var Class = name.substring(0, name.indexOf("."));
								var method = name.substring(name.indexOf(".")+1);
									
								if( Class == "app" ){ 
									var obj = app;
								} else {
									var obj = site.helpers[Class].self();
								}
								
							} else {
								// fallback to the express obj
								var method = name;
								var obj = express;
							}
							
							var params = options[name];
							
							//console.log( name );
							
							if( params === true ){
								// call app action with the defined object method (using the right namespace)
								app[action].call(app, obj[method].call(obj) );		
							} else if( params === false ){ 
								// call app action with the defined object variable
								app[action].call(app, obj[method] );		
							} else {
								// convert params to array if necessary
								params = ( params instanceof Array ) ? params : [ params ];
								// call app action with the defined object method (using the right namespace) and include the parameters
								app[action].call(app, obj[method].apply(obj, params) );		
							}
							
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
	} catch(e){
		return false;
	}
	
	return new Class();
}

function hasMethod( controller, method ){
	return ( typeof controller[method] == "function") ? controller[method] : controller.index;
}

// seek through all the available paths
function findPath( dir ){
	var root = site.modules.app.locals.root;
	// first lookup the app folder
	var file = path.normalize( root +"/app/"+ dir ) +".js";
	
	if( fs.existsSync(file) ){
		return file;
	} else {
		// revert to the module folder
		//var file = path.normalize( __dirname + "/../"+ dir ) +".js";
		var file = path.normalize( '../'+ dir ) +".js";
		if( fs.existsSync(file) ){
			return file;
		}
	}
	/*fs.stat(file, function(error, stats){
		if (error) throw error;
  		//sys.puts('file:‘ + p1 + 'isFile = ' + stats.isFile());
		console.log( stats.isFile() );
	
	});*/
	// if nothing works... return false
	return false;
}

function parseParams( str ){
	
	var params = str.split('/');
	
	// return the array as is if one item
	if( params.length == 1) return params;
	
	var query = new Array();
	
	for(i in params){
		i = parseInt(i);
		
		if (i%2 == 0){
			var key = params[i];
		}
		if( typeof(params[i+1]) != "undefined" ){
			var value = params[i+1];
		}
		
		if( !_.isUndefined( value ) ){
			query[key] = value;
		} else {
			query.push(key);
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