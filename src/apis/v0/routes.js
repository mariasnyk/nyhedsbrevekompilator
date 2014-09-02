'use strict';

var members = require('./members.js');


module.exports = function (prefix) {

  return [
  {
    method: 'GET',
    path: '/' + prefix + '/members',
    handler: members.selectAllMembers
  },
  {
    method: 'GET',
    path: '/' + prefix + '/members/{id}',
    handler: members.selectMember
  },
  {
    method: 'POST',
    path: '/' + prefix + '/members',
    handler: members.insertMember
  }
  ];
}
