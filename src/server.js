/*jshint node: true */
'use strict';

var Hapi = require('hapi'),
    inert = require('inert'),
    vision = require('vision'),
    moment = require('moment'),
    newsletters = require('./newsletters'),
    templates = require('./templates');

// This will set the locale for all plugins using moment
moment.locale('da');

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

server.register(inert, cb);
server.register(vision, cb);
// server.register(client, { routes: { prefix: '/nyhedsbreve' } }, cb);
server.register(client, cb);
server.register(templates, { routes: { prefix: '/templates' } }, cb);
server.register(newsletters, { routes: { prefix: '/newsletters' } }, cb);
// server.route({ method: 'GET', path: '/', handler: function (request, reply) { reply.redirect('/nyhedsbreve'); } });
server.route({ method: 'GET', path: '/nyhedsbreve', handler: function (request, reply) { reply.redirect('/'); } });


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
