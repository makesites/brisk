var Class = require("../helpers/class"), 
	DEV = !(process.env.NODE_ENV == "production");

main = Class.extend({
  index: function(req, res){
		// db initialiazation
		//...
		// logic...
		res.template = "main";
		res.view = "init";
		// render 
		//console.log( this );
		//this.render(res);
		//res.send("here");
	},
	
    ensureAuthenticated: function(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/');
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
