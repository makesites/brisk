// Data Controller - outputs data in json form for the client 

// base class
var Parent = require('brisk').getBaseController("main");

var controller = Parent.extend({
	
	init: function(req, res){
		// ...
	}, 
    
    index: function(req, res){
        // what methods this endpoint supports
        this.rest({
            get: read, 
            post: create, 
            update: update, 
            del: del
        }, 
        req, res);
    }, 
	
	render : function( req, res ){ 
		var json = JSON.stringify( ( res.data || {} ) ); 
		// validate the data before output... 
		return res.send( json ); 
	}

});

// helpers

// CRUD operations

function create(){
    
}

function read(){
    
}

function update(){
    
}

function del(){
    // ...
}


module.exports = controller;
