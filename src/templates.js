/*jshint node: true */
'use strict';

var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    url = require('url'),
    Joi = require('joi'),
    swig = require('./swig_helper.js'),
    checksum = require('checksum'),
    bonddata = require('bonddata'),
    templatesDir = path.join(__dirname, '/../templates');

module.exports.render = function (templateName, data, callback) {
  var template = path.join(templatesDir, templateName);

  if (!fs.existsSync(template)) {
    console.log( 'Template', templateName, 'not found');
    return null;
  }

  return swig.renderFile(template, data);
};

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
    path: '/{template*}',
    config: {
      validate: {
        params: validateTemplate,
        query: {
          u: Joi.string().uri(),
          debug: Joi.boolean()
        }
      }
    },
    handler: function (request, reply) {

      if (request.query.u) {
        bonddata.get(request.query.u, function (err, data) {
          if (err) {
            reply(err).code(500);
          } else if (data === null) {
            reply().code(404);
          } else {
            data.debug = request.query.debug === true;

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
    method: 'GET',
    path: '/features/{template*}',
    handler: function (request, reply) {
      // TODO: Let's build an enpoint where all tags in a template can be found and sent to the frontend
      reply().code(501);
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


function contentTypeHeader (template) {
  if (template.slice(-5) === '.html') {
    return 'text/html; charset=utf-8';
  } else {
    return 'text/plain; charset=utf-8';
  }
}
