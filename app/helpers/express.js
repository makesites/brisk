var brisk = require("brisk"), 
	Parent = require("./class"),
	CORS = brisk.getLib("connect-xcors");

var helper = Parent.extend({
	
	//CORS middleware
	cors : function() {
		// load configuration 
		return CORS( brisk.loadConfig('cors') );
	}, 
	
	self: function() {
		return this.express;
	}, 
	
	session : function(req, res, next){
		//get authentication status
		res.locals.authenticated = req.isAuthenticated();
		// access the user session in the views 
		if( typeof req.user != "undefined" ){
			res.locals.user = req.user;
		}
		next();
	},
	
});


module.exports = helper;
