'use strict';

var http = require('http'),
    bondHost = process.env.BOND_HOSTNAME,
    bondQuery = process.env.BOND_QUERYSTRING;



module.exports.getNode = function (id, callback) {
  getFromBond('node', id, callback);
};


module.exports.getNodequeue = function (id, callback) {
  getFromBond('nodequeue', id, callback);
};

module.exports.getNodequeueControlroomUrl = function (id) {
  return 'http://' + bondHost + '/admin/content/nodequeue/' + id + '/view';
};

module.exports.getNodeControlroomUrl = function (id) {
  return 'http://' + bondHost + '/node/' + id + '/edit';
};


function getFromBond ( type, id, callback ) {
  if (!isValidId(id)) {
    return callback(null,null); // Results in "404 Not found" responses
  }

  var options = {
    host: bondHost,
    path: '/bondapi/' + type + '/' + id + '.ave-json' + bondQuery,
    method: 'GET'
  };

  http.get(options, function( response ) {

    console.log('BOND response (' + options.host + options.path + ') status: ' + response.statusCode);

    if (response.statusCode === 401) {
      return callback (null, null);
    } else if (response.statusCode !== 200 && response.statusCode !== 304) {
      return callback ({ status: response.statusCode }, null);
    }

    var data = '';
    response.setEncoding('utf8');

    response.on('data', function ( chunk ) {
      data += chunk;
    });

    response.on('end', function() {
      callback(null, JSON.parse( data ) );
    });
  }).on('error', function(e) {
    console.log('BOND request ' + options.host + options.path + ' error: ' + e.message);
    callback(e, null);
  });
}


function isValidId (nodeid) {
  var temp = null;
  //E.g.: 28107558
  if (nodeid === undefined || nodeid === null) {
    return false;
  }

  if (typeof(nodeid) !== 'number') {
    try {
      temp = Number(nodeid);
    }
    catch (e) {
      return false;
    }
  }

  return typeof(temp) === 'number';
}
