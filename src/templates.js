/*jshint node: true */
'use strict';

var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    url = require('url'),
    swig = require('./swig_helper.js'),
    checksum = require('checksum'),
    templatesDir = path.join(__dirname, '/../templates'),
    testdataDir = path.join(__dirname, '/../testdata');

if (!fs.existsSync(testdataDir)) {
  fs.mkdirSync(testdataDir);
}

module.exports.render = function (templateName, data, callback) {
  var template = path.join(templatesDir, templateName);

  if (!fs.existsSync(template)) {
    console.log( 'Template', templateName, 'not found');
    return null;
  }

  return swig.renderFile(template, data);
};

module.exports.bond = getDataFromBond;

module.exports.register = function (plugin, options, next) {

  plugin.select('templates').views({
    engines: {
      html: swig,
      plain: swig
    },
    path: templatesDir,
    isCached: false /* must be turned of when in production*/
  });

  plugin.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      fs.readdir(templatesDir, function (err, files) {
        reply(files
          .filter(function (file) {
            return fs.statSync(path.join(templatesDir, file)).isFile() &&
              (request.query.filter !== undefined ?
                file.indexOf(request.query.filter) > -1 :
                true);
          })
          .map(function (file) {
            return file;
          }));
      });
    }
  });

  plugin.route({
    method: 'GET',
    path: '/data',
    config: {
      validate: {
        query: validateQueryFU
      }
    },
    handler: function (request, reply) {
      if (request.query.f) {
        var data = require(path.join(testdataDir, request.query.f));
        prepareData(data);
        reply(data);
      } else if (request.query.u) {
        getDataFromBond(request.query.u, function (err, data) {
          if (err) return reply(err).code(500);
          if (data === null) return reply().code(404);

          reply(data);
        });
      } else {
        return reply().code(400);
      }
    }
  });

  plugin.route({
    method: 'GET',
    path: '/{template*}',
    config: {
      validate: {
        params: validateTemplate,
        query: validateQueryFU
      }
    },
    handler: function (request, reply) {

      if (request.query.f) {
        var data = require(path.join(testdataDir, request.query.f));
        prepareData(data);
        data.debug = request.query.debug === 'true';

        reply
        .view(request.params.template, data)
        .header('Transfer-Encoding', 'chunked')
        .header('Content-Type', contentTypeHeader(request.params.template));

      // Requesting a specific template with a BOND node as data input
      } else if (request.query.u) {

        getDataFromBond(request.query.u, function (err, data) {
          if (err) {
            reply(err).code(500);
          } else if (data === null) {
            reply().code(404);
          } else {
            data.debug = request.query.debug === 'true';

            reply
            .view(request.params.template, data)
            .header('Transfer-Encoding', 'chunked')
            .header('Content-Type', contentTypeHeader(request.params.template));
          }
        });

      } else {
        reply
        .view(request.params.template)
        .header('Content-Type', contentTypeHeader(request.params.template));
      }
    }
  });

  plugin.route({
    method: 'POST',
    path: '/{template*}',
    config: {
      validate: {
        params: validateTemplate
      },
      payload: {
        allow: 'application/json'
      }
    },
    handler: function (request, reply) {
      reply
      .view(request.params.template, request.payload)
      .header('Transfer-Encoding', 'chunked')
      .header('Content-Type', contentTypeHeader(request.params.template));
    }
  });

  plugin.route({
    method: 'PUT',
    path: '/{template*}',
    handler: function (request, reply) {

      // If the request URL ends without a filename
      if (request.params.template.charAt(request.params.template.length - 1) === '/')
        reply().code(400);

      // Creating all directories in the request URL recursive
      var dirs = request.params.template.split('/').slice(0,-1);
      dirs.forEach(function (dir, index) {
        var newDir = path.join(templatesDir, dirs.slice(0, index + 1).join('/'));
        if (!fs.existsSync(newDir))
          fs.mkdirSync(newDir);
      });

      fs.writeFile(path.join(templatesDir, request.params.template), request.payload, function (err) {
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

      var templatePath = fs.realpathSync(path.join(templatesDir, request.params.template));

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
      if (request.query.u) {
        var controlroom_url = getControlroomUrl(request.query.u);

        reply({ url: controlroom_url })
        .header('X-Controlroom-url', encodeURIComponent(controlroom_url));

      } else {
        return reply().code(400);
      }
    }
  });

  next();
};

module.exports.register.attributes = {
    name: 'templates',
    version: '1.0.0'
};


function validateTemplate (value, options, next) {
  var templatePath = path.join(templatesDir, value.template);

  if (!fs.existsSync(templatePath) || !fs.statSync(templatePath).isFile())
    next({ message: 'Template ' + templatePath + ' not found' });
  else
    next();
}


function validateQueryFU (value, options, next) {
  if (value.u) {
    var uri = url.parse(value.u);

    if (uri.protocol === null || uri.host === null)
      next({ message: 'Url ' + value.u + ' invalid' });
    else if (['http:', 'https:'].indexOf(uri.protocol) === -1)
      next({ message: 'Url ' + value.u + ' invalid protocol' });
    else
      next();
  } else if (value.f) {
    var testdataPath = path.join(testdataDir, value.f);

    if (!fs.existsSync(testdataPath) || !fs.statSync(testdataPath).isFile())
      next({ message: 'Testdata ' + testdataPath + ' not found' });
    else
      next();

  } else {
    next();
  }
}


function getDataFromBond (url, callback) {
  download(url, function (err, data) {
    if (err) {
      callback(err);
    } else if (data === null || data.type === undefined) {
      callback({ message: 'Invalind BOND data' });
    // } else if (data.type === 'nodequeue' && data.nodes.length === 0 ) {
      // callback(null, null);

      // Example of a response from a nodequeue that doesn't exist
      //   { type: 'nodequeue',
      //     id: '4222222626',
      //     loadType: 'fullNode',
      //     title: null,
      //     nodes: [] }
    } else {
      prepareData(data);
      callback(null, data);
    }
  });
}


function download (url, callback) {
  http.get(url, function( response ) {

    if (response.statusCode === 401) {
      return callback (null, null);
    } else if (response.statusCode !== 200) {
      return callback (response.statusCode, null);
    }

    var data = '';
    response.setEncoding('utf8');

    response.on('data', function ( chunk ) {
      data += chunk;
    });

    response.on('end', function() {
      callback(null, JSON.parse(data), response.headers);
    });
  }).on('error', function(e) {
    console.log('Got error while requesting HTML (' + url + '): ' + e.message);
    callback(e, null);
  });
}


function prepareData (data) {
  data.subject = subjectSuggestion(data);
  addPaywallToken(data);
  return data;
}


function subjectSuggestion (data) {
  if (data === null) return '';
  var maxLength = 255;

  if (data.type === 'nodequeue' || data.type === 'latest_news') {
    var temp = [];
    for (var i = 0; i < 3; i++) {
      if (data.nodes[i] && data.nodes[i].title) {
        temp.push(data.nodes[i].title);
      }
    }
    return temp.join(' | ').substring(0, maxLength);
  } else {
    return data.title.substring(0, maxLength);
  }
}


function addPaywallToken (node) {
  if (node.type === 'nodequeue' || node.type === 'latest_news') {
    node.nodes.forEach(addPaywallToken);
  } else {
    node.newsl_access = calculatePaywallToken(node.id);
  }
}


function calculatePaywallToken (nid) {
  var timestamp = Date.now();
  var token = checksum(nid.toString() + timestamp + process.env.PAYWALL_TOKEN_SALT, { algorithm: 'sha256' });
  var newsl_access = new Buffer(nid.toString() + '|' + timestamp + '|' + token).toString('base64');
  return newsl_access;
}


function contentTypeHeader (template) {
  if (template.slice(-5) === '.html') {
    return 'text/html; charset=utf-8';
  } else {
    return 'text/plain; charset=utf-8';
  }
}


function getControlroomUrl (input) {
  var bond = url.parse(input);
  var bond_base_url = '';

  if (bond.host.indexOf('edit.') === 0) {
    bond_base_url = bond.protocol + '//' + bond.host;
  } else if (bond.host.substr(-3) === '.dk') {
    bond_base_url = bond.protocol + '//edit.berlingskemedia.net';
  }

  var id = bond.path.substring(bond.path.lastIndexOf('/') + 1, bond.path.indexOf('.ave-json'));

  if (bond.path.indexOf("/bondapi/nodequeue/") === 0) {
    return bond_base_url + '/admin/content/nodequeue/' + id + '/view';
  } else if (bond.path.indexOf("/bondapi/node/") === 0) {
    return bond_base_url + '/node/' + id + '/view';
  } else {
    return '';
  }
}
