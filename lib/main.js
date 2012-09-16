var config = require('../config/app.js'), 
	fs = require('fs'), 
	app;
	
	
function init( server ){
	
	// save the server object
	app = server;
	
	//.. do something with the app
	
	// create requests
	setupRoutes();
	
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
		var path = findPath('controllers/'+name);
		var controller = require( path );
	} catch(e){
		var controller = require('../controllers/main');
	}
	return controller;
}

function hasMethod( controller, name ){
	return (typeof (controller.prototype[name]) == "function") ? controller.prototype[name] : controller.prototype.init;
}

// seek through all the available paths
function findPath( path ){
	return  '../'+ path;
}

exports.init = init;