'use strict';

var database = require('../../database.js'),
    util = require("util");

module.exports.selectAllMembers = function (request, reply) {
  var query = 'SELECT * FROM member';
  
  database.query(query , function (err, members) {
    if (err) reply(err);//.code(500);

    reply(members);
  });
};


module.exports.selectMember = function (request, reply) {
  var query = 'SELECT * FROM member WHERE id=' + request.params.id;

  database.query(query , function (err, member) {
    if (err) reply(err);//.code(500);

    reply(member);
  });
};


module.exports.insertMember = function (request, reply) {
  var query = member.insert({
    lastname: 'Jane',
    firstname: 'Doe',
    coname: "None",
    birth_date: new Date().toISOString()
  }).getString();

  console.log(query);
  // var query = 'INSERT INTO member ' +
  //  '(firstname, lastname, coname, birth_year, birth_date, gender, username, password, status, company, company_cvr, is_internal, robinson_flag, activated_at, updated_at )' +
  //   ' VALUES ' + 
  //   ' ("John", "Doe", "", "", "23-08-1981", "m", "", "", "active", "", "", "0", "0", "13-08-2014", "13-08-2014")';

  database.query(query.text, function (err, result) {
    console.log(err);
    if (err) return reply(err);

    console.log('result');
    console.log(result);
    reply({id: result.insertId}).code(201);
  });
};



// var member = sql.define({
//   name: 'member',
//   columns: ['firstname', 'lastname', 'coname', 'birth_year', 'birth_date', 'gender', 'username', 'password', 'status', 'company', 'company_cvr', 'is_internal', 'robinson_flag', 'activated_at', 'updated_at']
// });


// var sql = function () {};

// sql.prototype.insert = function () {
//   return 'INSERT INTO' + tableName;
// };

// var member = function () {
//   this.tableName = 'member';

//   // firstname: 'test',
//   // lastname: 'lsls'
// };
// util.inherits(member, sql);

// console.log('new member.insert()');
// console.log(new member());
// console.log(new member().insert());

// function test(input) {
//   for (var k in input) {
//     console.log(k + '=' + input[k]);
//   }
// }
// test(member);


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



// address

//   id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   member_id` int(11) unsigned NOT NULL,
//   active` tinyint(1) unsigned NOT NULL DEFAULT \'1\',
//   type` enum(\'billing\',\'shipping\') NOT NULL DEFAULT \'billing\',
//   system_id` int(11) unsigned NOT NULL,
//   road_name` varchar(255) DEFAULT \'\',
//   house_number` varchar(10) DEFAULT \'\',
//   house_letter` varchar(10) DEFAULT \'\',
//   floor` varchar(10) DEFAULT \'\',
//   side_door` varchar(10) DEFAULT \'\',
//   place_name` varchar(40) DEFAULT \'\',
//   city` varchar(70) DEFAULT \'\',
//   postal_number` varchar(32) DEFAULT \'\',
//   country_code` char(2) DEFAULT NULL,
//   created_at` timestamp NULL DEFAULT NULL,
//   updated_at` datetime DEFAULT NULL,
//   PRIMARY KEY (`id`),\n  UNIQUE KEY `address_id_UNIQUE` (`id`),
//   KEY `address_member_uid_idx` (`member_id`),
//   KEY `address_source_uid_idx` (`system_id`),
//   CONSTRAINT `address_source_uid` FOREIGN KEY (`system_id`) REFERENCES `system` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,\n  CONSTRAINT `address_member_uid` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION\n) ENGINE=InnoDB DEFAULT CHARSET=utf8' } ]

// email

//   id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   member_id` int(11) unsigned NOT NULL,
//   email_address` varchar(255) DEFAULT \'\',
//   system_id` int(11) unsigned NOT NULL,
//   active` tinyint(3) unsigned NOT NULL DEFAULT \'1\',
//   created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//   updated_at` datetime DEFAULT NULL,
//   PRIMARY KEY (`id`),\n  UNIQUE KEY `email_id_UNIQUE` (`id`),
//   KEY `source_system_id_idx` (`system_id`),
//   KEY `fk_email_member_idx` (`member_id`),\n  CONSTRAINT `source_system_id` FOREIGN KEY (`system_id`) REFERENCES `system` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,\n  CONSTRAINT `fk_email_member1` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION\n) ENGINE=InnoDB DEFAULT CHARSET=utf8' } ]

// location

//   id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   description` varchar(255) NOT NULL DEFAULT \'\',
//   active` tinyint(4) NOT NULL DEFAULT \'1\',
//   PRIMARY KEY (`id`),\n  UNIQUE KEY `source_id_UNIQUE` (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8' } ]

// phone

//   id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   member_id` int(11) unsigned NOT NULL,
//   type_id` int(11) unsigned NOT NULL,
//   system_id` int(11) unsigned NOT NULL,
//   number` varchar(50) NOT NULL DEFAULT \'\',
//   status` tinyint(4) NOT NULL,
//   created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//   PRIMARY KEY (`id`),\n  UNIQUE KEY `phone_id_UNIQUE` (`id`),
//   KEY `phone_member_uid_idx` (`member_id`),\n  KEY `phone_type_uid_idx` (`type_id`),\
//   KEY `phone_system_uid_idx` (`system_id`),\n  CONSTRAINT `phone_system_uid` FOREIGN KEY (`system_id`) REFERENCES `system` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,\n  CONSTRAINT `phone_member_uid` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,\n  CONSTRAINT `phone_type_uid` FOREIGN KEY (`type_id`) REFERENCES `phone_type` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION\n) ENGINE=InnoDB DEFAULT CHARSET=utf8' } ]

