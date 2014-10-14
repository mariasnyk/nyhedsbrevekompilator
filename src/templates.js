'use strict';
var http = require('http'),
    bond_client = require('./bond_client');

module.exports = [
  {
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
    path: '/templates/{template*}',
    handler: function (request, reply) {
      console.log('DSDASDAS', request.query);
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
  }
];

