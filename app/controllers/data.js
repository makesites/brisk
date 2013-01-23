// outputs data in json form for the client 

var site = require('brisk');
// base class
var Main = site.getClass("main");

var data = Main.extend({
	init: function(req, res){
		// ...
		res.end();
	}, 
	
});


module.exports = data;
