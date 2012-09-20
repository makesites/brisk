var config = require('../config/app.js'), 
	fs = require('fs'), 
	path = require('path'), 
	_ = require("underscore"), 
	app;
	
	
function init( server,  options ){
	
	// merge default config with given options
	config = _.extend(config, options);
	
	// save the server object
	app = server;
	
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
	app.get('/:controller/:method', function(req, res){ 
		var controller = findController( req.params.controller );
		var method = hasMethod(controller, req.params.method);
		method.call(this, req, res);
		//res.send( req.params.controller );
		
		/*res.render('index', {
			locals: {
				title: config.name
			}
		});*/
	});
	
}

function findController( name ){
	try{ 
		var controller = findPath('controllers/'+name);
		console.log( controller );
		var Class = require( controller );
	} catch(e){
		console.log(e);
		// fallback to the main controller 
		var controller = require('../controllers/main');
	}
	return Class;
}

function hasMethod( controller, name ){
	return (typeof (controller.prototype[name]) == "function") ? controller.prototype[name] : controller.prototype.init;
}

// seek through all the available paths
function findPath( dir ){
	// first lookup the app folder
	//var file = path.normalize( __dirname + "/../"+ dir ) +".js";
	var file = path.normalize( config.root +"app/"+ dir ) +".js";
	if( path.existsSync(file) ){
		return file;
	} else {
		// revert to the module folder
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

exports.init = init;
exports.config = config;
exports.getClass = getClass;