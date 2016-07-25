/*jshint node: true */
'use strict';

var http = require('http'),
    checksum = require('checksum'),
    sendgrid = require('./sendgrid_helper.js'),
    url = require('url'),
    moment = require('moment'),
    Joi = require('joi'),
    mongodb = require('./mongodb_client.js'),
    templates = require('./templates.js');

var newsletter_schema = {
  _id: Joi.string().strip(),
  ident: Joi.string().alphanum(),
  last_modified: Joi.any().strip(),
  last_checksum: Joi.any().strip(),
  incomplete: Joi.any().strip(),
  name: Joi.string().min(1).max(255),
  identity: Joi.string().min(1).max(255),
  list: Joi.string().min(1).max(255),
  bond_url: Joi.string().uri({scheme: ['http', 'https']}),
  template_html: Joi.string().min(1).max(100),
  template_plain: Joi.string().min(1).max(100),
  categories: Joi.array().items(Joi.string().min(1).max(100)),
  tags: Joi.array().items(Joi.string().min(1).max(100)),
  scheduling_disabled: Joi.boolean()
};

var send_draft_schema = {
  name: Joi.string().min(1).max(100).required(),
  list: Joi.string().min(1).max(100).required(),
  categories: Joi.array().items(Joi.string().min(1).max(100)),
  identity: Joi.string().min(1).max(100).required(),
  subject: Joi.string().min(1).max(255).required(),
  email_html: Joi.any().required(),
  email_plain: Joi.any().required(),
  at: Joi.string(),
  after: Joi.string()
};

