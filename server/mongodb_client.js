/*jshint node: true */
'use strict';

const MongoClient = require('mongodb').MongoClient;
var db;

const mongodb_host = process.env.MONGODB_HOST !== undefined ? process.env.MONGODB_HOST : '127.0.0.1';
const mongodb_port = process.env.MONGODB_PORT !== undefined ? process.env.MONGODB_PORT : '27017';
const mongodb_database = process.env.MONGODB_DATABASE !== undefined ? process.env.MONGODB_DATABASE : 'nyhedsbrevekompilator';

MongoClient.connect('mongodb://' + mongodb_host + ':' + mongodb_port + '/' + mongodb_database, function(err, database) {
  db = database;
  if (err) throw err;
  else console.log('Connecting to Mongo on', mongodb_host);
});

module.exports.close = function(callback) {
  db.close(callback);
};

module.exports.collection = function(collectionName) {
  return db.collection(collectionName);
};

module.exports.nyhedsbreve = function () {
  return db.collection('nyhedsbreve');
};
