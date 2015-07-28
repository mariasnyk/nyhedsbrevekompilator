/*jshint node: true */
'use strict';

var Hapi = require('hapi'),
    newsletters = require('./newsletters'),
    templates = require('./templates');


var client = {
  register: function (plugin, options, next) {

    plugin.route({
      method: 'get',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'client',
          index: true
        }
      }
    });

    next();
  }
};

client.register.attributes = {
  name: 'client',
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

server.register(client, { routes: { prefix: '/nyhedsbreve' } }, cb);
server.register(templates, { routes: { prefix: '/templates' } }, cb);
server.register(newsletters, { routes: { prefix: '/newsletters' } }, cb);
server.route({ method: 'GET', path: '/', handler: function (request, reply) { reply.redirect('/nyhedsbreve'); } });


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
