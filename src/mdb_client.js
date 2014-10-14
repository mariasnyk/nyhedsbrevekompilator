/*jshint node: true */
'use strict';

var pg = require('pg');

//conString format "postgres://username:password@localhost/database";
var conString = 'postgres://' + process.env.MDB_USERNAME + ':' + process.env.MDB_PASSWORD + '@' + process.env.MDB_ADDRESS + ':' + process.env.MDB_PORT + '/' + process.env.MDB_DATABASE;
var client = {};

console.log('Connecting to ' + process.env.MDB_ADDRESS +' as ' + process.env.MDB_USERNAME + '...');

var client = new pg.Client(conString);
client.connect(function(err) {
  if (err) {
    console.error('error fetching client from pool', err);
    console.log('Maybe the ENV config is missing.');
    return;
  }
});

module.exports = client;


module.exports.queryOne = function (sql, callback) {
  client.query(sql, function (err, result) {
    if (err) throw err;
    else if (result.rowCount === 0)
      callback(null, null);
    else if (result.rowCount > 1)
      callback(new Error('Too many results'));
    else
      callback(null, result.rows[0]);
  });
};


