'use strict';

var mysql = require('mysql');

var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

module.exports.query = function () {

  console.log('connecting...');

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }

    console.log('connected as id ' + connection.threadId);
    //console.log(connection);
    connection.query ( 'SHOW TABLES' , function ( err , results , fields ) {
      console.log ('err');
      console.log (err);
      console.log ('results');
      console.log (results);
      console.log ('fields');
      console.log (fields);
      connection.end();
    });
  });
}


