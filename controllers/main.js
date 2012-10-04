var Class = require("../helpers/class");

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
	}
	
});

main.prototype.render = function(res){
	//console.log( path.join(__dirname, '/views/'+res.template) );
	//res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
	res.render(res.view);
}


module.exports = main;
