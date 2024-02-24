var path = require("path");

module.exports = {
	root : path.dirname(require.main.filename) +"/",

	defaults: {
		"controller": "main"
	},

	paths: {
		layouts: false,
	},

	api : {}

}
