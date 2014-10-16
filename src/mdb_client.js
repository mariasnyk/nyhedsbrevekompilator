/*jshint node: true */
'use strict';

var pg = require('pg');

console.log('Connecting to ' + process.env.MDB_ADDRESS +' as ' + process.env.MDB_USERNAME + '...');

//conString format "postgres://username:password@localhost/database";
var conString = 'postgres://' + process.env.MDB_USERNAME + ':' + process.env.MDB_PASSWORD + '@' + process.env.MDB_ADDRESS + ':' + process.env.MDB_PORT + '/' + process.env.MDB_DATABASE;

module.exports.query = function (sql, callback) {
  pg.connect(conString, function (err, client, done) {
    client.query(sql, function (err, result) {
      done();
      callback(err, result);
    });
  });
};

module.exports.queryOne = function (sql, callback) {
  module.exports.query(sql, function (err, result) {
    if (err) throw err;
    else if (result.rowCount === 0)
      callback(null, null);
    else if (result.rowCount > 1)
      callback(new Error('Too many results'));
    else
      callback(null, result.rows[0]);
  });
};
