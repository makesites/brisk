var fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	utils = require('./utils');

// Local vars
//var root =  path.dirname(require.main.filename) +"/";
// - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;

var Router = function( site ){
	this.site = site;
}

Router.prototype.findController = function( name ){

	try{
		var controller = this.findPath('controllers/'+name);
		if( !controller ) return false;
		var Class = require( controller );
	} catch( e ){
		//
		if( DEV ) console.log("Controller not found: ", e );
		return false;
	}

	return new Class();
}

// seek through all the available paths
Router.prototype.findPath = function( dir, files ){
	// better way for lookup?
	// all files are in the app subfolder?
	//var search = new RegExp("/app/"+ dir, "gi");
	var matches = [];
	var root = this.site.config.root;
	files = files || this.site._files;
	// use file list to lookup the appropriate file
	for( var i in files ){
		var file = files[i];
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
	var localmodule = new RegExp(root +"node_modules/(.+)/app/"+ dir +".js", "gi");
	for( var j in matches ){
		var match = matches[j];
		if( localmodule.test( match ) ){
			return match;
			break;
		}
	}
	// - revert to the base folder
	var base = path.normalize( __dirname + '/../app/'+ dir ) +".js";
	if( matches.indexOf( base ) > -1){
		return base;
	}
	var baseRoot = path.normalize( __dirname + '/../../');
	// check if (root != baseRoot) before continuing?
	var globalmodule = new RegExp(baseRoot +"brisk(.+)/app/"+ dir +".js", "gi");
	for( var j in matches ){
		var match = matches[j];
		if( globalmodule.test( match ) ){
			return match;
			break;
		}
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


Router.prototype.hasMethod = function( controller, method ){
	// #39 skip all methods that start with underscore
	if( method.search(/_/) == 0 ) return false;
	// #49 skip all methods that are flaged as private
	var private = controller.options.private;
	if( private.indexOf( method ) > -1 ) return false;
	//var propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
	//console.log( propertyNames );
	return ( typeof controller[method] == "function") ? controller[method] : false;
}


Router.prototype.parseParams = function( str ){

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
			// edge case: the key is an id and the value is the last param
			if( (typeof params[i+2] == "undefined") && utils.isKey( key ) ){
				query._key = key;
				query._type = value;
			} else {
				query[key] = value;
			}
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

Router.prototype.processRequest = function( req, res ){

	// add config options and modules
	req.site = this.site;

	var original = {
		controller: req.params.controller,
		method: req.params.method
	};
	var controller = this.findController( req.params.controller );

	if(!controller){
		// move the method name to the query
		req.query = _.extend(req.query, { _key : req.params.method });
		// the controller name becomes the method...
		req.params.method = req.params.controller;
		req.params.controller = "main";
		//
		controller = this.findController( req.params.controller );

	}

	var method = this.hasMethod(controller, req.params.method);

	if(!method){
		// #34 move the method name to the query
		req.query = _.extend(req.query, { _key : req.params.method });
		// revert to the index (always available...)
		req.params.method = "index";
		//
		method = this.hasMethod(controller, req.params.method);

	}
	// final check to display 404 page
	if(req.params.controller == "main" && req.params.method == "index" && original.controller !== "main" ){
		req.params.method == "_404";
		method = controller._404;
	}
	// execute
	method.apply(controller, [req, res]);
}


Router.prototype.setupRoutes = function(){
	var app = this.site.modules.app;
	var self = this;

	// Main route
	app.all('/', function(req, res){

		req.params.controller = "main";
		req.params.method = "index";

		self.processRequest(req, res);

	});

	app.all('/:controller', function(req, res){
		// method fallsback to index
		req.params.method = "index";

		self.processRequest(req, res);

	});

	app.all('/:controller/:method', function(req, res){
		//
		req.query = req.query || {};
		self.processRequest(req, res);

	});

	app.all('/:controller/:method/*', function(req, res){

		// convention: the first item with no key is the remaining path
		var path = req.params[0];
		var params = self.parseParams( path );
		req.query = _.extend(req.query, params );

		self.processRequest(req, res);

	});

	/* 404 redirect fallback */
	app.all('*', function(req, res) {
		req.params.controller = "main";
		req.params.method = "_404";
		self.processRequest(req, res);
	});

}

module.exports = Router;
