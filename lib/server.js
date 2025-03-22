var express = require('express'),
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore');

// Local vars
//var root =  path.dirname(require.main.filename) +"/";
// - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;

var Server = function( site ){
	this.site = site;
}

Server.prototype.parseConfig = function( env ){

	var self = this;
	var app = this.site.modules.app;
	var helpers = this.site.helpers.express;
	var libs = {
		app : app,
		connect : require("connect")
	};

	return function(){

		for( action in env ){
			var options = env[action];
			// engine is one level deep...
			if( action == "engine" ){
				var engine = helpers.engine || function(){};
				app[action](options, engine);
				continue;
			}
			for( name in options ){
				if( action == "set"){
					app[action](name, options[name]);
				} else {
					// check if we are calling another obj
					if( name.indexOf(".") > 0 ){

						var Class = name.substring(0, name.indexOf("."));
						var method = name.substring(name.indexOf(".")+1);

						//if( Class == "app" ){
						if( libs.hasOwnProperty(Class) ){
							var obj = libs[Class];
						} else {
							var obj = self.site.helpers[Class].self();
						}

					// the only middle ware in the express namespace is 'static'
					} else if( name == "static" ) {
						var method = name;
						var obj = express;
					} else {
						// fallback to the express obj
						var method = name;
						var obj = helpers;
					}

					var params = options[name];
					var middleware;

					if( params === true ){
						// call app action with the defined object method (using the right namespace)
						middleware = obj[method].call(obj);
						app[action].call(app, middleware);
					} else if( params === false ){
						// call app action with the defined object variable
						middleware = obj[method];
						app[action].call(app, middleware);
					} else if( typeof params === "function" ){
						//var fn = params;
						//middleware = fn.call(obj, opt);
						middleware = params;
						app[action].call(app, middleware);
					} else if( params instanceof Array && typeof params[0] === "function" ){
						// _new_ unified method to load middleware...
						var fn = params[0];
						var opt = params[1] || {};
						middleware = fn.call(obj, opt);
						app[action].call(app, middleware);
					} else {
						// convert params to array if necessary
						params = ( params instanceof Array ) ? params : [ params ];
						// call app action with the defined object method (using the right namespace) and include the parameters
						var fn = obj[method];
						if( fn ){
							middleware = fn.apply(obj, params);
							app[action].call(app, middleware );
						}
					}

					// FIX: keep a reference to the cookieParser ( do you really need this? )
					if(method == "cookieParser") app.cookieParser = middleware;

				}

			}

		}

	}
}


Server.prototype.setup = function(){
	var app = this.site.modules.app,
        site = this.site,
		root = this.site.config.root;

	// load config file
	// #21 - checking if express config exists
	//var file = path.normalize( site.config.root +"config/express ) +".js";
	var file = root +"config/express.js";
	if( !fs.existsSync(file) ) return;

	var config = require( root +"config/express")( site );
	var state = ( DEV ) ? "development" : "production";

	for(env in config){
		if( env == "default" || env == state){
			var middleware = this.parseConfig( config[env] );
			middleware();
		}
		// else do nothing?
	}

}


module.exports = Server;
