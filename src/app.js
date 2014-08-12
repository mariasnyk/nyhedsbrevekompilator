var Hapi = require('hapi');

var server = new Hapi.Server('0.0.0.0', 8000),
    fs = require('fs');

var walk = function (path) {
  fs.readdirSync(path).forEach(function(file) {
    var newPath = path + '/' + file;
    var stat = fs.statSync(newPath);

    if (stat.isDirectory()) {
      var t = newPath.split('/');
      var route_prefix = t[t.length-1];

      var routes = require(newPath + '/routes.js')(route_prefix);
      server.route(routes);
    }
  });
};
walk(__dirname + '/apis');

server.start();
