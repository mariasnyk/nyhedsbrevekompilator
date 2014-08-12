var test = require('./test.js');


module.exports = function (prefix) {

  return [{
    method: 'GET',
    path: '/' + prefix + '/hello',
    handler: function (request, reply) {
      //mysql.query();
      test.test();
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