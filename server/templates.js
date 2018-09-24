/*jshint node: true */
'use strict';

const Fs = require('fs');
const Path = require('path');
const Joi = require('joi');
const swig = require('./swig_helper.js');
const data = require('./data');
const templatesDir = Path.join(__dirname, '/../templates');

function render(templateName, data, callback) {
  var template = Path.join(templatesDir, templateName);

  if (!Fs.existsSync(template)) {
    console.log( 'Template', templateName, 'not found');
    return null;
  }

  return swig.renderFile(template, data);
};

module.exports.render = render;

module.exports.register = function (plugin, options, next) {

  plugin.select('templates').views({
    engines: {
      html: swig,
      plain: swig
    },
    path: templatesDir,
    isCached: false
  });


  plugin.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      Fs.readdir(templatesDir, function (err, files) {
        reply(files
          .filter(function (file) {
            return Fs.statSync(Path.join(templatesDir, file)).isFile() &&
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
        data.get(request.query.u, function (err, data) {
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
      const content = render(request.params.template, request.payload);
      reply(content)
      .header('Transfer-Encoding', 'chunked')
      .header('Content-Type', contentTypeHeader(request.params.template));
    }
  });

  next();
};

module.exports.register.attributes = {
    name: 'templates',
    version: '1.0.0'
};


function validateTemplate (value, options, next) {
  const templatePath = Path.join(templatesDir, value.template);

  if (!Fs.existsSync(templatePath) || !Fs.statSync(templatePath).isFile())
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
