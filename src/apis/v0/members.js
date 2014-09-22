'use strict';

var database = require('../../database.js'),
    util = require("util");

module.exports.selectAllMembers = function (request, reply) {
  var query = 'SELECT * FROM member LIMIT 1000';
  
  database.query(query , function (err, members) {
    if (err) reply(err);//.code(500);

    reply(members);
  });
};


module.exports.selectMember = function (request, reply) {
  var query = 'SELECT * FROM member WHERE id=' + request.params.id;

  database.query(query , function (err, member) {
    if (err) reply(err);//.code(500);
    if (member.length === 0) reply().code(404);
    else if (member.length > 1) reply().code(509);
    else reply(member[0]);
  });
};


module.exports.searchMembers = function(request, reply) {
  console.log('Search', request.query);
  var queryinput = request.query.text;

  var query = 'SELECT * from member WHERE firstname LIKE "%' + queryinput + '%" OR lastname LIKE "%' + queryinput + '%"';

  database.query(query , function (err, result) {
    if (err) reply(err);//.code(500);

    reply(result);
  });
}


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
