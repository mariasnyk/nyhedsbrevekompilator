/*jshint node: true */
'use strict';

const Hapi = require('hapi');
const inert = require('inert');
const vision = require('vision');
const moment = require('moment');
const newsletters = require('./newsletters');
const templates = require('./templates');
const data = require('./data');
const good = require('good');
const goodConsole = require('good-console');

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
server.register(client, cb);
server.register(templates, { routes: { prefix: '/templates' } }, cb);
server.register(newsletters, { routes: { prefix: '/newsletters' } }, cb);
server.route({ method: 'GET', path: '/nyhedsbreve', handler: function (request, reply) { reply.redirect('/'); } });
server.register(data, { routes: { prefix: '/data' } }, cb);


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
