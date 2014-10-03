/*jshint node: true */

'use strict';

var members = require('./members.js'),
    publishers = require('./publishers.js'),
    newsletters = require('./newsletters.js'),
    permissions = require('./permissions.js'),
    interests = require('./interests.js');

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
    method: 'get',
    path: '/' + prefix + '/newsletters',
    handler: newsletters.selectAllNewsletters
  },{
    method: 'get',
    path: '/' + prefix + '/newsletters/{id}',
    handler: newsletters.selectNewsletter
  },{
    method: ['post','put'],
    path: '/' + prefix + '/newsletters/{id}',
    handler: newsletters.saveNewsletter
  },{
    method: 'get',
    path: '/' + prefix + '/newsletters/{id}/subscribers',
    handler: newsletters.selectNewsletterSubscribers
  },{
    method: 'options',
    path: '/' + prefix + '/newsletters/{id}/subscribers',
    handler: newsletters.selectNewsletterSubscribersCount
  },{
    method: 'get',
    path: '/' + prefix + '/newsletters/{id}/subscribers/count',
    handler: newsletters.selectNewsletterSubscribersCount
  },{
    method: 'post',
    path: '/' + prefix + '/newsletters/{id}/send',
    handler: newsletters.sendNewsletter
  },{
    method: 'get',
    path: '/' + prefix + '/permissions',
    handler: permissions.selectAllPermissions
  },{
    method: 'get',
    path: '/' + prefix + '/permissions/{id}',
    handler: permissions.selectPermission
  },{
    method: 'get',
    path: '/' + prefix + '/permissions/{id}/subscribers',
    handler: permissions.selectPermissionSubscribers
  },{
    method: 'get',
    path: '/' + prefix + '/interests',
    handler: interests.selectAllInterests
  },{
    method: 'get',
    path: '/' + prefix + '/interests/{id}',
    handler: interests.selectInterest
  },{
    method: 'post',
    path: '/' + prefix + '/newsletters/tester',
    handler: newsletters.sendTestEmail
  }
  ];
}
