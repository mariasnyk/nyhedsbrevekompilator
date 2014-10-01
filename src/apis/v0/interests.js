/*jshint node: true */

'use strict';

var database = require('../../database.js');

module.exports.selectAllInterests = function (request, reply) {
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

module.exports.selectInterest = function (request, reply) {
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
