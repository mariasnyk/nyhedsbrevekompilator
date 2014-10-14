/*jshint node: true */

'use strict';

var database = require('../../userdb_client.js');

module.exports = [
  // {
  //   method: 'get',
  //   path: '/permissions',
  //   handler: selectAllPermissions
  // },{
  //   method: 'get',
  //   path: '/permissions/{id}',
  //   handler: selectPermission
  // },{
  //   method: 'get',
  //   path: '/permissions/{id}/subscribers',
  //   handler: selectPermissionSubscribers
  // }
];

function selectAllPermissions (request, reply) {
  var sql = 'SELECT * FROM permission';

  database.query(sql, function (err, result) {
    if (err) return reply(err);
    reply(result);
  });
};

function selectPermission (request, reply) {
  var sql = 'SELECT * FROM permission WHERE id = ' + request.params.id;

  database.query(sql, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      reply(result[0]);
    }
  });
};

function selectPermissionSubscribers (request, reply) {
  var sql = ['SELECT member_id',
    'FROM permission_member',
    'WHERE active = 1 AND permission_id = ' + request.params.id].join(' ');
  
  database.query(sql, function (err, result) {
    if (err) return reply(err);
    else {
        // Mapping the result down to
        //  [107043, 104760, 1657432, 385718]
        // instead of 
        //  [ { "member_id": 107043 }, { "member_id": 104760 }]

      reply(result.map(function (member) {
        return member.member_id;
      })).
      header('X-Member-Count', result.length);
    }
  });
};
