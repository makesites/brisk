var config = require('../config/app.js'), 
	fs = require('fs'), 
	path = require('path'), 
	_ = require("underscore"), 
	site = {
		helpers: {},
		models: {}
	}, 
	app;

function init( server, options ){
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined(server )) return;
	
	// save the express object
	app = server;
	
	// merge default config with given options
	if( !_.isUndefined(options ) )
		config = _.extend(config, options);
	
	// load the support files
	loadDir("helpers");
	loadDir("models");
	
	//.. do something with the app
	
	// create requests
	setupRoutes();
	
	// resolve all the callback requests
	loadClasses();
	
}

// find the base class in brisk
function getClass( name ){
	var Class = require('../controllers/'+name);
	return Class;
}

function loadDir( name ){
	
	var files = [];
	var dir = [];
	//
	dir['default'] = path.normalize( __dirname+'/../'+ name +'/' );
	dir['app'] = path.normalize(  config.root+'app/'+ name +'/' );
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


function setupRoutes(){
	
	// Main route
	app.get('/', function(req, res){ 
		
		req.params.controller = "main";
		req.params.method = "index";
		
		processRequest(req, res);
		
	});
	
	app.get('/:controller', function(req, res){ 
		
		// index instead?
		req.params.method = "index";
		
		processRequest(req, res);
		
	});
	
	app.get('/:controller/:method', function(req, res){ 
		// nothing to process - continue...
		processRequest(req, res);
		
	});
	
	app.get('/:controller/:method/*', function(req, res){ 
		
		// convention: the first item with no key is the remaining path
		var path = req.params[0];
		var params = parseParams( path );
		req.query = _.extend(req.query, params );
	
		processRequest(req, res);
		
	});
	
}

function findController( name ){
	try{ 
		var controller = findPath('controllers/'+name);
		var Class = require( controller );
	} catch(e){
		//console.log(e);
		// fallback to the main controller 
		var Class = require('../controllers/main');
	}
	return Class;
}

function hasMethod( controller, name ){
	//console.log(controller);
	return (typeof (controller.prototype[name]) == "function") ? controller.prototype[name] : controller.prototype.index;
}

// seek through all the available paths
function findPath( dir ){
	// first lookup the app folder
	var file = path.normalize( config.root +"app/"+ dir ) +".js";
	
	if( path.existsSync(file) ){
		return file;
	} else {
		// revert to the module folder
		//var file = path.normalize( __dirname + "/../"+ dir ) +".js";
		var file = path.normalize( '../'+ dir ) +".js";
		if( path.existsSync(file) ){
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
	req.site = {
		config: config,
		helpers: site.helpers
	}
	
	var controller = findController( req.params.controller );
	var method = hasMethod(controller, req.params.method);
	
	method.call(this, req, res);
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
		// consider defining this only once
		var options = {
			config: config,
			helpers: site.helpers, 
			models: site.models, 
			getClass: getClass
		}
		
		site[type][name] = new Class( options );
		
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
    
	
exports.init = init;
exports.config = config;
exports.helpers = site.helpers;
exports.models = site.models;
exports.getClass = getClass;