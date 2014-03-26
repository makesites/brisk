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
		// this is a private method - no direct requests are allowed
		this.isPrivate(req, res, "render");
		//
		var self = this;
		// template vars
		res.locals = res.locals || {};
		res.locals.site = brisk.loadConfig('site');
		res.locals.debug = this.options.debug;
		// get authentication status
		res.locals.authenticated = res.locals.authenticated || this.isAuthenticated( req, res );
		// access the user session in the views
		res.locals.user = res.locals.user || ( ( typeof req.user != "undefined" ) ? req.user : false );
		// #43 access the view name during render
		res.locals.page = res.view;
		/*
		if( typeof req.user != "undefined" ){
			res.locals({ user : req.user });
		}
		*/
		// find the right view
		var view = brisk.findView( res.view || "default" );

		//console.log( path.join(__dirname, '/views/'+res.template) );
		//res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
		// #37 passing options to render
		var options =  res.options || {};
		// set default layout
		if( options.layout === false || typeof options.layout == "undefined" ){
			// do nothing...
		} else {
			var layout = options.layout || this.name || 'default';
			options.layout = brisk.findLayout( layout );
		}
		res.render(view, options, function(err, result) {
			//console.log('Render result:', result);
			// compact output by removing carriage returns, tabs and extra whitespace
			var html = (self.options.debug) ? result : result.replace(/(\r\n|\n|\r|\t)/gm,"").replace(/\s+/gm, " ");
			res.send(html); // send rendered HTML back to client
		})
	},

	logout: function(req, res){
		req.logOut();
		res.redirect('/');
	},

	rest : function( methods, req, res ){
		// this is a private method - no direct requests are allowed
		this.isPrivate(req, res, "rest");
		// most controllers will only require GET requests to be accepted
		// explicitly define the support of other methods by adding the additional CRUD helpers
		// in this.rest({ get, post, update, del },
		//
		var self = this;
		// authentication container
		res.auth = res.auth || [];

		switch( req.method ){

			case "GET":
				// exit now if no method defined
				if ( !methods.read ) return res.end();
				// authenticate if needed
				if ( res.auth.indexOf("get") > -1 ){
					return  this.ensureAuthenticated(req, res, function(){
						methods.read.call(self, req, res);
					});
				} else {
					// move straight to the method
					methods.read.call(self, req, res);
				}

			break;
			case "POST":

				// exit now if no method defined
				if ( !methods.create ) return res.end();
				// authenticate if needed
				if ( res.auth.indexOf("post") > -1 ){
					return  this.ensureAuthenticated(req, res, function(){
						methods.create.call(self, req, res);
					});
				} else {
					// move straight to the method
					methods.create.call(self, req, res);
				}

			break;
			case "PUT":

				// exit now if no method defined
				if ( !methods.update ) return res.end();
				// authenticate if needed
				if ( res.auth.indexOf("put") > -1 ){
					return  this.ensureAuthenticated(req, res, function(){
						methods.update.call(self, req, res);
					});
				} else {
					// move straight to the method
					methods.update.call(self, req, res);
				}

			break;
			case "DELETE":

				// exit now if no method defined
				if ( !methods.del ) return res.end();
				// authenticate if needed
				if ( res.auth.indexOf("delete") > -1 ){
					return  this.ensureAuthenticated(req, res, function(){
						methods.del.call(self, req, res);
					});
				} else {
					// move straight to the method
					methods.del.call(self, req, res);
				}

			break;
			default:
				// all other requests just redirect to the homepage
				return res.redirect('/');
			break;

		}

	}

});

// Helpers

main.prototype.isPrivate = function(req, res, fn) {
	return ( req.params.method == fn || req.params.method == "isPrivate" ) ? res.end() : true;
}

main.prototype.ensureAuthenticated = function(req, res, next) {
	// this is a private method - no direct requests are allowed
	this.isPrivate(req, res, "ensureAuthenticated");
	// get local vars
	res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
	res.locals.user = res.locals.user || ( ( typeof req.user != "undefined" ) ? req.user : false );
	// set local vars
	var authenticated = res.locals.authenticated;
	var user = res.locals.user;
	// always redirect to the homepage if not authenticated (customize?)
	if( !authenticated || !user ) return res.redirect('/');
	// otherwise call callback if available...
	return (next) ? next() : true;
};

main.prototype.isAuthenticated = function(req, res) {
	// this is a private method - no direct requests are allowed
	this.isPrivate(req, res, "isAuthenticated");
	// if authenticated flag already set, just use that
	if( res.locals.authenticated ){
		return res.locals.authenticated;
	} else if(req.isAuthenticated instanceof Function) {
		return req.isAuthenticated();
	} else {
		return false;
	}

};


module.exports = main;
