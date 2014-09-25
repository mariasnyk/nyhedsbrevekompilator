'use strict';

var members = require('./members.js'),
    publishers = require('./publishers.js');

module.exports = function (prefix) {

  return [
  {
    method: 'GET',
    path: '/' + prefix + '/members',
    handler: members.selectAllMembers
  },
  {
    method: 'GET',
    path: '/' + prefix + '/search/members',
    handler: members.searchMembers
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
  },
  {
    method: 'GET',
    path: '/' + prefix + '/publishers',
    handler: publishers.selectAllPublishers
  },
    {
    method: 'GET',
    path: '/' + prefix + '/publishers/{id}',
    handler: publishers.selectPublisher
  }
  ];
}
