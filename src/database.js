'use strict';

var mysql = require('mysql');

var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? process.env.MYSQL_PORT : null,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : null 
});

connection.connect(function(err) {
  console.log('Connecting to ' + process.env.MYSQL_HOST +' as ' + process.env.MYSQL_USER + '...');

  if (err) {
    console.error('Error connecting: ' + err.message);
    return;
  }

  console.log('Connected as id ' + connection.threadId);
});

process.on('SIGINT', function() {
  console.log('Closing the database connection.');
  connection.end();
  process.exit();
});

module.exports = connection;
