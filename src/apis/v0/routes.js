/*jshint node: true */

'use strict';

var members = require('./members.js'),
    publishers = require('./publishers.js'),
    newsletters = require('./newsletters.js');

module.exports = function (prefix) {

  return [
  {
    method: 'get',
    path: '/' + prefix + '/members',
    handler: members.selectAllMembers
  },{
    method: 'get',
    path: '/' + prefix + '/search/members',
    handler: members.searchMembers
  },{
    method: 'get',
    path: '/' + prefix + '/members/{id}',
    handler: members.selectMember
  },{
    method: 'post',
    path: '/' + prefix + '/members',
    handler: members.insertMember
  },{
    method: 'get',
    path: '/' + prefix + '/publishers',
    handler: publishers.selectAllPublishers
  },{
    method: 'get',
    path: '/' + prefix + '/publishers/{id}',
    handler: publishers.selectPublisher
  },{
    method: 'post',
    path: '/' + prefix + '/newsletters/tester',
    handler: newsletters.sendTestEmail
  }
  ];
}
