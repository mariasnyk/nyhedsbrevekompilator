'use strict';

var http = require('http'),
    bondHost = process.env.BOND_HOSTNAME;

module.exports.getNode = function (id, callback) {
  getFromBond('node', id, callback);
}


module.exports.getNodequeue = function (id, callback) {
  getFromBond('nodequeue', id, callback);
}


function getFromBond ( type, id, callback ) {
  if (!isValidId(id)) {
    return callback(null,null);
  }

  var options = {
    host: bondHost,
    path: '/bondapi/' + type + '/' + id + '.ave-json',
    method: 'GET'
  };

  http.get(options, function( response ) {
    if (response.statusCode === 401) {
      return callback (null, null);
    } else if (response.statusCode !== 200) {
      return callback (response.statusCode, null);
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
    console.log('Got error while requesting BOND ('+ options.host + options.path + '): ' + e.message);
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
