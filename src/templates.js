'use strict';

var fs = require('fs'),
    swig = require('swig'),
    bond_client = require('./bond_client'),
    checksum = require('checksum');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/

module.exports.register = function (plugin, options, next) {

  plugin.select('templates').views({
    engines: {
      html: swig,
      plain: swig
    },
    path: 'src/templates',
    isCached: false /* must be turned of when in production*/
  });


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
    method: 'OPTIONS',
    path: '/',
    handler: function (request, reply) {

      if (request.query.node) {
        bond_client.getNode(request.query.node, function (err, node) {
          if (node === null) {
            return reply().code(404);
          }

          reply()
          .header('Transfer-Encoding', 'chunked')
          .header('X-Subject-Suggestion', encodeURIComponent(emailSubjectSuggestion(node)));
        });
      } else if (request.query.nodequeue) {
        bond_client.getNodequeue(request.query.nodequeue, function (err, nodequeue) {
          if (nodequeue === null || nodequeue.title === null) {
            return reply().code(404);
          }

          reply()
          .header('Transfer-Encoding', 'chunked')
          .header('X-Subject-Suggestion', encodeURIComponent(emailSubjectSuggestion(nodequeue)));
        });
      } else {
        reply().code(404);
      }
    }
  },{
    method: 'GET',
    path: '/{template*}',
    handler: function (request, reply) {
      var templatePath = __dirname + '/templates';

      if (request.params.template === undefined) {
        var filter = request.query.filter;

        reply(fs.readdirSync(templatePath)
        .filter(function (file) {
          return fs.statSync(templatePath + '/' + file).isFile() &&
            (filter !== undefined ?
              //file.slice(-(filter.length + 1)) === '.' + filter :
              //file.slice(-filter.length) === filter :
              file.indexOf(filter) > -1 :
              true);
        })
        .map(function (templateName) {
          return {
            name: templateName,
            uri: 'http://' + request.info.host + request.path + '/' + templateName
          };
        }));
      } else if (!fs.existsSync(templatePath + '/' + request.params.template)) {
        reply().code(404);
      } else if (request.query.node) {
        bond_client.getNode(request.query.node, function (err, node) {
          if (node === null) {
            return reply().code(404);
          }

          var node_checksum = calculateNodeChecksum(node),
              subject = emailSubjectSuggestion(node);

          node.paywallToken = calculatePaywallToken();

          reply
          .view(request.params.template, node)
          .header('Transfer-Encoding', 'chunked')
          .header('Content-Type', ContentTypeHeader(request.params.template))
          .header('X-Subject-Suggestion', encodeURIComponent(subject))
          .header('X-Content-Checksum', node_checksum);
        });
      } else if (request.query.nodequeue) {
        bond_client.getNodequeue(request.query.nodequeue, function (err, nodequeue) {
          if (nodequeue === null || nodequeue.title === null) {
            return reply().code(404);
          }

          var nodequeue_checksum = calculateNodequeueChecksum(nodequeue),
              subject = emailSubjectSuggestion(nodequeue);

          nodequeue.paywallToken = calculatePaywallToken();

          reply
          .view(request.params.template, nodequeue)
          .header('Transfer-Encoding', 'chunked')
          .header('Content-Type', ContentTypeHeader(request.params.template))
          .header('X-Subject-Suggestion', encodeURIComponent(subject))
          .header('X-Content-Checksum', nodequeue_checksum);
        });
      } else {
        reply
        .view(request.params.template)
        .header('Content-Type', ContentTypeHeader(request.params.template))
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
  if (data === null) return '';
  var maxLength = 255;

  if (data.type === 'nodequeue') {
    var temp = [];
    for (var i = 0; i < 3; i++) {
      temp.push(data.nodes[i].title);
    }
    return temp.join(' | ').substring(0, maxLength);
  } else {
    return data.title.substring(0, maxLength);
  }
}


function ContentTypeHeader (template) {
  if (template.slice(-5) === '.html') {
    return 'text/html; charset=utf-8';
  } else {
    return 'text/plain; charset=utf-8';
  }
}


function calculateNodeChecksum (node) {
  return checksum(JSON.stringify(node.id));
}


function calculateNodequeueChecksum (nodequeue) {
  var temp = nodequeue.nodes.map(function (node) {
    return node.id;
  });

  return checksum(JSON.stringify(temp));
}


function calculatePaywallToken () {
  return checksum(new Date().toISOString() + process.env.PAYWALL_TOKEN_SALT, { algorithm: 'sha256' });
}