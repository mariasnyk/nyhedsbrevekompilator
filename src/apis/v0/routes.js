'use strict';

var members = require('./members.js');


module.exports = function (prefix) {

  return [{
    method: 'GET',
    path: '/' + prefix + '/members',
    handler: function (request, reply) {
      //mysql.query();
      members.getAllMembers();
      reply('hello world');
    }
  }
  ];

}

// Add the route
// server.route({
//     method: 'GET',
//     path: '/hello',
//     handler: function (request, reply) {
//       mysql.query();
//       reply('hello world');
//     }
// });