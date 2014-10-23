/*jshint node: true */

'use strict';

var http = require('http'),
    https = require('https'),
    eventEmitter = require('events').EventEmitter,
    workerEmitter = new eventEmitter(),
    mdb = require('../../mdb_client.js'),
    userdb = require('../../userdb_client.js');

module.exports = [
  {
    method: 'get',
    path: '/newsletters',
    handler: selectAllNewsletters
  },{
    method: 'get',
    path: '/sendgrid/identities',
    handler: listSendGridIdentities
  },{
    method: 'get',
    path: '/sendgrid/identities/{id}',
    handler: getSendGridIdentity
  },{
    method: 'get',
    path: '/sendgrid/lists',
    handler: getSendGridLists
  },{
    method: ['put','post'],
    path: '/newsletters/send',
    handler: adhocNewsletter
  },{
    method: ['put','post'],
    path: '/newsletters/draft',
    handler: adhocNewsletter
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
};


// function selectNewsletterSubscribers (request, reply) {
//   var sql = ['SELECT member_id',
//     'FROM subscription_member',
//     'WHERE active = 1 AND subscription_id = ' + request.params.id].join(' ');
  
//   userdb.query(sql, function (err, result) {
//     if (err) return reply(err);
//     else {
//         // Mapping the result down to
//         //  [107043, 104760, 1657432, 385718]
//         // instead of 
//         //  [ { "member_id": 107043 }, { "member_id": 104760 }]

//       reply(result.map(function (member) {
//         return member.member_id;
//       })).
//       header('X-Member-Count', result.length);
//     }
//   });
// };

// function selectNewsletterSubscribersCount (request, reply) {
//   var sql = ['SELECT count(id) as count',
//     'FROM subscription_member',
//     'WHERE active = 1 AND subscription_id = ' + request.params.id].join(' ');
  
//   userdb.queryOne(sql, function (err, result) {
//     if (err) return reply(err);
//     else reply(result).header('X-Member-Count', result.count);
//   });
// };


// function sendTestEmail (request, reply) {
//   var data = request.payload;

//   if (data.from_email === undefined ||
//       data.from_name === undefined ||
//       data.subject === undefined ||
//       data.html_url === undefined ||
//       data.recipients === undefined) {

//     reply().code(400);

//   } else {

//     var sendTail = request.tail('Send email');

//     download(data.html_url, function (err, html) {
//       data.subject = 'FAKE';
//       data.html = html;
//       sendPreview(data, function (err, data) {
//         console.log('AWS send', err, data);
//         sendTail();
//       });
//     });
    
//     reply().code(200);
//   }
// }


// function selectNewsletterRecipientEmails (newsletterId, callback) {
//   var sql = ['SELECT email.email_address',
//     'FROM subscription_member',
//     'LEFT JOIN email ON email.id = subscription_member.email_id',
//     'WHERE subscription_id = ' + newsletterId ].join(' ');

//   userdb.query(sql, function (err, subscription_members) {
//     if (err) return callback(err);

//     var recipients_email_addresses = subscription_members.map(function (subscription_member) {
//       return subscription_member.email_address;
//     });
//     callback(null, recipients_email_addresses);
//   });
// }


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
    console.log('Got error while requesting HTML: ' + e.message);
    callback(e, null);
  });
}


// function sendPreview (data, callback) {

//   data.text = 'To be filled out.';

//   // We're only accepting @berlingskemedia.dk emails
//   data.recipients = data.recipients.filter(function (email) {
//     return email.indexOf("@berlingskemedia.dk") === email.lastIndexOf("@");
//   });

//   var params = {
//     Destination: { /* required */
//       // BccAddresses: [
//       //   'STRING_VALUE',
//       //   /* more items */
//       // ],
//       // CcAddresses: [
//       //   'STRING_VALUE',
//       //   /* more items */
//       // ],
//       ToAddresses: data.recipients
//     },
//     Message: { /* required */
//       Body: { /* required */
//         Html: {
//           Data: data.html, /* required */
//           Charset: 'UTF-8'
//         },
//         Text: {
//           Data: data.text, /* required */
//           Charset: 'UTF-8'
//         }
//       },
//       Subject: { /* required */
//         Data: data.subject, /* required */
//         Charset: 'UTF-8'
//       }
//     },
//     Source: 'dako@berlingskemedia.dk', /* required */
//     ReplyToAddresses: [
//       'dako@berlingskemedia.dk',
//       /* more items */
//     ],
//     ReturnPath: 'dako@berlingskemedia.dk'
//   };

//   console.log('SES sendEmail params:', params);

//   ses.sendEmail(params, callback);
// }


