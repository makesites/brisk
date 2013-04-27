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
        this.isPrivate("render", req, res);
        //
        var self = this;
        // template vars
		res.locals.site = brisk.loadConfig('site'); 
		// get authentication status
		res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
		// access the user session in the views 
		res.locals.user = res.locals.user || ( ( typeof req.user != "undefined" ) ? req.user : false );
		/*
		if( typeof req.user != "undefined" ){
			res.locals({ user : req.user });
		}
		*/
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
	}, 
    
    rest : function( methods, req, res ){
	    // this is a private method - no direct requests are allowed
        this.isPrivate('rest', req, res );
        // most controllers will only require GET requests to be accepted 
        // explicitly define the support of other methods by adding the additional CRUD helpers
        // in this.rest({ get, post, update, del },
        //
        switch( req.method ){
            
            case "GET":
                return (methods.get) ? methods.get.call(this, req, res) : res.end();
            break;
            case "POST":
                return (methods.post) ? methods.post.call(this, req, res) : res.end();
            break;
            case "UPDATE":
                return (methods.update) ? methods.update.call(this, req, res) : res.end();
            break;
            case "DELETE":
                return (methods.del) ? methods.del.call(this, req, res) : res.end();
            break;
            default: 
                // all other requests just redirect to the homepage
                return res.redirect('/');
            break;
            
        }
        
    }
	
});

// Helpers

main.prototype.isPrivate = function(fn, req, res) {
    return (req.params.method == fn || req.params.method == "isPrivate") ? res.end() : true;  
}

main.prototype.ensureAuthenticated = function(req, res, next) {
    // this is a private method - no direct requests are allowed
    this.isPrivate("ensureAuthenticated", req, res);
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
    this.isPrivate("isAuthenticated", req, res);
    //
    res.locals.authenticated = res.locals.authenticated || req.isAuthenticated();
    return res.locals.authenticated;
};


module.exports = main;
