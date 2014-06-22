
module.exports = function(site){
	var app = site.modules.app;

	return {

		"default": {

			"engine" : "html",

			"set" : {
				"view engine" : "html",
				"views" : app.locals.root + "app/views"
			},
			"use" : {
				"cookieParser" : site.config.secret,
				"session" : { secret: site.config.secret, store: site.sessions, cookie: { maxAge: 86400000 } },
				"static" : app.locals.root + 'public',
			}

		},

		"development": {
			"use" : {
				"logger" : true, //{ format: ':method :url' }
				"errorHandler" : { dumpExceptions: true, showStack: true }
			}
		},

		"production": {
			"use" : {
				"errorHandler" : true
			}
		}
	}

}