function adhocNewsletter (request, reply) {

  var data = request.payload,
      send = request.route.path === '/apis/v0/newsletters/send'; // This must be done in a better way than hardcoding the path

  if (data.list === undefined)
    return reply({message: 'Field list is missing.' });
  if (data.identity === undefined)
    return reply({message: 'Field identity is missing.' });
  if (data.html === undefined && data.html_url === undefined)
    return reply({message: 'Field html or html_url is missing.' });
  if (data.subject === undefined)
    return reply({message: 'Field subject is missing.' });
  if (data.name === undefined)
    data.name = 'newsletter_' + Date.now();

  download(data.html_url, function (err, html_email) {
    if (err) return reply(err);

    data.html = html_email;

    download(data.plain_url, function (err, plain_email) {
      if (err) return reply(err);

      data.plain = plain_email;
      
      addSendGridMarketingEmail(data.identity, data.name, data.subject, data.plain, data.html, function (err, result) {
        console.log('addSendGridMarketingEmail', err, result);
        if (err) return reply(err).code(400);

        addSendGridRecipients(data.list, data.name, function (err, result) {
          console.log('addSendGridRecipients', err, result);
          if (err) return reply(err).code(400);

          if (send) {
            addSendGridSchedule(data.name, function (err, result) {
              console.log('addSendGridSchedule', err, result);
              if (err) return reply(err).code(400);

              reply({message: 'Email sent.', name: data.name});
            });
          } else {
            reply({message: 'Draft created.', name: data.name});
          }
        })
      });
    })
  });


  // function create () {
  //   addSendGridMarketingEmail(data.identity, data.name, data.subject, data.plain, data.html, function (err, result) {
  //     console.log('addSendGridMarketingEmail', err, result);
  //     if (err) return reply(err).code(400);

  //     addSendGridRecipients(data.list, data.name, function (err, result) {
  //       console.log('addSendGridRecipients', err, result);
  //       if (err) return reply(err).code(400);

  //       if (send) {
  //         addSendGridSchedule(data.name, function (err, result) {
  //           console.log('addSendGridSchedule', err, result);
  //           if (err) return reply(err).code(400);

  //           reply({message: 'Email sent.', name: data.name});
  //         });
  //       } else {
  //         reply({message: 'Draft created.', name: data.name});
  //       }
  //     })
  //   });
  // }
}



// function sendNewsletterAdhoc (request, reply) {
//   var data = request.payload;
//   data.recipients = ['dako@berlingskemedia.dk'];

//   if (data.html === undefined || data.html === null) {
//     download(data.html_url, function (err, html) {
//       data.html = html;
//       sendPreview(data, function (err, result) {
//         reply();
//       });
//     });
//   } else {
//     sendPreview(data, function (err, result) {
//       reply();
//     });
//   }
// }


function scheduledNewsletter (request, reply) {
  
  queryOneNewsletter(request.params.id, function (err, newsletter) {

    var html_url = request.server.info.uri + '/templates/' + newsletter.template_html + '?' + newsletter.bond_type + '=' + newsletter.bond_id;
    var plain_url = request.server.info.uri + '/templates/' + newsletter.template_plain + '?' + newsletter.bond_type + '=' + newsletter.bond_id;

    console.log('ulerer', html_url, plain_url);

    download(html_url, function (err, html_email, headers) {

      var subject = decodeURIComponent(headers['x-subject-suggestion']),
          identity = newsletter.identity,
          list = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id,
          name = 'mdb_nyhedsbrev_' + newsletter.nyhedsbrev_id + '_' + Date.now();

      addSendGridMarketingEmail(newsletter.identity, name, subject, 'TODO add text version', html_email, function (err, result) {
        console.log('addSendGridMarketingEmail', err, result);
        if (err) return reply(err);

        addSendGridRecipients(list, name, function (err, result) {
          console.log('addSendGridRecipients', err, result);
          if (err) return reply(err);

          addSendGridSchedule(name, function (err, result) {
            console.log('addSendGridSchedule', err, result);
            if (err) return reply(err);

            reply({message: 'Email sent.', name: name});
          });
        })
      });
    });
  });
}

function getSendGridLists (request, reply) {
  callSendGrid('/api/newsletter/lists/get.json', function (err, data) {
    if (err) return reply(err).code(500);
    else reply(data.map(function (list) {
      return list.list;
    }));
  });
}


function listSendGridIdentities (request, reply) {
  callSendGrid('/api/newsletter/identity/list.json', function (err, data) {
    if (err) return reply(err).code(500);
    else reply(data.map(function (identity) {
      return identity.identity;
    }));
  });
}

function getSendGridIdentity (request, reply) {
  var body = 'identity=' + request.params.id;

  callSendGrid('/api/newsletter/identity/get.json', body, function (err, data) {
    if (err) return reply(err).code(500);
    reply(data);
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
