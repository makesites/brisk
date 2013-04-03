# Brisk

When doing it express is not enough...

## Features

* Auto-routing
* Slim express configuration
* OO architecture
* Clean app folder

## Install
Using npm: 
```
npm install brisk
```

## Usage

When initializing Brisk the express app is passed as a site module. 
```
var brisk = require("brisk"),
  express = require("express");

var modules = {
  app : express() 
};
                                                    
// initialize
brisk.init( modules );
```

In addition, a number of other modules may be passed that are necessary for the site to function. 

For example, modules may also include: ```db, server, sessions```...


## Folder structure

Following best practices, the expected folder structure is enforcing seperation of concerns using an MVC architecture and looks something like this: 
```
app
 |_ controllers
 |_ helpers
 |_ models
 |_ views
config
 |_ brisk.js
```

* ***controllers*** define the routes for the site
* ***helpers*** contains helper routines referenced in controllers
* ***models*** describe the data structures
* ***views*** hosts a set of html fragments, used to generate the output of the site

The config folder may contain more configuration files, as required, but the ```config/brisk.js``` will be seeked out to overwrite the default configuration. 

## Configuration

The ```config``` folder should contain all the site configuration. 

Each helper may require their own config file, manually used & independent of brisk, but there are two config files that brisk will automatically try to load:

### brisk.js

This is the default configuration of the site, overwriting the ```config/default.js``` values in the node module

### express.js

This cofiguration file is dedicated to configuring express, which is a core component of Brisk. 


## Credits

Created by Makis Tracend ([@tracend](http://twitter.com/tracend))

Distributed through [Makesites.org](http://makesites.org)

Released under the [Apache License, v2.0](http://makesites.org/licenses/APACHE-2.0)
