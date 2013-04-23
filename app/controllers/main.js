var brisk = require("brisk"), 
	Class = require("../helpers/class"), 
	DEV = !(process.env.NODE_ENV == "production");

main = Class.extend({
	// defaults
	options: {
		debug : DEV
	}, 
	
	index: function(req, res){
		// logic...
		res.template = "main";
		res.view = "init";
		// render 
		this.render(req, res);
	},
	
	render : function(req, res){
		var self = this;
		// template vars
		res.locals.site = brisk.loadConfig('site'); 
		// get authentication status
		res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
		// access the user session in the views 
		if( typeof req.user != "undefined" ){
			res.locals({ user : req.user });
		}
		//console.log( path.join(__dirname, '/views/'+res.template) );
		//res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
		res.render(res.view, null, function(err, result) {
			//console.log('Render result:', result);
			// compact output by removing carriage returns, tabs and extra whitespace
			var html = (self.options.debug) ? result : result.replace(/(\r\n|\n|\r|\t)/gm,"").replace(/\s+/gm, " ");
			res.send(html); // send rendered HTML back to client
		})
	}, 
	
	logout: function(req, res){
		req.logOut();
		res.redirect('/');
	}
	
});

// Helpers

main.prototype.ensureAuthenticated = function(req, res, next) {
	res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
	if ( res.locals.authenticated ) { return (next) ? next() : true; }
	// always redirect to the homepage if not authenticated (customize?)
	res.redirect('/');
	return false;
};

main.prototype.isAuthenticated = function(req, res) {
	res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
	return res.locals.authenticated;
};

module.exports = main;
