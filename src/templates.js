'use strict';

var fs = require('fs'),
    bond_client = require('./bond_client');


module.exports.register = function (plugin, options, next) {

  plugin.route([{
    method: 'GET',
    path: '/static/{param*}',
    handler: {
      directory: {
        path: 'src/templates/static',
        index: false
      }
    }
  },{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var path = __dirname + '/templates';
      reply(fs.readdirSync(path)
      .filter(function (file) {
        return fs.statSync(path + '/' + file).isFile() && file.slice(-5) === '.html';
      })
      .map(function (file) {
        var templateName = file.substring(0, file.lastIndexOf('.'));
        return {
          name: templateName,
          uri: 'http://' + request.info.host + request.path + '/' + templateName
        };
        // return server.info.protocol + '://' + request.info.host + request.path + '/' + file.substring(0, file.lastIndexOf('.'));
      }));
    }
  },{
    method: 'GET',
    path: '/{template}',
    handler: function (request, reply) {
      if (request.query.node) {
        bond_client.getNode(request.query.node, function (err, node) {
          reply
          .view(request.params.template, node)
          .header('X-Subject-Suggestion', emailSubjectSuggestion(node));
        });
      } else if (request.query.nodequeue) {
        bond_client.getNodequeue(request.query.nodequeue, function (err, nodequeue) {
          reply
          .view(request.params.template, nodequeue)
          .header('X-Subject-Suggestion', emailSubjectSuggestion(nodequeue));
        });
      } else {
        reply.view(request.params.template);
      }
    }
  },{
    method: 'OPTIONS',
    path: '/{template}',
    handler: function (request, reply) {
      if (request.query.node) {
        bond_client.getNode(request.query.node, function (err, node) {
          reply()
          .header('Content-Type', 'text/html; charset=utf-8')
          .header('X-Subject-Suggestion', emailSubjectSuggestion(node));
        });
      } else if (request.query.nodequeue) {
        bond_client.getNodequeue(request.query.nodequeue, function (err, nodequeue) {
          reply()
          .header('Content-Type', 'text/html; charset=utf-8')
          .header('X-Subject-Suggestion', emailSubjectSuggestion(nodequeue));
        });
      } else {
        reply().code(404);
      }
    }
  }]);

  next();
};

module.exports.register.attributes = {
    name: 'templates',
    version: '1.0.0'
};



function emailSubjectSuggestion (data) {
  console.log('emailSubjectSuggestion', data);
  if (data.type === 'nodequeue') {
    var temp = [];
    for (var i = 0; i < 3; i++) {
      temp.push(data.nodes[i].title);
    }
    return temp.join(' | ');
  } else {
    return data.title;
  }
}
