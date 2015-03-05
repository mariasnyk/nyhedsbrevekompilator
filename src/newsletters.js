/*jshint node: true */

'use strict';

var http = require('http'),
    https = require('https'),
    url = require('url'),
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
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data.map(function (identity) {
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
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
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
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data.map(function (category) {
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
      callSendGridV3('GET', '/v3/categories/stats' + request.url.search, function (err, data) {
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails',
    handler: function (request, reply) {
      var body = request.query.name ? 'name=' + request.query.name : '';

      callSendGrid('/api/newsletter/newsletter/list.json', body, function (err, data) {
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails/schedule/{name}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/schedule/get.json', 'name=' + encodeURIComponent(request.params.name), function (err, data) {
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
      });
    }
  });

  plugin.route({
    method: 'delete',
    path: '/emails/schedule/{name}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/schedule/delete.json', 'name=' + encodeURIComponent(request.params.name), function (err, data) {
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
      });
    }
  });

  plugin.route({
    method: 'get',
    path: '/emails/{name}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/newsletter/get.json', 'name=' + encodeURIComponent(request.params.name), function (err, data) {
        if (err) {
          console.log(err)
          reply(err).code(500);
        } else reply(data);
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

          var data = convertPayloadToDate(request.payload);

          insertNewsletter(ident, data, function (err, result) {
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

          var data = convertPayloadToDate(request.payload);

          updateNewsletter(request.params.ident, data, function (err, result) {
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
    path: '/{ident}/send',
    handler: function (request, reply) {
      queryOneNewsletter(request.params.ident, function (err, newsletter) {
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


function slugify (name) {
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}


function convertPayloadToDate (payload) {
  var newsletter = {
    name: payload.name,
    identity: payload.identity,
    bond_url: payload.bond_url,
    bond: url.parse(payload.bond_url !== undefined ? payload.bond_url : '', true),
    template_html: payload.template_html,
    template_plain: payload.template_plain,
    categories: payload.categories,
    list: payload.list
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
        name: data.name
      }
    }));
  });
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
      callback({ message: 'Last checksum is identical' });
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

  var html_url  = 'http://' + request.info.host + '/templates/' + newsletter.template_html + '?u=' + encodeURIComponent(newsletter.bond_url),
      plain_url = 'http://' + request.info.host + '/templates/' + newsletter.template_plain + '?u=' + encodeURIComponent(newsletter.bond_url);

  download(html_url, function (err, email_html, headers) {
    if (err) return callback(err);

    newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
    newsletter.email_html = email_html;

    download(plain_url, function (err, email_plain) {
      if (err) return callback(err);

      newsletter.email_plain = email_plain;

      newsletter.after = 15;
      newsletter.name = newsletter.name + ' ' + dkDateString();

      sendNewsletter(newsletter, callback);
    });
  });
}


function sendNewsletter (newsletter, callback) {

  validateLastChecksum(newsletter.list, newsletter.checksum, function (err) {
    if (err) return callback(err);

    createMarketingEmail (newsletter, function (err, result) {
      if (err) return callback(err);

      addSendGridSchedule(newsletter.name, newsletter.after, function (err) {
        if (err) return callback(err);

        updateLastChecksum(newsletter.list, newsletter.checksum, function (err) {
          if (err) callback(err);
          else callback(null, { message: 'Sent' });
        });
      });
    });
  });
}


function createMarketingEmail (newsletter, callback) {

  validateNewsletterInputData(newsletter, function (err) {
    if (err) {
      console.log(err);
      return callback({ error: 'Error when validating input for marketing email.', errors: err.errors });
    }

    addSendGridMarketingEmail(newsletter.identity, newsletter.name, newsletter.subject, newsletter.email_plain, newsletter.email_html, function (err, result) {
      if (err) {
        console.log(err);
        //return callback({ error: 'Error when creating new marketing email.' });
        return callback(err);
      }

      // Adding the newsletter name as a mandatory category
      if (newsletter.categories === undefined || newsletter.categories === null) {
        newsletter.categories = [];
      }

      newsletter.categories.forEach(function (category) {
        addSendGridCategory(category, newsletter.name);
      });

      addSendGridRecipients(newsletter.list, newsletter.name, function (err, result) {
        if (err) {
          console.log(err);
          return callback({ error: 'Error when adding recipients to marketing email.' });
        }

        callback(null, result);
      });
    });
  });
}

function dkDateString () {
  var a = new Date();
  return danishDayName(a.getUTCDay()) + ' ' + a.getUTCDate() + ' ' + danishMonthName(a.getUTCMonth() + 1) + ' ' + a.getFullYear();
}

function danishDayName (day) {
  switch (day) {
    case 1: return 'Man';
    case 2: return 'Tir';
    case 3: return 'Ons';
    case 4: return 'Tor';
    case 5: return 'Fre';
    case 6: return 'Lør';
    case 7: return 'Søn';
  }
}

function danishMonthName (month) {
  switch (month) {
    case 1: return 'Jan';
    case 2: return 'Feb';
    case 3: return 'Mar';
    case 4: return 'Apr';
    case 5: return 'Maj';
    case 6: return 'Jun';
    case 7: return 'Jul';
    case 8: return 'Aug';
    case 9: return 'Sep';
    case 10: return 'Okt';
    case 11: return 'Nov';
    case 12: return 'Dec';
  }
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


function addSendGridSchedule (name, after, callback) {

  if (typeof after === 'function' && callback === undefined) {
    callback = after;
    after = null;
  }

  var body = 'name=' + encodeURIComponent(name);// +
    //(after !== undefined && after !== null && after !== '' ? '&after=' + after : '');

  if (after !== null) {
    var temp = Number.parseInt(after);

    if (temp === NaN || temp < 0) {
      return callback({ message: 'Field after (' + after + ') is not a valid positive number.' });
    } else {
      body = body + '&after=' + temp.toString();
    }
  }

  callSendGrid('/api/newsletter/schedule/add.json', body, callback);
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

//  console.log('Basic ' + authorization);
//https://api.sendgrid.com/v3/categories/stats?aggregated_by=month&categories=BT+Mode+%26+Sk%C3%B8nhed&end_date=2015-02-23&start_date=2015-01-24
//                                            ?aggregated_by=month&categories=BT+Mode+%26+Sk%C3%B8nhed&end_date=2015-02-23&start_date=2015-01-24
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