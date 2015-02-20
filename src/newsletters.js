/*jshint node: true */

'use strict';

var http = require('http'),
    https = require('https'),
    mdb = require('./mdb_client.js'),
    userdb = require('./userdb_client.js');


module.exports.register = function (plugin, options, next) {

  plugin.route({
    method: 'get',
    path: '/admin/{param*}',
    handler: {
      directory: {
        path: 'src/admin',
        index: true
      }
    }
  });

  plugin.route({
    method: 'get',
    path: '/identities',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/identity/list.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (identity) {
          return identity.identity;
        }));
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/identities/{id}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/identity/get.json', 'identity=' + request.params.id, function (err, data) {
        if (err) return reply(err).code(500);
        reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/lists',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/lists/get.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (list) {
          return list.list;
        }));
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/lists/{list}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/lists/get.json', 'list=' + request.params.list, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/categories',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/category/list.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (category) {
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
      callSendGridV3('GET', '/v3/categories/stats?' + request.url.search, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails',
    handler: function (request, reply) {
      var body = request.query.name ? 'name=' + request.query.name : '';

      callSendGrid('/api/newsletter/newsletter/list.json', body, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails/{name}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/newsletter/get.json', 'name=' + request.params.name, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/',
    handler: function (request, reply) {
      userdb.query('SELECT id, name FROM mashed_composer ORDER BY name ASC', function (err, result) {
        if (err) return reply(err);

        reply(result.map(function (newsletter) {
          return newsletter.name;
        }));
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/{name}',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.name, function (err, newsletter) {
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
    handler: saveNewsletter
  });

  plugin.route({
    method: ['post','put'],
    path: '/{name}',
    handler: saveNewsletter
  });

  plugin.route({
    method: 'delete',
    path: '/{name}',
    handler: deleteNewsletter
  });

  plugin.route({
    method: 'post',
    path: '/draft',
    handler: function (request, reply) {
      createMarketingEmail (request.payload, function (err, result) {
        if (err) reply(err).code(400);
        else reply(result);
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/send',
    handler: function (request, reply) {
      sendNewsletter(request.payload, function (err, result) {
        if (err) reply(err).code(400);
        else reply(result);
      });
    }
  });

  plugin.route({
    method: 'post',
    path: '/{name}/send',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.name, function (err, newsletter) {
        if (err) return reply(err).code(500);
        if (newsletter === null) return reply().code(404);

        autoSendNewsletter(newsletter, function (err, result) {
          if (err) reply(err).code(500);
          else reply(result);
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


function queryOneNewsletter (name, callback) {

  var sql = [
    'SELECT data',
    'FROM mashed_composer',
    'WHERE name = ' + userdb.escape(name)].join(' ');

  userdb.queryOne(sql, function (err, result) {
    if (err) return callback(err);
    else if (result === null)
      callback(null, null);
    else {
      var newsletter = JSON.parse(new Buffer(result.data, 'base64').toString('utf8'));
      newsletter.name = name;
      callback(null, newsletter);
    }
  });
}


function saveNewsletter (request, reply) {

  var name = request.params.name ? request.params.name : request.payload.name;

  if (name === undefined || name === null || name === '') {
    return reply('Field name missing').code(400);
  }

  var newsletter = {
    name: name,
    identity: request.payload.identity,
    bond_id: request.payload.bond_id,
    bond_type: request.payload.bond_type,
    template_html: request.payload.template_html,
    template_plain: request.payload.template_plain,
    categories: request.payload.categories,
    list: request.payload.list
  };

  var data = new Buffer(JSON.stringify(newsletter)).toString('base64')

  var findExisting = 'SELECT id FROM mashed_composer WHERE name = ' + userdb.escape(name),
      sql = '';

  userdb.queryOne(findExisting, function (err, result) {
    if (err) {
      console.log(err);
      reply().code(500);
      return;

    } else if (result === null) {

      sql = [
        'INSERT INTO mashed_composer',
        '(name, data)',
        'VALUES (',
        userdb.escape(name) + ',',
        userdb.escape(data) + ')'].join (' ');

    } else {

      sql = [
        'UPDATE mashed_composer',
        'SET data = ' + userdb.escape(data),
        'WHERE id = ' + result.id].join (' ');
    }

    userdb.query(sql, function (err, result) {
      if (err) {
        console.log(err);
        reply().code(500);
      } else {
        if (result.insertId === 0)
          reply({ message: 'Updated'});
        else
          reply({ message: 'Inserted', id: result.insertId});
      }
    });
  });
}


function deleteNewsletter (request, reply) {

  var sql = 'DELETE FROM mashed_composer WHERE name = ' + userdb.escape(request.params.name);

  userdb.query(sql, function (err, result) {
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


function validateLastChecksum (name, checksum, callback) {

  var sql = 'SELECT last_checksum FROM mashed_composer WHERE name = ' + userdb.escape(name);

  userdb.queryOne(sql, function (err, result) {
    if (result.last_checksum === checksum) {
      callback({message: 'Last checksum is identical.'});
    } else {
      updateLastChecksum(name, checksum, callback);
    }
  });
}


function updateLastChecksum (name, checksum, callback) {

  var sql = 'UPDATE mashed_composer SET last_checksum = ' + userdb.escape(checksum) + ' WHERE name = ' + userdb.escape(name);
  userdb.query(sql, callback);
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
      callback(null, data, response.headers);
    });
  }).on('error', function(e) {
    console.log('Got error while requesting HTML (' + url + '): ' + e.message);
    callback(e, null);
  });
}


function autoSendNewsletter (newsletter, callback) {

  newsletter.at = new Date(new Date().getTime() + 15*60000);

  var html_url  = 'http://' + request.info.host + '/templates/' + newsletter.template_html + '?' + newsletter.bond_type + '=' + newsletter.bond_id,
      plain_url = 'http://' + request.info.host + '/templates/' + newsletter.template_plain + '?' + newsletter.bond_type + '=' + newsletter.bond_id;

  download(html_url, function (err, email_html, headers) {
    if (err) return callback(err);

    newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
    newsletter.email_html = email_html;

    download(plain_url, function (err, email_plain) {
      if (err) return callback(err);

      newsletter.email_plain = email_plain;

      sendNewsletter(newsletter, callback);
    });
  });
}


function sendNewsletter (newsletter, callback) {

  validateLastChecksum(newsletter.name, newsletter.checksum, function (err) {
    if (err) return callback(err);

    createMarketingEmail (newsletter, function (err, result) {
      if (err) return callback(err);

      addSendGridSchedule(result.name, newsletter.at, function (err) {
        if (err) return callback(err);

        callback(null, result);
      });
    });
  });
}


function createMarketingEmail (data, callback) {

  validateNewsletterInputData(data, function (err) {
    if (err) {
      console.log(err);
      return callback({ error: 'Error when validating input for marketing email.', errors: err.errors });
    }

    var name = data.name + '_' + Date.now();

    addSendGridMarketingEmail(data.identity, name, data.subject, data.email_plain, data.email_html, function (err, result) {
      if (err) {
        console.log(err);
        return callback({ error: 'Error when creating new marketing email.' });
      }

      // Adding the newsletter name as a mandatory category
      if (data.categories !== undefined && data.categories !== null && data.categories.indexOf(data.name) === -1) {
        data.categories.push(data.name);
      }

      data.categories.forEach(function (category) {
        addSendGridCategory(category, name);
      });

      addSendGridRecipients(data.list, name, function (err, result) {
        if (err) {
          console.log(err);
          return callback({ error: 'Error when adding recipients to marketing email.' });
        }

        result.name = name;
        callback(null, result);
      });
    });
  });
}


function validateNewsletterInputData (data, callback) {
  var errors = [];

  if (data.list === undefined)
    errors.push('Field list is missing.');

  if (data.identity === undefined)
    errors.push('Field identity is missing.');

  if (data.subject === undefined)
    errors.push('Field subject is missing.');

  if (data.email_html === undefined)
    errors.push('Field email_html is missing.');

  if (data.email_plain === undefined)
    errors.push('Field email_plain is missing.');

  if (callback !== undefined && typeof callback === 'function') {
    callback(errors.length > 0 ? {errors: errors} : null);
  }

  return errors.length === 0;
}


function createSendGridCategory (category, callback) {

  var body = 'category=' + encodeURIComponent(category);
  callSendGrid('/api/newsletter/category/create.json', body, callback);
}


function addSendGridCategory (category, name, callback) {

  var body =
    'category=' + encodeURIComponent(category) +
    '&name=' + encodeURIComponent(name);

  callSendGrid('/api/newsletter/category/add.json', body, function (err, data) {

    if (err) {
      // Example: {"error": "Category donkey1 does not exist"}
      if (err.error == 'Category ' + category + ' does not exist') {
        createSendGridCategory(category, function (err, data) {
          addSendGridCategory (category, name, callback);
        });
      } else if (callback !== undefined && typeof callback === 'function' ) {
        callback(err, null);
      }
    } else if (callback !== undefined && typeof callback === 'function' ) {
      callback (null, data);
    }
  });
}


function addSendGridMarketingEmail (identity, name, subject, text, html, callback) {

  var body =
    'identity=' + identity +
    '&name=' + encodeURIComponent(name) +
    '&subject=' + encodeURIComponent(subject) +
    '&text=' + encodeURIComponent(text) +
    '&html=' + encodeURIComponent(html);

  callSendGrid('/api/newsletter/add.json', body, callback); 
}


function addSendGridRecipients (list, name, callback) {

  var body =
    'list=' + encodeURIComponent(list) +
    '&name=' + encodeURIComponent(name);

  callSendGrid('/api/newsletter/recipients/add.json', body, callback); 
}


function addSendGridSchedule (name, at, callback) {

  if (typeof at === 'function' && callback === undefined) {
    callback = at;
    at = null;
  }

  if (at !== null) {
    try {
      if (Date.parse(at) === NaN) {
        return callback({ message: 'Field at (' + at + ') is not a valid date.' });
      }
    } catch (ex) {
      return callback({ message: 'Field at (' + at + ') is not a valid date.' });
    }
  }

  var body =
    'name=' + encodeURIComponent(name) +
    (at !== undefined && at !== null && at !== '' ? '&at=' + at : '');

  callSendGrid('/api/newsletter/schedule/add.json', body, callback)
}


function callSendGrid (path, body, callback) {

  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = '';
  }

  if (body === null)
    body = '';
  else if (body !== '')
    body = body + '&';

  body = body + 'api_user=' + encodeURIComponent(process.env.SENDGRID_API_USER) + '&api_key=' + encodeURIComponent(process.env.SENDGRID_API_KEY);

  var options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  var req = https.request(options, parseReponse(callback));

  req.write(body);
  req.end();

  req.on('error', function (e) {
    callback(e);
  });
}


function callSendGridV3 (method, path, body, callback) {

  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = '';
  }

  var authorization = new Buffer(process.env.SENDGRID_API_USER + ':' + process.env.SENDGRID_API_KEY).toString('base64');

  var options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Authorization': 'Basic ' + authorization
    }
  };

  var req = https.request(options, parseReponse(callback));

  req.write(body === null ? '' : body);
  req.end();

  req.on('error', function (e) {
    callback(e);
  });
}


function parseReponse (callback) {
  return function (res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function () {
      try {
        data = JSON.parse(data);
      } catch (ex) {
        console.log('JSON parse error on: ', data);
        throw ex;
      }

      if (data.error || res.statusCode > 300)
        callback(data, null);
      else
        callback(null, data);
    });
  };
}