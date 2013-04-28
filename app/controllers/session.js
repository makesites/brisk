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
        // filter data
        // - will never need the password on the client
        if( res.data.password ){ 
            delete res.data.password;
        }
        // 
        this.render(req, res);
    } 
	

});

// helpers


module.exports = controller;
