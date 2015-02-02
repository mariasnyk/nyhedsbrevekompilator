// 'use strict';

var fs = require('fs'),
    swig = require('swig'),
    extras = require('swig-extras'),
    bond_client = require('./bond_client'),
    checksum = require('checksum'),
    templateDir = __dirname + '/../templates';

extras.useFilter(swig, 'split');
extras.useFilter(swig, 'trim');
extras.useFilter(swig, 'truncate');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/


module.exports.register = function (plugin, options, next) {

  plugin.select('templates').views({
    engines: {
      html: swig,
      plain: swig
    },
    path: templateDir,
    isCached: false /* must be turned of when in production*/
  });

  plugin.route({
    method: 'GET',
    path: '/{template*}',
    handler: function (request, reply) {
      var templatePath = templateDir +
          (request.params.template !== undefined ? '/' + request.params.template : '');

      if (!fs.existsSync(templatePath))
        return reply().code(404);

      templatePath = fs.realpathSync(templatePath);

      fs.stat(templatePath, function (err, stat) {
        if (err) return reply().code(404);

        // Requesting a specific template
        if (stat.isFile()) {

          // Requesting a specific template with a BOND node as data input
          if (request.query.node) {
            bond_client.getNode(request.query.node, function (err, node) {
              if (err) return reply(err).code(500);

              if (node === null) {
                return reply().code(404);
              }

              var node_checksum = calculateNodeChecksum(node),
                  subject = emailSubjectSuggestion(node);

              node.newsl_access = calculatePaywallToken(node.id);

              reply
              .view(request.params.template, node)
              .header('Transfer-Encoding', 'chunked')
              .header('Content-Type', ContentTypeHeader(request.params.template))
              .header('X-Subject-Suggestion', encodeURIComponent(subject))
              .header('X-Content-Checksum', node_checksum);
            });

          // Requesting a specific template with a BOND nodequeue as data input
          } else if (request.query.nodequeue) {
            bond_client.getNodequeue(request.query.nodequeue, function (err, nodequeue) {
              if (err) return reply(err).code(500);

              if (nodequeue === null || nodequeue.title === null) {
                return reply().code(404);
              }

              var nodequeue_checksum = calculateNodequeueChecksum(nodequeue),
                  subject = emailSubjectSuggestion(nodequeue);

              nodequeue.nodes.forEach(function (node) {
                node.newsl_access = calculatePaywallToken(node.id);
              });

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

        // Requesting af list of templates
        } else if (stat.isDirectory()) {
          fs.readdir(templatePath, function (err, files) {
            reply(files
              .filter(function (file) {
                return fs.statSync(templatePath + '/' + file).isFile() &&
                  (request.query.filter !== undefined ?
                    file.indexOf(request.query.filter) > -1 :
                    true);
              })
              .map(function (file) {
                return file;
              }));
          });
        } else {
          // Will this ever happen??? That the file/directory exists but is not a file nor a directory hehe!
          reply().code(404);            
        }
      });
    }
  });

  plugin.route({
    method: 'POST',
    path: '/{template*}',
    handler: function (request, reply) {

      // If the request URL ends without a filename
      if (request.params.template.charAt(request.params.template.length - 1) === '/')
        reply().code(400);

      // Creating all directories in the request URL recursive
      var dirs = request.params.template.split('/').slice(0,-1);
      dirs.forEach(function (dir, index) {
        var newDir = templateDir + '/' + dirs.slice(0, index + 1).join('/');
        if (!fs.existsSync(newDir))
          fs.mkdirSync(newDir);
      });

      fs.writeFile(templateDir + '/' + request.params.template, request.payload, function (err) {
        if (err) reply().code(500);
        else reply();
      });
    }
  });

  plugin.route({
    method: 'DELETE',
    path: '/{template*}',
    handler: function (request, reply) {

      if (request.params.template === undefined || request.params.template.charAt(request.params.template.length - 1) === '/')
        reply().code(400);

      var templatePath = fs.realpathSync(templateDir + '/' + request.params.template);

      if (fs.existsSync(templatePath)) {
        fs.unlink(templatePath, function (err) {
          if (err) reply().code(500);
          else reply();
        });
      } else {
        reply().code(404);
      }
    }
  });

  plugin.route({
    method: 'get',
    path: '/controlroom',
    handler: function (request, reply) {
      if (request.query.node) {
        var url = bond_client.getNodeControlroomUrl(request.query.node);
      } else if (request.query.nodequeue) {
        var url = bond_client.getNodequeueControlroomUrl(request.query.nodequeue);
      } else {
        return reply().code(404);
      }

      reply({url: url})
      .header('X-Controlroom-url', encodeURIComponent(url));
    }
  });

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


function calculatePaywallToken (nid) {
  var timestamp = Date.now();
  var token = checksum(nid.toString() + timestamp + process.env.PAYWALL_TOKEN_SALT, { algorithm: 'sha256' });
  var newsl_access = new Buffer(nid.toString() + '|' + timestamp + '|' + token).toString('base64');
  return newsl_access;
}