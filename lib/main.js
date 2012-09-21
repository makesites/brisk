var config = require('../config/app.js'), 
	fs = require('fs'), 
	path = require('path'), 
	_ = require("underscore"), 
	modules = {}, 
	app;
	
	
function init( options ){
	// exit now if there's no app to attach brisk to...
	if(_.isUndefined(options.app )) return;
	
	// save the server object
	app = options.app;
	
	// merge default config with given options
	if( !_.isUndefined(options.config ) )
		config = _.extend(config, options.config);
	
	// merge default config with given options
	if( !_.isUndefined(options.modules ) )
		modules = _.extend(modules, options.modules);
	
	//.. do something with the app
	
	// create requests
	setupRoutes();
	
}

// find the base class in brisk
function getClass( name ){
	var c = require('../controllers/'+name);
	return c;
}

function setupRoutes(){
	
	// Main route
	app.get('/:controller', function(req, res){ 
		
		// index instead?
		req.params.method = "init";
		
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
		console.log(e);
		// fallback to the main controller 
		var Class = require('../controllers/main');
	}
	return Class;
}

function hasMethod( controller, name ){
	return (typeof (controller.prototype[name]) == "function") ? controller.prototype[name] : controller.prototype.init;
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
		modules: modules
	}
	
	var controller = findController( req.params.controller );
	var method = hasMethod(controller, req.params.method);
	
	method.call(this, req, res);
}


exports.init = init;
exports.config = config;
exports.modules = modules;
exports.getClass = getClass;