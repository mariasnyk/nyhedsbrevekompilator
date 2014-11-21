/*jshint node: true */

'use strict';

var http = require('http'),
    https = require('https'),
    // eventEmitter = require('events').EventEmitter,
    // workerEmitter = new eventEmitter(),
    mdb = require('../../mdb_client.js'),
    userdb = require('../../userdb_client.js');

module.exports = [
  {
    method: 'get',
    path: '/sendgrid/identities',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/identity/list.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (identity) {
          return identity.identity;
        }));
      });
    }
  },{
    method: 'get',
    path: '/sendgrid/identities/{id}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/identity/get.json', 'identity=' + request.params.id, function (err, data) {
        if (err) return reply(err).code(500);
        reply(data);
      });
    }
  },{
    method: 'get',
    path: '/sendgrid/lists',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/lists/get.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (list) {
          return list.list;
        }));
      });
    }
  },{
    method: 'get',
    path: '/sendgrid/categories',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/category/list.json', function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data.map(function (category) {
          return category.category;
        }));
      });
    }
  },{
    method: 'get',
    path: '/sendgrid/emails',
    handler: function (request, reply) {
      var body = request.query.name ? 'name=' + request.query.name : '';

      callSendGrid('/api/newsletter/newsletter/list.json', body, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  },{
    method: 'get',
    path: '/sendgrid/emails/{name}',
    handler: function (request, reply) {
      callSendGrid('/api/newsletter/newsletter/get.json', 'name=' + request.params.name, function (err, data) {
        if (err) return reply(err).code(500);
        else reply(data);
      });
    }
  },{
    method: 'get',
    path: '/newsletters',
    handler: selectAllNewsletters
  },{
    method: 'get',
    path: '/newsletters/{id}',
    handler: selectNewsletter
  },{
    method: 'post',
    path: '/newsletters',
    handler: saveNewsletter
  },{
    method: ['post','put'],
    path: '/newsletters/{id}',
    handler: saveNewsletter
  // },{
  //   method: 'get',
  //   path: '/newsletters/{id}/subscribers',
  //   handler: selectNewsletterSubscribers
  // },{
  //   method: 'options',
  //   path: '/newsletters/{id}/subscribers',
  //   handler: selectNewsletterSubscribersCount
  // },{
  //   method: 'get',
  //   path: '/newsletters/{id}/subscribers/count',
  //   handler: selectNewsletterSubscribersCount
  },{
    method: ['put','post'],
    path: '/newsletters/send',
    handler: adhocNewsletter
  },{
    method: ['put','post'],
    path: '/newsletters/{id}/send',
    handler: scheduledNewsletter
  // },{
  //   method: 'get',
  //   path: '/newsletters/templates',
  //   handler: listNewsletterTemplates
  }
];

function selectAllNewsletters (request, reply) {
  var sql = [
    'SELECT tbl_nyhedsbrev.*, tbl_publisher.publisher_navn',
    'FROM tbl_nyhedsbrev',
    'LEFT JOIN tbl_publisher ON tbl_publisher.publisher_id = tbl_nyhedsbrev.publisher_id'].join(' ');

  mdb.query(sql, function (err, result) {
    if (err) return reply(err);
    reply(result.rows);
  });
};

function selectNewsletter (request, reply) {

  // TODO: Validate request.params.id
  // Because a GET http://localhost:8000/v0/newsletters/zxc
  // will throw database error: Uncaught error: column "zxc" does not exists

  queryOneNewsletter(request.params.id, function (err, newsletter) {
    if (err) return reply(err).code(509);
    else if (newsletter === null)
      reply().code(404);
    else
      reply(newsletter);
  });
}

function queryOneNewsletter (newsletterId, callback) {
  var sql = [
    'SELECT *',
    'FROM tbl_nyhedsbrev',
    'LEFT JOIN tbl_publisher ON tbl_publisher.publisher_id = tbl_nyhedsbrev.publisher_id',
    'WHERE nyhedsbrev_id = ' + newsletterId].join(' ');

  mdb.queryOne(sql, function (err, tbl_nyhedsbrev) {
    if (err) return callback(err);
    else if (tbl_nyhedsbrev === null)
      callback(null, null);
    else {
      var sql = 'SELECT * FROM mdb_nyhedsbrev WHERE nyhedsbrev_id='+tbl_nyhedsbrev.nyhedsbrev_id;
      userdb.queryOne(sql, function (err, mdb_nyhedsbrev) {

        // Merging results
        if (mdb_nyhedsbrev) {
          Object.keys(mdb_nyhedsbrev).forEach(function (key) {
            tbl_nyhedsbrev[key] = mdb_nyhedsbrev[key];
          });
        }

        if (tbl_nyhedsbrev.list === undefined || tbl_nyhedsbrev.list === null) {
          tbl_nyhedsbrev.list = 'mdb_nyhedsbrev_' + tbl_nyhedsbrev.nyhedsbrev_id;
        }

        callback(null, tbl_nyhedsbrev);
      });
    }
  });
}


function saveNewsletter (request, reply) {
  var newsletter = request.payload;

  if (request.params.id) {
    newsletter.nyhedsbrev_id = request.params.id;
  } 

  if (newsletter.nyhedsbrev_id) {
    // This is when we save the temporary newsletter attributes for use in Fase 1 of Email Marketing.
    
    var sql = [
      'INSERT INTO mdb_nyhedsbrev',
      '(nyhedsbrev_id, identity, bond_type, bond_id, template_html, template_plain)',
      'VALUES (',
      userdb.escape(newsletter.nyhedsbrev_id) + ',',
      userdb.escape(newsletter.identity) + ',',
      userdb.escape(newsletter.bond_type) + ',',
      userdb.escape(newsletter.bond_id) + ',',
      userdb.escape(newsletter.template_html) + ',',
      userdb.escape(newsletter.template_plain) + ')',
      'ON DUPLICATE KEY UPDATE',
      'identity = VALUES(identity),',
      'bond_type = VALUES(bond_type),',
      'bond_id = VALUES(bond_id),',
      'template_html = VALUES(template_html),',
      'template_plain = VALUES(template_plain)'].join (' ');

    userdb.query(sql, function (err, result) {
      if (err) {
        console.log(err);
        reply().code(509);
      } else reply();
    });
  } else {
    reply().code(501);
  }
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


function adhocNewsletter (request, reply) {

  var data = request.payload;

  if (data.list === undefined)
    return reply( { message: 'Field list is missing.' } ).code(400);

  if (data.identity === undefined)
    return reply( { message: 'Field identity is missing.' } ).code(400);

  if (data.subject === undefined)
    return reply( { message: 'Field subject is missing.' } ).code(400);

  if (data.bond_type === undefined)
    return reply( { message: 'Field bond_type is missing.' } ).code(400);

  if (data.bond_id === undefined)
    return reply( { message: 'Field bond_id is missing.' } ).code(400);

  if (data.template_html === undefined)
    return reply( { message: 'Field template_html is missing.' } ).code(400);

  if (data.template_plain === undefined)
    return reply( { message: 'Field template_plain is missing.' } ).code(400);

  if (data.name === undefined)
    data.name = 'newsletter_' + Date.now();


  var createDraft = data.draft !== undefined &&
        typeof data.draft === 'boolean' ? data.draft : 
        typeof data.draft === 'string' ? data.draft === 'true' :
        false

  var html_url  = 'http://' + request.info.host + '/templates/' + data.template_html + '?' + data.bond_type + '=' + data.bond_id,
      plain_url = 'http://' + request.info.host + '/templates/' + data.template_plain + '?' + data.bond_type + '=' + data.bond_id;

  download(html_url, function (err, html_email) {
    if (err) return reply(err);

    download(plain_url, function (err, plain_email) {
      if (err) return reply(err);

      addSendGridMarketingEmail(data.identity, data.name, data.subject, plain_email, html_email, function (err, result) {
        if (err) return reply(err).code(400);

        addSendGridRecipients(data.list, data.name, function (err, result) {
          if (err) return reply(err).code(400);

          if (createDraft) {
            reply({message: 'Draft created.', name: data.name});
          } else {
            addSendGridSchedule(data.name, function (err, result) {
              if (err) return reply(err).code(400);

              reply({message: 'Email sent.', name: data.name});
            });
          }
        })
      });
    })
  });
}



function scheduledNewsletter (request, reply) {
  
  queryOneNewsletter(request.params.id, function (err, newsletter) {

    if (newsletter.template_html === undefined || newsletter.template_html === null ||
        newsletter.template_plain === undefined || newsletter.template_plain === null ||
        newsletter.identity === undefined || newsletter.identity === null ||
        newsletter.bond_type === undefined || newsletter.bond_type === null ||
        newsletter.bond_id === undefined || newsletter.bond_id === null) {

      return reply( { message: 'Newsletter not configured' } ).code(400);
    }

    var list = '',
        name = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id + '_' + Date.now(),
        html_url  = 'http://' + request.info.host + '/templates/' + newsletter.template_html + '?' + newsletter.bond_type + '=' + newsletter.bond_id,
        plain_url = 'http://' + request.info.host + '/templates/' + newsletter.template_plain + '?' + newsletter.bond_type + '=' + newsletter.bond_id;

    if (process.env.LIVE === 'true') {
      list = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id;
    } else if (process.env.TEST_LIST) {
      list = process.env.TEST_LIST;
    } else {
      list = 'Daniel'; // TODO: This is for testing
    }

    download(html_url, function (err, html_email, headers) {

      var subject = decodeURIComponent(headers['x-subject-suggestion']),
          checksum = headers['x-content-checksum'];

      if (newsletter.last_checksum !== undefined && checksum === newsletter.last_checksum) {
        return reply({ message: 'Newsletter checksum conflict', checksum: checksum }).code(409);
      }

      download(plain_url, function (err, plain_email) {

        addSendGridMarketingEmail(newsletter.identity, name, subject, plain_email, html_email, function (err, result) {
          if (err) return reply(err);

          addSendGridCategory('mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id, name);
          addSendGridCategory(newsletter.nyhedsbrev_navn, name);
          addSendGridCategory(newsletter.publisher_navn, name);


          addSendGridRecipients(list, name, function (err, result) {
            if (err) return reply(err);

            addSendGridSchedule(name, function (err, result) {
              if (err) return reply(err);

              updateScheduledNyhedsbrevLastChecksum(request.params.id, checksum);

              reply({message: 'Email sent.', name: name});
            });
          })
        });
      });
    });
  });
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
    '&subject=' + subject +
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


function addSendGridSchedule (name, callback) {
  // TODO: 'at' and 'after' are possible values but not used right now
  // See https://sendgrid.com/docs/API_Reference/Marketing_Emails_API/schedule.html#-add

  callSendGrid('/api/newsletter/schedule/add.json', 'name=' + name, callback)
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
