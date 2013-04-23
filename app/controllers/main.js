var Class = require("../helpers/class"), 
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
		//this.render(res);
	},
	
	render : function(req, res){
		
		// get authentication status
		res.locals({ authenticated : req.isAuthenticated() });
		// access the user session in the views 
		if( typeof req.user != "undefined" ){
			res.locals({ user : req.user });
		}
		//console.log( path.join(__dirname, '/views/'+res.template) );
		//res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
		res.render(res.view, null, function(err, result) {
			//console.log('Render result:', result);
			// compact output by removing carriage returns, tabs and extra whitespace
			var html = (this.options.debug) ? result : result.replace(/(\r\n|\n|\r|\t)/gm,"").replace(/\s+/gm, " ");
			res.send(html); // send rendered HTML back to client
		})
	}, 
    ensureAuthenticated: function(req, res, next) {
		if (req.isAuthenticated()) { return (next) ? next() : true; }
		// always redirect to the homepage if not authenticated (customize?)
		res.redirect('/');
		return false;
    },
	
    isAuthenticated: function(req, res) {
		return res.locals.authenticated || req.isAuthenticated();
    }
	
});


module.exports = main;
