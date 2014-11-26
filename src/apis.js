'use strict';

var fs = require('fs');


module.exports.register = function (plugin, options, next) {

  walk(__dirname + '/apis');
  next();

  function walk (path) {
    fs.readdirSync(path).forEach(function(file) {
      var newPath = path + '/' + file,
          stat = fs.statSync(newPath),
          t = newPath.split('/'),
          route_prefix = '/' + t[t.length-2];

      if (stat.isDirectory()) {
        walk(newPath);
      } else if (stat.isFile() && newPath.slice(-3) === '.js') {
        var routes = require(newPath);
        routes.forEach(function (route) {
          route.path = route_prefix + route.path;
        });
        plugin.route(routes);
      }
    });
  }
};

module.exports.register.attributes = {
    name: 'apis',
    version: '1.0.0'
};