module.exports.register = function (plugin, options, next) {

  plugin.route({
    method: 'get',
    path: '/admin/{param*}',
    handler: function (request, reply) {
      reply.redirect('/nyhedsbreve');
    }
  });

  plugin.route({
    method: 'get',
    path: '/identities',
    handler: function (request, reply) {
      sendgrid.getIdentities(function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data.map(function (identity) {
            return identity.identity;
          }));
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/identities/{id}',
    handler: function (request, reply) {
      sendgrid.getIdentity(request.params.id, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/lists',
    handler: function (request, reply) {
      sendgrid.getLists(function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data.map(function (list) {
            return list.list;
          }));
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/lists/{list}',
    handler: function (request, reply) {
      sendgrid.getList(request.params.list, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/categories',
    handler: function (request, reply) {
      sendgrid.getCategories(function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data.map(function (category) {
            return category.category;
          }));
      });
    }
  });

  // E.g. /categories/stats?start_date=2015-01-01&end_date=2015-01-02&categories=cat1&categories=cat2
  plugin.route({
    method: 'get',
    path: '/categories/stats',
    handler: function (request, reply) {
      sendgrid.getStats(request.url.search, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails',
    handler: function (request, reply) {
      sendgrid.getEmails(request.query.name, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails/schedule/{name}',
    handler: function (request, reply) {
      sendgrid.getEmailSchedule(request.params.name, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'delete',
    path: '/emails/schedule/{name}',
    handler: function (request, reply) {
      sendgrid.deleteEmailSchedule(request.params.name, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails/{name}',
    handler: function (request, reply) {
      sendgrid.getEmail(request.params.name, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'delete',
    path: '/emails/{name}',
    handler: function (request, reply) {
      sendgrid.deleteEmail(request.params.name, function (err, data) {
        if (err)
          reply(err).code(500);
        else
          reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/',
    handler: function (request, reply) {
      mongodb.nyhedsbreve().find({}).toArray(reply);
    }
  });

  plugin.route({
    method: 'get',
    path: '/{ident}',
    handler: function (request, reply) {
      mongodb.nyhedsbreve().findOne({ident: request.params.ident}, function (err, newsletter) {
        if (newsletter !== null) {
          reply(newsletter);
        } else {
          reply().code(404);
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/',
    config: {
        validate: {
            payload: {
              name: Joi.string().min(1).max(100).required()
            }
        }
    },
    handler: function (request, reply) {

      request.payload.ident = slugify(request.payload.name);
      request.payload.incomplete = true;

      mongodb.nyhedsbreve().findOne({ident: request.payload.ident}, function (err, newsletter) {
        if (newsletter === null) {
          mongodb.nyhedsbreve().insertOne(request.payload, function (err, result) {
            if (err) {
              reply(err).code(500);
            } else {
              reply(result.ops[0]);
            }
          });
        } else {
          reply().code(409);
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/{ident}',
    config: {
        validate: {
            params: {
              ident: Joi.string().min(1).max(100)
            },
            payload: newsletter_schema
        }
    },
    handler: function (request, reply) {

      request.payload.incomplete = [
        request.payload.identity,
        request.payload.bond_url,
        request.payload.template_html,
        request.payload.template_plain,
        request.payload.list].some(undefinedOrBlank);

      mongodb.nyhedsbreve().updateOne( {ident: request.params.ident},
        {
          $set: request.payload,
          $currentDate: { "last_modified": true }
      }, function (err, response) {
          if (response.result.nModified === 1) {
          reply();
        } else {
          reply().code(404);
        }
      });

      function undefinedOrBlank (input) {
        return input === undefined ||
          (typeof input === 'string' ? input.length === 0 : false);
      }
    }
  });

  plugin.route({
    method: 'put',
    path: '/{ident}',
    config: {
      validate: {
        params: {
          ident: Joi.string().min(1).max(100)
        },
        payload: newsletter_schema
      }
    },
    handler: function (request, reply) {
      mongodb.nyhedsbreve().replaceOne({ident: request.params.ident},
        request.payload,
        function (err, response) {
          if (response.result.nModified === 1) {
            mongodb.nyhedsbreve().updateOne(
              {ident: request.params.ident},
              {$currentDate: { "last_modified": true }});

            reply();
          } else {
            reply().code(404);
          }
      });
    }
  });

  plugin.route({
    method: 'delete',
    path: '/{ident}',
    config: {
      validate: {
        params: {
          ident: Joi.string().min(1).max(100)
        }
      }
    },
    handler: function (request, reply) {
      mongodb.nyhedsbreve().deleteOne({ident: request.params.ident}, function (err, response) {
        if (err) {
            return reply(err);
        }

        if (response.result.n === 1) {
          reply();
        } else {
          reply().code(404);
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/draft',
    config: {
      validate: {
        payload: send_draft_schema
      }
    },
    handler: function (request, reply) {
      sendgrid.createMarketingEmail(request.payload, function (err, result) {
        if (err) {
          reply(err).code(err.statusCode ? err.statusCode : 500);
        } else {
          reply(result);
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/send',
    config: {
      validate: {
        payload: send_draft_schema
      }
    },
    handler: function (request, reply) {

      sendgrid.sendMarketingEmail(request.payload, function (err, result) {
        if (err) {
          reply(err).code(err.statusCode ? err.statusCode : 500);
        } else {
          reply(result);
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/{ident}/send',
    config: {
      validate: {
        params: {
          ident: Joi.string().min(1).max(100)
        }
      }
    },
    handler: function (request, reply) {
      mongodb.nyhedsbreve().findOne({ident: request.params.ident}, function (err, newsletter) {
        if (err) return reply(err).code(500);
        if (newsletter === null) return reply().code(404);
        if (newsletter.scheduling_disabled === true) return reply().code(403);

        templates.bond(newsletter.bond_url, function (err, data) {
          if (err) return reply(err).code(500);

          var new_checksum = calculateChecksum(data);

          if (new_checksum === newsletter.last_checksum) {
            var message = 'Last checksum is identical for newsletter ' + newsletter.name;
            console.log(message);
            return reply({ message: message }).code(400);
          }

          var nyhedsbrev = {
            list: newsletter.list,
            identity: newsletter.identity,
            subject: data.subject,
            after: 5
          };

          var schedule = moment().add(nyhedsbrev.after, 'minutes');
          data.timestamp = schedule.unix();
          nyhedsbrev.email_html = templates.render(newsletter.template_html, data);
          nyhedsbrev.email_plain = templates.render(newsletter.template_plain, data);
          nyhedsbrev.name = newsletter.name + ' ' + schedule.format("ddd D MMM YYYY HH:mm");

          sendgrid.sendMarketingEmail(nyhedsbrev, function (err, result) {
            if (err) return reply(err).code(500);

            mongodb.nyhedsbreve().updateOne({ident: request.params.ident},
              {$set: {'last_checksum': new_checksum}},
              function (err, result) {
                if (err) console.log(err);
            });

            result.message = 'Sent';
            result.name = nyhedsbrev.name;
            reply(result);
          });
        });
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/{ident}/clear_last_checksum',
    config: {
      validate: {
        params: {
          ident: Joi.string().min(1).max(100)
        }
      }
    },
    handler: function (request, reply) {
      mongodb.nyhedsbreve().updateOne({ident: request.params.ident},
        {$unset: {'last_checksum': ''}},
        function (err, result) {
          if (err) {
            reply(err).code(500);
          } else if (result.nModified === 1) {
            reply()
          } else {
            reply().code(404);
          }
        }
      );
    }
  });

  next();
};

module.exports.register.attributes = {
    name: 'newsletters',
    version: '1.0.0'
};


function slugify (name) {
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}


function calculateChecksum (data) {
  if (data === null) return '';
  if (data.type === 'nodequeue' || data.type === 'latest_news') {

    var temp = data.nodes.map(function (node) {
      return node.id;
    });

    // It's safer jo test against only the five articles
    var temp2 = temp.slice(0, 5);

    return checksum(JSON.stringify(temp2));

  } else {
    return checksum(JSON.stringify(data.id));
  }
}
