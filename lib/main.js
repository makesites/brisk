var config = require('../config/app.js'), 
	fs = require('fs'), 
	OAuth = require('oauth').OAuth,
	crudr = require('crudr'), 
	app, io, aws;
	//io = require('socket.io').listen(app);
	
	
	
function init( server ){
	
	// save the server object
	app = server;
	
	// connect with AWS SimpleDB 
	aws = connectAWS();
	
	// setup options
	options = config.crudr;
	options.db = aws;
	
	// initialize crudr
	io = crudr.listen(app, options);
	
	// create requests
	setupRoutes();
	
}
	
	
function setupRoutes(){
		
	// Index Route
	app.get('/', function(req, res){ 
		res.render('index', {
			locals: {
				title: config.name
			}
		});
	});
	
	// About page
	app.get('/about', function(req, res){ 
		res.render('about', {
			locals: {
				title: config.name
			}
		});
	});

}

function connectAWS(){
	
	return require("aws-lib").createSimpleDBClient(
	  config.aws.key,
	  config.aws.secret,
	  // You can optionally provide a hash of service endpoints,
	  // but they each have reasonable defaults (typically US-East-1).
	  {
		'host': 'sdb.us-west-1.amazonaws.com',
	  }
	);
}


exports.init = init;