/*jshint node: true */

'use strict';

var AWS = require('aws-sdk'),
    ses = new AWS.SES(),
    http = require('http'),
    database = require('../../database.js');

module.exports.selectAllNewsletters = function (request, reply) {
  var query = 'SELECT subscription.*, publisher.name as publisher_name FROM subscription LEFT JOIN publisher ON publisher.id = subscription.publisher_id';

  database.query(query, function (err, result) {
    if (err) return reply(err);
    reply(result);
  });
};

module.exports.selectNewsletter = function (request, reply) {
  var query = 'SELECT * FROM subscription WHERE id = ' + request.params.id;

  database.query(query, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      reply(result[0]);
    }
  });
};

module.exports.sendTestEmail = function (request, reply) {

  var data = request.payload;
  if (data.from_email === undefined ||
      data.from_name === undefined ||
      data.subject === undefined ||
      data.html_url === undefined ||
      data.recipients === undefined) {

    reply().code(400);

  } else {

    var sendTail = request.tail('Send email');

    downloadHtml(data.html_url, function (err, message) {
      data.message = message;
      sendPreview(data, function (err, data) {
        sendTail();
      });
    });
    
    reply().code(200);
  }
};


function downloadHtml (url, callback) {
  console.log('Requesting on', url);

  http.get( url, function( response ) {

    console.log('HTTP ' + response.statusCode + ' response from', url);

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
      console.log('Response ended.');
      callback(null, data);
    });
  }).on('error', function(e) {
    console.log('Got error while requesting: ' + e.message);
    callback(e, null);
  });
}


function sendPreview (data, callback) {

  var params = {
    Destination: { /* required */
      // BccAddresses: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
      // CcAddresses: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
      ToAddresses: data.recipients
    },
    Message: { /* required */
      Body: { /* required */
        Html: {
          Data: data.message, /* required */
          Charset: 'UTF-8'
        },
        Text: {
          Data: 'To be filled out.', /* required */
          Charset: 'UTF-8'
        }
      },
      Subject: { /* required */
        Data: data.subject, /* required */
        Charset: 'UTF-8'
      }
    },
    Source: data.from_email, /* required */
    ReplyToAddresses: [
      'dako@berlingskemedia.dk',
      /* more items */
    ],
    ReturnPath: 'dako@berlingskemedia.dk'
  };

  ses.sendEmail(params, callback);
}