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
    handler: draftNewsletter
  });

  plugin.route({
    method: 'post',
    path: '/send',
    handler: sendNewsletter
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


function updateScheduledNyhedsbrevLastChecksum (nyhedsbrev_id, last_checksum, callback) {

  var sql = 'UPDATE mdb_nyhedsbrev SET last_checksum = "' + last_checksum + '" WHERE nyhedsbrev_id = ' + nyhedsbrev_id;
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


// function adhocNewsletter (request, reply) {

//   var data = request.payload;

//   if (data.list === undefined)
//     return reply( { message: 'Field list is missing.' } ).code(400);

//   if (data.identity === undefined)
//     return reply( { message: 'Field identity is missing.' } ).code(400);

//   if (data.subject === undefined)
//     return reply( { message: 'Field subject is missing.' } ).code(400);

//   if (data.bond_type === undefined)
//     return reply( { message: 'Field bond_type is missing.' } ).code(400);

//   if (data.bond_id === undefined)
//     return reply( { message: 'Field bond_id is missing.' } ).code(400);

//   if (data.template_html === undefined)
//     return reply( { message: 'Field template_html is missing.' } ).code(400);

//   if (data.template_plain === undefined)
//     return reply( { message: 'Field template_plain is missing.' } ).code(400);

//   if (data.name === undefined)
//     data.name = 'newsletter_' + Date.now();


//   var createDraft = data.draft !== undefined &&
//         typeof data.draft === 'boolean' ? data.draft : 
//         typeof data.draft === 'string' ? data.draft === 'true' :
//         false;

//   var html_url  = 'http://' + request.info.host + '/templates/' + data.template_html + '?' + data.bond_type + '=' + data.bond_id,
//       plain_url = 'http://' + request.info.host + '/templates/' + data.template_plain + '?' + data.bond_type + '=' + data.bond_id;

//   if (process.env.LIVE === 'true') {
//     // Leave it
//   } else if (process.env.TEST_LIST) {
//     data.list = process.env.TEST_LIST;
//   } else {
//     data.list = 'Daniel'; // TODO: This is for testing
//   }

//   download(html_url, function (err, html_email) {
//     if (err) return reply(err);

//     download(plain_url, function (err, plain_email) {
//       if (err) return reply(err);

//       addSendGridMarketingEmail(data.identity, data.name, data.subject, plain_email, html_email, function (err, result) {
//         if (err) return reply(err).code(400);

//         addSendGridRecipients(data.list, data.name, function (err, result) {
//           if (err) return reply(err).code(400);

//           if (createDraft) {
//             reply({message: 'Draft created.', name: data.name});
//           } else {
//             addSendGridSchedule(data.name, function (err, result) {
//               if (err) return reply(err).code(400);

//               reply({message: 'Email sent.', name: data.name});
//             });
//           }
//         })
//       });
//     })
//   });
// }



// function scheduledNewsletter (request, reply) {
  
//   queryOneNewsletter(request.params.id, function (err, newsletter) {

//     if (newsletter.template_html === undefined || newsletter.template_html === null ||
//         newsletter.template_plain === undefined || newsletter.template_plain === null ||
//         newsletter.identity === undefined || newsletter.identity === null ||
//         newsletter.bond_type === undefined || newsletter.bond_type === null ||
//         newsletter.bond_id === undefined || newsletter.bond_id === null) {

//       return reply( { message: 'Newsletter not configured' } ).code(400);
//     }

//     var list = '',
//         name = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id + '_' + Date.now(),
//         html_url  = 'http://' + request.info.host + '/templates/' + newsletter.template_html + '?' + newsletter.bond_type + '=' + newsletter.bond_id,
//         plain_url = 'http://' + request.info.host + '/templates/' + newsletter.template_plain + '?' + newsletter.bond_type + '=' + newsletter.bond_id;

//     if (process.env.LIVE === 'true') {
//       list = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id;
//     } else if (process.env.TEST_LIST) {
//       list = process.env.TEST_LIST;
//     } else {
//       list = 'Daniel'; // TODO: This is for testing
//     }

//     download(html_url, function (err, html_email, headers) {

//       var subject = decodeURIComponent(headers['x-subject-suggestion']),
//           checksum = headers['x-content-checksum'];

//       if (newsletter.last_checksum !== undefined && checksum === newsletter.last_checksum) {
//         return reply({ message: 'Newsletter checksum conflict', checksum: checksum }).code(409);
//       }

//       download(plain_url, function (err, plain_email) {

//         addSendGridMarketingEmail(newsletter.identity, name, subject, plain_email, html_email, function (err, result) {
//           if (err) return reply(err);

//           addSendGridCategory('mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id, name);
//           addSendGridCategory(newsletter.nyhedsbrev_navn, name);
//           addSendGridCategory(newsletter.publisher_navn, name);


//           addSendGridRecipients(list, name, function (err, result) {
//             if (err) return reply(err);

//             addSendGridSchedule(name, function (err, result) {
//               if (err) return reply(err);

//               updateScheduledNyhedsbrevLastChecksum(request.params.id, checksum);

//               reply({message: 'Email sent.', name: name});
//             });
//           })
//         });
//       });
//     });
//   });
// }


function draftNewsletter (request, reply) {

  var data = request.payload;

  doTheLifting (data, function (err, result) {
    if (err) return reply(err).code(400);

    reply(result);
  });
}


function sendNewsletter (request, reply) {

  var data = request.payload;

  doTheLifting (data, function (err, result) {
    if (err) return reply(err).code(400);

    addSendGridSchedule(result.name, data.at, function (err) {
      if (err) return reply(err).code(400);

      reply(result);
    });
  });
}


function doTheLifting (data, callback) {

  if (process.env.LIVE !== 'true') {
    if (!process.env.TEST_LIST) {
      return callback("No TEST recipient list in env.")
    } else {
      data.list = process.env.TEST_LIST;
    }
  }

  validateNewsletterInputData(data, function (err) {
    if (err) return callback(err);

    var name = data.name + '_' + Date.now();


    addSendGridMarketingEmail(data.identity, name, data.subject, data.email_plain, data.email_html, function (err, result) {
      if (err) return callback(err);

      // Adding the newsletter name as a mandatory category
      if (data.categories.indexOf(data.name) === -1) {
        data.categories.push(data.name);
      }

      data.categories.forEach(function (category) {
        addSendGridCategory(category, name);
      });

      addSendGridRecipients(data.list, name, function (err, result) {
        if (err) return callback(err);

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

  var body = 'category=' + category;
  callSendGrid('https://api.sendgrid.com/api/newsletter/category/create.json', body, callback);
}


function addSendGridCategory (category, name, callback) {

  var body =
    'category=' + encodeURIComponent(category) +
    '&name=' + encodeURIComponent(name);

  callSendGrid('/api/newsletter/category/add.json', body, function (err, data) {

    if (err) {
      // {"error": "Category donkey1 does not exist"}
      if (err.error = 'Category ' + category + ' does not exist') {
        createSendGridCategory(category, function (err, data) {
          addSendGridCategory (category, name, callback);
        });
      } else {
        if (callback !== undefined && typeof callback === 'function' ) {
          callback(err, null);
        }
      }
    }

    if (callback !== undefined && typeof callback === 'function' ) {
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
  var data = '';

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

  var req = https.request(options, function(res) {

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function() {
      data = JSON.parse(data);
      if (data.error || res.statusCode > 300)
        callback(data, null);
      else
        callback(null, data);
    });
  });

  req.write(body);
  req.end();

  req.on('error', function(e) {
    callback(e);
  });
}
