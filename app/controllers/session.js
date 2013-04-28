// Data Controller - outputs data in json form for the client 

// base class
var Parent = require('brisk').getBaseController("data");

var controller = Parent.extend({
	
	init: function(req, res){
		// ...
	}, 
    
    index: function(req, res){
        // get user (with fallback)
        res.data = req.user || {};
        // 
        
        // 
        this.render(req, res);
    } 
	

});

// helpers


module.exports = controller;
