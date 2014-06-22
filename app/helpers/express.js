var brisk = require("brisk"),
	Parent = require("./class"),
	CORS = brisk.getLib("connect-xcors");

var helper = Parent.extend({

	engine: false, // replace with your temaplte engine

	//CORS middleware
	cors : function() {
		// load configuration
		return CORS( brisk.loadConfig('cors') );
	},

	self: function() {
		return this.express;
	}

});


module.exports = helper;
