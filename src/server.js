/*jshint node: true */
'use strict';

var Hapi = require('hapi'),
    newsletters = require('./newsletters'),
    templates = require('./templates');


// A plugin to redirect GET requests on / to admin interface
var redirectRootToAdmin = {
  register: function (plugin, options, next) {

    plugin.route({
      method: 'get',
      path: '/',
      handler: function (request, reply) {
        reply.redirect('/nyhedsbreve');
      }
    });

    plugin.route({
      method: 'get',
      path: '/nyhedsbreve/{param*}',
      handler: {
        directory: {
          path: 'admin',
          index: true
        }
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
server.register(templates, { routes: { prefix: '/templates' } }, cb);
server.register(newsletters, { routes: { prefix: '/newsletters' } }, cb);


if (!module.parent) {
  server.start(function() {
    console.log('Server started on port 8000.');
  });
}


function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    server.stop();
  }
}


module.exports = server;
