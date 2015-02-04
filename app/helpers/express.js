var brisk = require("brisk"),
	Parent = require("./class");

var helper = Parent.extend({

	engine: false, // replace with your temaplte engine

	self: function() {
		return this.express;
	}

});


module.exports = helper;
