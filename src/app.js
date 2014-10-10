var Hapi = require('hapi'),
    //path = require('path'),
    fs = require('fs'),
    swig = require('swig'),
    newsletters = require('./newsletters');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/

var serverOptions = {
  views: {
    engines: {
      html: swig
    },
    path: 'src/emails',
    isCached: false /* must be turned of when in production*/
  }
};

var server = new Hapi.Server('0.0.0.0', 8000, serverOptions);

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

server.route(newsletters);

// server.route({
//   method: 'GET',
//   path: '/emails/static/{param*}',
//   handler: {
//     directory: {
//       path: 'src/emails/static',
//       index: false
//     }
//   }
// });

// server.route({
//     method: 'GET',
//     path: '/emails/{template*}',
//     handler: function (request, reply) {
//       console.log('DSDASDAS', request);
//       reply.view(request.params.template, {title:'HEJ'});
//     }
// });



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