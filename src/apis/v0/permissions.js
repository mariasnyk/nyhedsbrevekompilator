/*jshint node: true */

'use strict';

var database = require('../../database.js');

module.exports.selectAllPermissions = function (request, reply) {
  var query = 'SELECT * FROM permission';

  database.query(query, function (err, result) {
    if (err) return reply(err);
    reply(result);
  });
};

module.exports.selectPermission = function (request, reply) {
  var query = 'SELECT * FROM permission WHERE id = ' + request.params.id;

  database.query(query, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      reply(result[0]);
    }
  });
};
