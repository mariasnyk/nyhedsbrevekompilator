/*jshint node: true */
'use strict';

var http = require('http'),
    checksum = require('checksum'),
    sendgrid = require('./sendgrid_helper.js'),
    url = require('url'),
    moment = require('moment'),
    userdb = require('./userdb_client.js'),
    templates = require('./templates.js');

moment.locale('da');

module.exports.register = function (plugin, options, next) {

  plugin.route({
    method: 'get',
    path: '/admin/{param*}',
    handler: {
      directory: {
        path: 'admin',
        index: true
      }
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
    method: 'get',
    path: '/',
    handler: function (request, reply) {
      queryAllNewsletters(function (err, newsletters) {
        if (err)
          reply(err).code(500);
        else
          reply(newsletters);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/{ident}',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.ident, function (err, newsletter) {
        if (err) return reply(err).code(500);
        else if (newsletter === null)
          reply().code(404);
        else
          reply(newsletter);
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/',
    handler: function (request, reply) {
      if (request.payload.name === undefined || request.payload.name === null || request.payload.name === '') {
        return reply('Field name missing').code(400);
      }

      var ident = slugify(request.payload.name);

      queryOneNewsletter(ident, function (err, result) {
        if (result === null) {

          var newsletter = convertPayloadToNewsletter(request.payload);

          insertNewsletter(ident, newsletter, function (err, result) {
            if (err) {
              console.log(err);
              reply(err).code(500);
            } else {
              reply({ message: 'Inserted', ident: ident, id: result.insertId });
            }
          });
        }
      });
    }
  });

  plugin.route({
    method: ['post','put'],
    path: '/{ident}',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.ident, function (err, result) {
        if (err) {
          console.log(err);
          reply(err).code(500);
        } else if (result === null) {
          reply({ message: 'Newsletter ' + request.params.ident + ' does not exists'}).code(404);
        } else {

          var newsletter = convertPayloadToNewsletter(request.payload);

          updateNewsletter(request.params.ident, newsletter, function (err, result) {
            if (err) {
              console.log(err);
              reply(err).code(500);
            } else {
              reply({ message: 'Updated' });
            }
          });
        }
      });
    }
  });

  plugin.route({
    method: 'delete',
    path: '/{ident}',
    handler: function (request, reply) {
      deleteNewsletter(request.params.ident, function (err, result) {
        if (err) {
          console.log(err);
          reply().code(500);
        } else if (result.affectedRows === 0) {
          reply().code(404);
        } else {
          reply();
        }
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/draft',
    config: {
      validate: {
        payload: validateNewsletterPayload
      }
    },
    handler: function (request, reply) {
      sendgrid.createMarketingEmail(request.payload, function (err, result) {
        if (err) reply(err).code(500);
        else reply(result);
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/send',
    config: {
      validate: {
        payload: validateNewsletterPayload
      }
    },
    handler: function (request, reply) {
      var newsletter = request.payload;

      sendgrid.sendMarketingEmail(newsletter, function (err, result) {
        if (err) return reply(err).code(500);
        else reply({ message: 'Sent' });
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/{ident}/send',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.ident, function (err, newsletter) {
        if (err) return reply(err).code(500);
        if (newsletter === null) return reply().code(404);
        if (newsletter.scheduling_disabled === true) return reply().code(403);

        templates.bond(newsletter.bond_url, function (err, data) {
          if (err) return reply(err).code(500);

          newsletter.subject = data.subject;
          newsletter.email_html = templates.render(newsletter.template_html, data);
          newsletter.email_plain = templates.render(newsletter.template_plain, data);
          newsletter.after = 5;
          newsletter.name = newsletter.name + ' ' + moment().format("ddd D MMM YYYY HH:mm");

          var checksum = calculateChecksum(data);

          validateLastChecksum(newsletter.list, checksum, function (err) {
            if (err) return reply(err).code(500);

            sendgrid.sendMarketingEmail(newsletter, function (err, result) {
              if (err) return reply(err).code(500);

              updateLastChecksum(newsletter.list, checksum, function (err) {
                if (err) return reply(err).code(500);
                else {
                  result.message = 'Sent';
                  result.name = newsletter.name;
                  reply(result);
                }
              });
            });
          });
        });
      });
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


function convertPayloadToNewsletter (payload) {
  var newsletter = {
    name: payload.name,
    identity: payload.identity,
    bond_url: payload.bond_url,
    bond: url.parse(payload.bond_url !== undefined ? payload.bond_url : '', true),
    template_html: payload.template_html,
    template_plain: payload.template_plain,
    categories: payload.categories,
    list: payload.list,
    scheduling_disabled: payload.scheduling_disabled
  };

  return new Buffer(JSON.stringify(newsletter)).toString('base64');
}


function queryAllNewsletters (callback) {
  var sql = [
    'SELECT ident, data',
    'FROM mashed_composer',
    'ORDER BY ident ASC'].join(' ');

  userdb.query(sql, function (err, result) {
    if (err) return callback(err);

    callback(null, result.map(function (newsletter) {
      var data = JSON.parse(new Buffer(newsletter.data, 'base64').toString('utf8'));
      return {
        ident: newsletter.ident,
        name: data.name,
        list: data.list,
        categories: data.categories,
        incomplete: [data.identity, data.bond_url, data.template_html, data.template_plain, data.list].some(undefinedOrBlank)
      };
    }));
  });
}


function undefinedOrBlank (input) {
  return input === undefined ||
    (typeof input === 'string' ? input.length === 0 : false);
}


function queryOneNewsletter (ident, callback) {
  var sql = [
    'SELECT ident, data',
    'FROM mashed_composer',
    'WHERE ident = ' + userdb.escape(ident)].join(' ');

  userdb.queryOne(sql, function (err, result) {
    if (err) return callback(err);
    else if (result === null)
      callback(null, null);
    else {
      var newsletter = JSON.parse(new Buffer(result.data, 'base64').toString('utf8'));
      callback(null, newsletter);
    }
  });
}


function insertNewsletter (ident, data, callback) {
  var sql = [
    'INSERT INTO mashed_composer',
    '(ident, data)',
    'VALUES (',
    userdb.escape(ident) + ',',
    userdb.escape(data) + ')'].join (' ');

  userdb.query(sql, callback);
}


function updateNewsletter (ident, data, callback) {
  var sql = [
    'UPDATE mashed_composer',
    'SET data = ' + userdb.escape(data),
    'WHERE ident = ' + userdb.escape(ident)].join (' ');

  userdb.query(sql, callback);
}


function deleteNewsletter (ident, callback) {
  var sql = 'DELETE FROM mashed_composer WHERE ident = ' + userdb.escape(ident);
  userdb.query(sql, callback);
}


function validateLastChecksum (list, checksum, callback) {
  var sql = 'SELECT last_checksum FROM mashed_composer_checksums WHERE list = ' + userdb.escape(list);

  userdb.queryOne(sql, function (err, result) {
    if (result !== null && result.last_checksum === checksum) {
      var message = 'Last checksum is identical for recipient list ' + list;
      console.log(message);
      callback({ message: message });
    } else {
      callback(null, { message: 'Checksum OK' });
    }
  });
}


function updateLastChecksum (list, checksum, callback) {
  var sql = [
    'INSERT INTO mashed_composer_checksums (list, last_checksum)',
    'VALUES (',
    [userdb.escape(list), userdb.escape(checksum)].join(','),
    ')',
    'ON DUPLICATE KEY UPDATE',
    'last_checksum = ', userdb.escape(checksum)
  ].join(' ');

  userdb.query(sql, callback);
}


function validateNewsletterPayload (value, options, next) {
  var errors = [];

  if (value.list === undefined)
    errors.push('Field list is missing.');

  if (value.identity === undefined)
    errors.push('Field identity is missing.');

  if (value.subject === undefined)
    errors.push('Field subject is missing.');

  if (value.email_html === undefined)
    errors.push('Field email_html is missing.');

  if (value.email_plain === undefined)
    errors.push('Field email_plain is missing.');

  if (errors.length > 0)
    next({ message: errors.join(' '), errors: errors});
  else
    next();
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
