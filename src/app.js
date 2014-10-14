var Hapi = require('hapi'),
    //path = require('path'),
    fs = require('fs'),
    swig = require('swig'),
    bond_client = require('./bond_client');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/

var serverOptions = {
  views: {
    engines: {
      html: swig
    },
    path: 'src/templates',
    isCached: false /* must be turned of when in production*/
  },
  router: {
    stripTrailingSlash: false
  }
};

var server = new Hapi.Server('0.0.0.0', 8000, serverOptions);


// Templates
server.route([{
  method: 'GET',
  path: '/templates/static/{param*}',
  handler: {
    directory: {
      path: 'src/templates/static',
      index: false
    }
  }
},{
  method: 'GET',
  path: '/templates/',
  handler: function (request, reply) {
    reply(listHtmlFiles(__dirname + '/templates').map(function (file) {
      return request.path + file.substring(0, file.lastIndexOf('.'));
    }));
  }
},{
  method: 'GET',
  path: '/templates/{template*}',
  handler: function (request, reply) {
    console.log('DSDASDAS', request.query, request.params);
    if (request.query.node) {
      bond_client.getNode(request.query.node, function (err, node) {
        reply.view(request.params.template, node);
      });
    } else if (request.query.nodequeue) {
      // getNodequeue(request.query.nodequeue, function (err, nodequeue) {
      //   reply.view(request.params.template, nodequeue);
      // });
      reply.view(JSON.parse(a));
    } else {
      reply.view(request.params.template);
      // reply.view(request.params.template, {title:'HEJ'});
    }
  }
}]);


function listHtmlFiles (path) {
  return fs.readdirSync(path)
  .filter(function (file) {
    return fs.statSync(path + '/' + file).isFile() && file.slice(-5) === '.html';
  });
}

// APIs
var walk = function (path) {
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
      server.route(routes);
    }
  });
};
walk(__dirname + '/apis');


// Admin Angular
server.route({
  method: 'GET',
  path: '/admin/{param*}',
  handler: {
    directory: {
      path: 'src/admin',
      index: true
    }
  }
});


server.on('tail', function (request) {
  //console.log('Request complete', new Date().toString());
  //console.log('tail', request.path, request.headers);
});


if (!module.parent) {
  server.start(function() {
    console.log("Server started", server.info.uri);
  });
}

module.exports = server;

function context(request) {

}