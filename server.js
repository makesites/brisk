// Include important JS helpers
//require( __dirname +'/helpers.js');

var express = require('express'), // Include express engine
	config = require( __dirname +'/config/app.js'), // create node server
	app = express.createServer(), // create node server
	site = require('./lib/main'); 
	
// Default APP Configuration
app.configure(function(){
  app.use(express.methodOverride());
  //app.use(express.bodyParser());
  app.use(express.logger());
  app.use(app.router);
});

app.configure('development', function(){
   app.use(express.static(__dirname + '/public'));
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});


// server app
app.get( "/", function(req, res){ 
	// just send out the one page app
	res.sendfile( __dirname + '/public/index.html');
});


// Listen on this port
app.listen(config.port); 

// start the site
site.init( app );