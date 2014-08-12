'use strict';

var database = require('../../database.js');


module.exports.selectAllMembers = function (request, reply) {
  var query = 'SELECT * FROM member';

  database.query(query , function (err, members) {
    if (err) reply(err).code(500);

    reply(members);
  });
};


module.exports.insertMember = function (request, reply) {
  var query = 'INSERT INTO member';
  query = 'SHOW CREATE TABLE member';

  database.query(query, function (err, result) {
    console.log(err);
    if (err) return reply(err);

    console.log('result');
    console.log(result);
    reply().code(201);
  });
};


// 'SHOW CREATE TABLE member'
// [ { Table: 'member',
  //   'Create Table': 
  // 'CREATE TABLE `member` (
  //   `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  //   `firstname` varchar(255) DEFAULT \'\',
  //   `lastname` varchar(255) DEFAULT \'\',
  //   `coname` varchar(255) DEFAULT \'\',
  //   `birth_year` year(4) DEFAULT NULL,
  //   `birth_date` date DEFAULT NULL,
  //   `gender` char(1) DEFAULT \'\',
  //   `username` varchar(255) DEFAULT \'\',
  //   `password` varchar(255) DEFAULT \'\',
  //   `status` enum(\'inactive\',\'active\') NOT NULL DEFAULT \'inactive\',
  //   `company` varchar(255) DEFAULT \'\',
  //   `company_cvr` varchar(255) DEFAULT \'\',
  //   `is_internal` tinyint(1) NOT NULL DEFAULT \'0\',
  //   `robinson_flag` tinyint(1) unsigned NOT NULL DEFAULT \'0\',
  //   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  //   `activated_at` datetime DEFAULT NULL,
  //   `updated_at` datetime DEFAULT NULL,
  //   PRIMARY KEY (`id`)
  //   ) ENGINE=InnoDB DEFAULT CHARSET=utf8' } ]

