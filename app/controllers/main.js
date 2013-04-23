var Class = require("../helpers/class"), 
	DEV = !(process.env.NODE_ENV == "production");

main = Class.extend({
	
	index: function(req, res){
		// logic...
		res.template = "main";
		res.view = "init";
		// render 
		//this.render(res);
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

main.prototype.render = function(res){
	//console.log( path.join(__dirname, '/views/'+res.template) );
	//res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
	res.render(res.view, null, function(err, result) {
		//console.log('Render result:', result);
		// compact output by removing carriage returns, tabs and extra whitespace
		var html = (DEV) ? result : result.replace(/(\r\n|\n|\r|\t)/gm,"").replace(/\s+/gm, " ");
		res.send(html); // send rendered HTML back to client
	});
}


module.exports = main;
