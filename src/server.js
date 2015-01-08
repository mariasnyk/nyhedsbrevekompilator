'use strict';

var Hapi = require('hapi'),
    admin = require('./admin'),
    apis = require('./apis'),
    templates = require('./templates');


// A plugin to redirect GET requests on / to /admin
var redirectRootToAdmin = {
  register: function (plugin, options, next) {
    plugin.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        reply.redirect('/admin');
      }
    });

    next();
  }
};

redirectRootToAdmin.register.attributes = {
  name: 'redirectRootToAdmin',
  version: '1.0.0'
};


var server = new Hapi.Server({
  connections: {
    router: {
      stripTrailingSlash: false
    }
  }
});

server.connection({ port: 8000 });

server.register(redirectRootToAdmin, cb);
server.register(admin, { routes: { prefix: '/admin' } }, cb);
server.register(apis, { routes: { prefix: '/apis' } }, cb);
server.register(templates, { routes: { prefix: '/templates' } }, cb);


if (!module.parent) {
  server.start(function() {
    console.log("Server started.");
  });
}


function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    server.stop();
  }
}


module.exports = server;
