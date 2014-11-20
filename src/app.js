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


var pack = new Hapi.Pack();

pack.server(8000, {
  router: {
    stripTrailingSlash: false
  }
});

pack.register(redirectRootToAdmin, cb);
pack.register(admin, { route: { prefix: '/admin' } }, cb);
pack.register(apis, { route: { prefix: '/apis' } }, cb);
pack.register(templates, { route: { prefix: '/templates' } }, cb);


if (!module.parent) {
  pack.start(function() {
    console.log("Pack started.");
  });
}


function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    pack.stop();
  }
}


module.exports = pack;
