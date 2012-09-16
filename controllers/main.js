
main = function(){
	
	
}

main.prototype.init = function(req, res){
	// logic...
	res.template = "main";
	res.view = "init";
	// render 
	//console.log( this );
	//this.render(res);
	res.send("here");
}

main.prototype.render = function(res){
	console.log( path.join(__dirname, '/views/'+res.template) );
	res.render(res.view, { layout: path.join(__dirname, '/views/'+res.template) });
}

module.exports = main;
