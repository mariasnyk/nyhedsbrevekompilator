'use strict';

var http = require('http'),
    bondapiUrl = process.env.BOND_API;

module.exports.getNode = function (id, callback) {
  getFromBond('node', id, callback);
}


module.exports.getNodequeue = function (id, callback) {
  getFromBond('nodequeue', id, callback);
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

  // Lists are below 10000000 so this validation is propably not a good idea.
  // if (isNaN(nodeid) || nodeid < 10000000) {
  //   return false;
  // }

  return typeof(temp) === 'number';
}


function getFromBond ( type, id, callback ) {
  if (!isValidId(id)) {
    return callback(null,null);
  }

  var href = bondapiUrl + '/' + type + '/' + id + '.ave-json';
  console.log('Requesting BOND on ' + href);

  http.get( href, function( response ) {

    console.log('HTTP ' + response.statusCode + ' response from BOND.');

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
      console.log('Response from BOND ended.');
      callback(null, JSON.parse( data ) );
    });
  }).on('error', function(e) {
    console.log('Got error while requesting BOND: ' + e.message);
    callback(e, null);
  });
}
