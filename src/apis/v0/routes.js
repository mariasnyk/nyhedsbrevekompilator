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
    method: 'POST',
    path: '/' + prefix + '/members',
    handler: members.insertMember
  }
  ];
}
