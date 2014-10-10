/*jshint node: true */

'use strict';

var database = require('../../database.js');

module.exports.selectAllMembers = function (request, reply) {
  var sql = 'SELECT * FROM member LIMIT 1000';
  
  database.query(sql , function (err, members) {
    if (err) return reply(err);//.code(500);

    reply(members);
  });
};


module.exports.selectMember = function (request, reply) {
  // select * from member left join email on email.member_id = member.id where member.id=443765;
  var sql = 'SELECT * FROM member WHERE id = ' + request.params.id;

  database.query(sql , function (err, result) {
    if (err) return reply(err);//.code(500);
    if (result.length === 0) reply().code(404);
    else if (result.length > 1) reply().code(509);
    else {
      var member = result[0];

      // TODO: Do this with eventEmitter instead.

      database.query('SELECT * FROM email WHERE member_id = ' + member.id, function (err, emails) {
        member.emails = emails;

        database.query('SELECT * FROM address WHERE member_id = ' + member.id, function (err, addresses) {
          member.addresses = addresses;

          var sql = ['SELECT phone.*, phone_type.type',
            'FROM phone',
            'LEFT JOIN phone_type ON phone.type_id = phone_type.id',
            'WHERE member_id = ' + member.id].join(' ');

          database.query(sql, function (err, phones) {
            member.phones = phones;

            var sql = ['SELECT interest_line.*, interest.name AS interest_name, interest.display_name AS interest_display_name, interest.description AS interest_description, interest_parent.name AS interest_parent_name, location.description AS location_description',
             'FROM interest_line',
             'LEFT JOIN interest ON interest_line.interest_id = interest.id',
             'LEFT JOIN interest interest_parent ON interest.parent_id = interest_parent.id',
             'LEFT JOIN location ON location.id = interest_line.location_id',
             'WHERE interest_line.member_id = ' + member.id].join(' ');

            database.query(sql, function (err, interests) {
              member.interests = interests;

              var sql = ['SELECT subscription_member.*, subscription.name AS newsletter_name, email.email_address, location.description AS location_description',
              'FROM subscription_member',
              'LEFT JOIN subscription ON subscription.id = subscription_member.subscription_id',
              'LEFT JOIN email ON email.id = subscription_member.email_id',
              'LEFT JOIN location ON location.id = subscription_member.location_id',
              'WHERE subscription_member.member_id = ' + member.id].join(' ');

              database.query(sql, function (err, subscriptions) {
                member.subscriptions = subscriptions;

                var sql = ['SELECT permission_member.*, permission.name AS permission_name, email.email_address, location.description AS location_description',
                'FROM permission_member',
                'LEFT JOIN permission ON permission.id = permission_member.permission_id',
                'LEFT JOIN email ON email.id = permission_member.email_id',
                'LEFT JOIN location ON location.id = permission_member.location_id',
                'WHERE permission_member.member_id = ' + member.id].join(' ');

                database.query(sql, function (err, permissions) {
                  member.permissions = permissions;

                  reply(member);
                });
              });
            });
          });
        });
      });
    }
  });
};


module.exports.searchMembers = function(request, reply) {
  console.log('Search', request.query);
  //console.log(Object.keys(request.query));
  var queryinput = request.query.text;

  var a = '+'.concat(queryinput.split(' ').join(' +'));
  var sql = ['SELECT member.id, member.firstname, member.lastname, member.status, email.email_address',
    'FROM member',
    'LEFT JOIN email ON email.member_id = member.id',
    'WHERE MATCH(firstname, lastname) AGAINST("' + a + '" IN BOOLEAN MODE)'].join(' ');
  console.log(sql);

  database.query(sql , function (err, result) {
    if (err) return reply(err);//.code(500);

    reply(result);
  });
}


module.exports.insertMember = function (request, reply) {
  var sql = member.insert({
    lastname: 'Jane',
    firstname: 'Doe',
    coname: "None",
    birth_date: new Date().toISOString()
  }).getString();

  console.log(sql);
  // var query = 'INSERT INTO member ' +
  //  '(firstname, lastname, coname, birth_year, birth_date, gender, username, password, status, company, company_cvr, is_internal, robinson_flag, activated_at, updated_at )' +
  //   ' VALUES ' + 
  //   ' ("John", "Doe", "", "", "23-08-1981", "m", "", "", "active", "", "", "0", "0", "13-08-2014", "13-08-2014")';

  database.query(sql.text, function (err, result) {
    console.log(err);
    if (err) return reply(err);

    console.log('result');
    console.log(result);
    reply({id: result.insertId}).code(201);
  });
};
