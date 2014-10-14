/*jshint node: true */

'use strict';

var database = require('../../userdb_client.js');

module.exports = [
  // {
  //   method: 'get',
  //   path: '/publishers',
  //   handler: selectAllPublishers
  // },{
  //   method: 'get',
  //   path: '/publishers/{id}',
  //   handler: selectPublisher
  // }
];

function selectAllPublishers (request, reply) {
  var sql = 'SELECT * from publisher';

  database.query(sql, function (err, result) {
    if (err) return reply(err);
    reply(result);
  });
};


function selectPublisher (request, reply) {
  var sql = 'SELECT * from publisher WHERE id = ' + request.params.id;

  database.query(sql, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      var publisher = result[0];

      database.query('SELECT * FROM subscription WHERE publisher_id = ' + publisher.id, function (err, result) {
        publisher.newsletters = result;

        reply(publisher);
      });
    }
  });
};