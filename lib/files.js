var fs = require('fs'),
	path = require('path'),
	_ = require('underscore');

// Local vars
var root =  path.dirname(require.main.filename) +"/";
// - lookup enviroment state
var DEV = (process.env.NODE_ENV == "production") ? false : true;

var files = {

	loadFiles: function( dir, files ){
		files = files || [];
		var search = fs.readdirSync( dir );
		for( var i in search ){
			var file = search[i];
			// exclude certain files
			if( file == ".DS_Store" ) continue;
			var stat = fs.statSync( dir + file );
			if( stat.isDirectory() ){
				_.extend( files, this.loadFiles( dir + file +"/", files ) );
			} else {
				files.push( dir + file );
			}
		}
		// sort files to categories?
		//console.log("files", files );
		return files;
	},

	lookupDirs: function ( options ){
		// fallbacks
		options || ( options = {} );
		// load package info
		var dirs = [];
		// set root
		this.root = ( options.root) ? options.root : root;

		var package = require( this.root +'package.json');
		// find modules
		for(var module in package.dependencies){
			if( module.search(/brisk\-/) === 0 ){
				var files = require( module ).files() || [];
				//_.extend( dirs, files );
				dirs = dirs.concat( files );
				//modules.push( module );
			}
		}
		var local = path.join(__dirname, "../");
		// lookup this dir
		dirs = dirs.concat( this.loadFiles( local +"app/" ) );
		// look up app dir
		dirs = dirs.concat( this.loadFiles( this.root +"app/" ) );
		//console.log( dirs );
		return dirs;

	},

	loadDir: function( name, context ){

		var files = [];
		var dir = [];
		var root = this.root;
		var includes = [];
		//
		dir['default'] = path.normalize( __dirname+'/../app/'+ name +'/' );
		dir['app'] = path.normalize(  root+'app/'+ name +'/' );

		// get list
		try {
			files['default'] = fs.readdirSync( dir['default'] );
		} catch( e ) {
			//
			if( DEV ) console.log( e );
			files['default'] = false;
		}

		try {
			files['app'] = fs.readdirSync( dir['app'] );
		} catch( e ) {
			//
			if( DEV ) console.log( e );
			files['app'] = false;
		}
		// load default files
		for(i in files['default']){
			//
			var file = files['default'][i];
			var lib = isLib( file );

			// don't process if not a js file
			if( !lib ) continue;
			// load only if there's no app overrideoverride
			if( !_.indexOf( files['app'], file ) ){
				includes[lib] = include( dir['default'] + file, context);
			}
		}

		// load app files
		for(i in files['app']){
			//
			var file = files['app'][i];
			var lib = isLib( file );

			// don't process if not a js file
			if( !lib ) continue;
			includes[lib] = include( dir['app'] + file, context);
		}

		return includes;
	}

};

// Helpers
// - check if a filename is a js file - return the name if it is
function isLib( file ){
	return (file.substr(-3) == ".js") ? file.substring(0, file.lastIndexOf('.') ) : false;
}


function include( file, options ) {

	var Class = require( file );

	return new Class( options );
	/*
	var promise = new Promise(Class);

	promise.add(function(type, name){
		var Class = this;

		site[type][name] = new Class( site );

	});

	return promise;
	*/
}

/*
function Promise (obj) {
	var args = null;
	var callbacks = [];
	var resolved = false;

	this.add = function(callback) {
		if (resolved) {
			callback.apply(obj, args);
		} else {
			callbacks.push(callback);
		}
	},

	this.resolve = function() {
		if (!resolved) {
			args = arguments;
			resolved = true;

			var callback;
			while (callback = callbacks.shift()) {
				callback.apply(obj, arguments);
			}

			callbacks = null;
		}
	}
};
*/

module.exports = files;
