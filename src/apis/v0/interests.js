/*jshint node: true */

'use strict';

var database = require('../../userdb_client.js');

module.exports = [
  // {
  //   method: 'get',
  //   path: '/interests',
  //   handler: selectAllInterests
  // },{
  //   method: 'get',
  //   path: '/interests/{id}',
  //   handler: selectInterest
  // }
];

function selectAllInterests (request, reply) {
  //var sql = 'SELECT * FROM interest';
  var sql = ['SELECT interest.*, interest_parent.name AS interest_parent_name, interest_parent.display_name AS interest_parent_display_name',
   'FROM interest',
   'LEFT JOIN interest interest_parent ON interest.parent_id = interest_parent.id'].join(' ');

  database.query(sql, function (err, result) {
    if (err) return reply(err);


    reply(result.map(removeInterestParentIfNull));
  });
};


function removeInterestParentIfNull (interest) {
  if (interest.parent_id === null) {
    delete interest.interest_parent_name;
    delete interest.interest_parent_display_name;
  }
  return interest;
}


function selectInterest (request, reply) {
  var sql = 'SELECT * FROM interest WHERE id = ' + request.params.id;

  database.query(sql, function (err, result) {
    if (err) return reply(err);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      reply(result[0]);
    }
  });
};
