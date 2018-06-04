/*jshint node: true */
'use strict';

var Hapi = require('hapi'),
    inert = require('inert'),
    vision = require('vision'),
    moment = require('moment'),
    newsletters = require('./newsletters'),
    templates = require('./templates'),
    bonddata = require('./bonddata'),
    good = require('good'),
    goodConsole = require('good-console');

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

var goodOpts = {
  reporters: {
    cliReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*' }]
    }, {
      module: 'good-console'
    }, 'stdout']
  }
};

server.connection({ port: process.env.PORT ? process.env.PORT : 8000 });

server.register({register: good, options: goodOpts}, cb);
server.register(inert, cb);
server.register(vision, cb);
// server.register(client, { routes: { prefix: '/nyhedsbreve' } }, cb);
server.register(client, cb);
server.register(templates, { routes: { prefix: '/templates' } }, cb);
server.register(newsletters, { routes: { prefix: '/newsletters' } }, cb);
// server.route({ method: 'GET', path: '/', handler: function (request, reply) { reply.redirect('/nyhedsbreve'); } });
server.route({ method: 'GET', path: '/nyhedsbreve', handler: function (request, reply) { reply.redirect('/'); } });
server.register(bonddata, { routes: { prefix: '/bonddata' } }, cb);


if (!module.parent) {
  server.start(function() {
    console.log('Server started on ' + server.info.uri + '.');
  });
}


function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    server.stop();
  }
}


module.exports = server;
