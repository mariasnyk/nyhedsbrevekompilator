'use strict';

var database = require('../../database.js');

module.exports.selectAllPublishers = function (request, reply) {
  var query = 'SELECT * from publisher';

  database.query(query, function (err, result) {
    if (err) return reply(err);
    reply(result);
  });
}

module.exports.selectPublisher = function (request, reply) {
  var query = 'SELECT * from publisher WHERE id = ' + request.params.id;

  database.query(query, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      var publisher = result[0];

      database.query('SELECT * FROM subscription WHERE publisher_id = ' + publisher.id, function (err, result) {
        publisher.subscriptions = result;

        reply(publisher);
      });
    }
  });
}